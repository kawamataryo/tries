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

        // 全タブに時間切れを通知
        notifyAllTabs("session-expired");
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
 * 全タブに通知を送信
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
 * タブのURLが変更されたときの処理
 */
async function handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
  if (changeInfo.url) {
    const session = await getCurrentSession();

    if (!session) {
      return;
    }

    const isTarget = isTimerTargetPage(changeInfo.url);

    // タイマー対象ページに移動した場合
    if (isTarget && !session.isActive) {
      const updatedSession = {
        ...session,
        isActive: true,
      };
      await saveCurrentSession(updatedSession);
      startTimer();
    }
    // タイマー対象外ページに移動した場合
    else if (!isTarget && session.isActive) {
      const updatedSession = {
        ...session,
        isActive: false,
      };
      await saveCurrentSession(updatedSession);
      stopTimer();
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
      notifyAllTabs("date-changed");
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
