import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { formatTime } from "~lib/timer";
import type { Session } from "~lib/types";
import "~styles/global.css";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
};

const storage = new Storage();

const TimerDisplay = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 初期セッション状態を取得
    loadSession();

    // ストレージの変更を監視
    const unwatch = storage.watch({
      currentSession: (change) => {
        setSession(change.newValue);
        setShow(!!change.newValue && change.newValue.isActive);
      },
    });

    return () => {
      unwatch();
    };
  }, []);

  const loadSession = async () => {
    const currentSession = await storage.get<Session>("currentSession");
    setSession(currentSession);
    setShow(!!currentSession && currentSession.isActive);
  };

  if (!show || !session) {
    return null;
  }

  const progress = (session.remainingSeconds / (session.durationMinutes * 60)) * 100;
  const timeText = formatTime(session.remainingSeconds);

  return (
    <div className="fixed bottom-6 right-6 z-[999998] bg-white rounded-full w-20 h-20 shadow-lg flex items-center justify-center border-3 border-blue-500">
      {/* 円形プログレスバー */}
      <svg
        className="absolute top-0 left-0 w-full h-full -rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="#E8F5FE"
          strokeWidth="4"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="#1DA1F2"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 35}`}
          strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress / 100)}`}
          style={{
            transition: "stroke-dashoffset 1s linear",
          }}
        />
      </svg>

      {/* 残り時間テキスト */}
      <div className="text-xs font-semibold text-gray-800 text-center z-10">
        {timeText}
      </div>
    </div>
  );
};

export default TimerDisplay;
