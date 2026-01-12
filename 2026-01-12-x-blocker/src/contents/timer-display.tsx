import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { formatTime } from "~lib/timer";
import type { Session } from "~lib/types";

import styleText from "data-text:~styles/global.css";

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
};

const storage = new Storage();

const TimerDisplay = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [show, setShow] = useState(false);

  const loadSession = async () => {
    const currentSession = await storage.get<Session>("currentSession");
    setSession(currentSession);
    setShow(!!currentSession && currentSession.isActive);
  };

  useEffect(() => {
    // 初期セッション状態を取得
    loadSession();

    // ストレージの変更を監視
    storage.watch({
      currentSession: (change) => {
        setSession(change.newValue);
        setShow(!!change.newValue && change.newValue.isActive);
      },
    });

    // タブの可視性が変更された時（タブを切り替えて戻った時など）に状態を再読み込み
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // タブが表示された時にセッション状態を再確認
        loadSession();
      }
    };

    // History APIの変更を監視（SPAナビゲーション）
    const handlePopState = () => {
      loadSession();
    };

    // URL変更を監視するためにMutationObserverを使用（SPAの場合）
    const observer = new MutationObserver(() => {
      // 少し遅延させて、URL変更が完了してから状態を確認
      setTimeout(() => {
        loadSession();
      }, 100);
    });

    // 定期的にセッション状態をチェック（フォールバック）
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        loadSession();
      }
    }, 2000); // 2秒ごとにチェック

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);
    
    // body要素の変更を監視（SPAのナビゲーション検知用）
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  if (!show || !session) {
    return null;
  }

  const progress = (session.remainingSeconds / (session.durationMinutes * 60)) * 100;
  const timeText = formatTime(session.remainingSeconds);

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2 p-2 rounded-lg"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* 残り時間テキスト */}
      <div 
        className="text-sm font-semibold text-white text-center px-3 py-1 rounded backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        }}
      >
        {timeText}
      </div>

      {/* 直線プログレスバー */}
      <div 
        className="w-64 h-1.5 rounded-full overflow-hidden backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
};

export default TimerDisplay;
