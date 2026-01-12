import { Storage } from "@plasmohq/storage";
import { getCurrentSession, saveCurrentSession, initializeStorage } from "~lib/storage";
import { decrementSession, isSessionExpired, isSessionToday } from "~lib/timer";
import { isTimerTargetPage } from "~lib/url-matcher";

// タイマーインターバルID
let timerInterval: NodeJS.Timeout | null = null;

// ストレージインスタンス
const storage = new Storage();

/**
 * タイマーを開始
 */
function startTimer() {
  if (timerInterval) {
    return; // 既にタイマーが動作中
  }

  timerInterval = setInterval(async () => {
    try {
      const session = await getCurrentSession();

      if (!session || !session.isActive) {
        stopTimer();
        return;
      }

      // セッションが今日のものでない場合はリセット
      if (!isSessionToday(session)) {
        await saveCurrentSession(null);
        stopTimer();
        return;
      }

      // 残り時間をデクリメント
      const updatedSession = decrementSession(session);

      // セッションが終了したかチェック
      if (isSessionExpired(updatedSession)) {
        const finalSession = {
          ...updatedSession,
          remainingSeconds: 0,
          isActive: false,
        };
        await saveCurrentSession(finalSession);
        stopTimer();

        // すべてのX.comタブを振り返り画面に遷移
        await redirectXTabsToReflection();
      } else {
        await saveCurrentSession(updatedSession);
      }
    } catch (error) {
      console.error("Timer error:", error);
    }
  }, 1000);
}

/**
 * タイマーを停止
 */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * 全タブに通知を送信（非推奨：新しい実装では使用しない）
 */
async function notifyAllTabs(message: string) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: message }).catch(() => {
          // タブが応答しない場合は無視
        });
      }
    }
  } catch (error) {
    console.error("Error notifying tabs:", error);
  }
}

/**
 * すべてのX.comタブを振り返り画面にリダイレクト
 */
async function redirectXTabsToReflection() {
  try {
    const tabs = await chrome.tabs.query({});
    const reflectionUrl = chrome.runtime.getURL("options.html?view=reflection");

    for (const tab of tabs) {
      if (tab.id && tab.url && isTimerTargetPage(tab.url)) {
        await chrome.tabs.update(tab.id, { url: reflectionUrl });
      }
    }
  } catch (error) {
    console.error("Error redirecting tabs:", error);
  }
}

/**
 * タブのURLが変更されたときの処理
 */
async function handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
  // URLが変更されたか、ページ読み込みが完了した時にチェック
  if (changeInfo.url || changeInfo.status === "complete") {
    const currentUrl = changeInfo.url || tab.url;
    
    if (!currentUrl) {
      return;
    }

    console.log("[X Blocker] Tab update detected:", currentUrl);
    
    const isTarget = isTimerTargetPage(currentUrl);
    console.log("[X Blocker] Is target page:", isTarget);

    // X.comへのアクセスを検出
    if (isTarget) {
      const session = await getCurrentSession();
      console.log("[X Blocker] Current session:", session);

      // アクティブなセッションがない場合、タブをoptionsページのセッション開始画面に遷移
      if (!session || !session.isActive || session.remainingSeconds <= 0) {
        console.log("[X Blocker] No active session, redirecting to start-session");
        await chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL("options.html?view=start-session")
        });
        return;
      }

      // アクティブなセッションがある場合はタイマーを開始
      console.log("[X Blocker] Active session found, starting timer");
      startTimer();
    } else {
      // タイマー対象外ページに移動した場合はタイマーを停止
      const session = await getCurrentSession();
      if (session && session.isActive) {
        const updatedSession = {
          ...session,
          isActive: false,
        };
        await saveCurrentSession(updatedSession);
        stopTimer();
      }
    }
  }
}

/**
 * ブラウザ起動時の状態復元
 */
async function restoreState() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return;
    }

    // セッションが今日のものでない場合はクリア
    if (!isSessionToday(session)) {
      await saveCurrentSession(null);
      return;
    }

    // 経過時間を計算して残り時間を更新
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - session.startTime) / 1000);
    const totalSeconds = session.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    const updatedSession = {
      ...session,
      remainingSeconds,
      isActive: remainingSeconds > 0 && session.isActive,
    };

    await saveCurrentSession(updatedSession);

    if (updatedSession.isActive && updatedSession.remainingSeconds > 0) {
      startTimer();
    }
  } catch (error) {
    console.error("Error restoring state:", error);
  }
}

/**
 * 日付変更チェック（1分ごと）
 */
let lastCheckDate = new Date().toDateString();

setInterval(async () => {
  const currentDate = new Date().toDateString();

  if (currentDate !== lastCheckDate) {
    lastCheckDate = currentDate;

    // 日付が変わったらセッションをリセット
    const session = await getCurrentSession();
    if (session) {
      await saveCurrentSession(null);
      stopTimer();
      
      // すべてのX.comタブをセッション開始画面にリダイレクト
      const tabs = await chrome.tabs.query({});
      const startUrl = chrome.runtime.getURL("options.html?view=start-session");
      
      for (const tab of tabs) {
        if (tab.id && tab.url && isTimerTargetPage(tab.url)) {
          await chrome.tabs.update(tab.id, { url: startUrl });
        }
      }
    }
  }
}, 60000); // 1分ごとにチェック

// イベントリスナーの登録
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension startup");
  initializeStorage();
  restoreState();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  initializeStorage();
});

chrome.tabs.onUpdated.addListener(handleTabUpdate);

// タブが作成された時もチェック
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id && tab.url) {
    console.log("[X Blocker] Tab created:", tab.url);
    const isTarget = isTimerTargetPage(tab.url);
    
    if (isTarget) {
      const session = await getCurrentSession();
      
      if (!session || !session.isActive || session.remainingSeconds <= 0) {
        console.log("[X Blocker] Redirecting new tab to start-session");
        await chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL("options.html?view=start-session")
        });
      }
    }
  }
});

// ストレージの変更を監視してタイマーを開始/停止
storage.watch({
  "currentSession": (change) => {
    const session = change.newValue;

    if (session && session.isActive && session.remainingSeconds > 0) {
      startTimer();
    } else {
      stopTimer();
    }
  }
});

console.log("X Blocker background script loaded");
