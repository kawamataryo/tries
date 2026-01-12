import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";
import type { Session } from "~lib/types";
import "~styles/global.css";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
};

const storage = new Storage();

const LockScreen = () => {
  const [show, setShow] = useState(false);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkSessionExpired();

    // メッセージリスナー（backgroundからの通知）
    const listener = (message: any) => {
      if (message.type === "session-expired") {
        setShow(true);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // ストレージの変更を監視
    const unwatch = storage.watch({
      currentSession: (change) => {
        const session = change.newValue;
        if (session && !session.isActive && session.remainingSeconds === 0) {
          setShow(true);
        } else if (!session) {
          setShow(false);
        }
      },
    });

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      unwatch();
    };
  }, []);

  const checkSessionExpired = async () => {
    const session = await storage.get<Session>("currentSession");
    if (session && !session.isActive && session.remainingSeconds === 0) {
      setShow(true);
    }
  };

  const handleSubmit = async () => {
    if (!reflection.trim()) {
      setError("振り返り内容を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sendToBackground({
        name: "save-reflection",
        body: { reflection: reflection.trim() },
      });

      if (response.success) {
        setShow(false);
        setReflection("");
      } else {
        setError(response.error || "振り返りの保存に失敗しました");
      }
    } catch (err) {
      console.error("Error saving reflection:", err);
      setError("振り返りの保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-xl p-8 max-w-lg w-[90%] shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            セッション終了
          </h2>
          <p className="text-gray-600">
            この時間で何を得られましたか？
          </p>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            振り返り（必須）
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="例: 新しい技術のトレンドを3つ発見できた"
            rows={4}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            {reflection.trim().length}文字
          </p>
        </div>

        {error && (
          <p className="text-red-600 mb-4 text-sm">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!reflection.trim() || loading}
          className={`w-full px-3 py-3 text-white border-none rounded-lg text-base font-semibold transition-colors ${
            reflection.trim() && !loading
              ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "保存中..." : "保存して終了"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          振り返りを入力するまで、このページを離れることはできません
        </p>
      </div>
    </div>
  );
};

export default LockScreen;
