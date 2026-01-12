import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";
import { isTimerTargetPage } from "~lib/url-matcher";
import "~styles/global.css";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  run_at: "document_start",
};

const storage = new Storage();

const Overlay = () => {
  const [show, setShow] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAndShowOverlay();
  }, []);

  const checkAndShowOverlay = async () => {
    // URL判定
    const currentUrl = window.location.href;
    if (!isTimerTargetPage(currentUrl)) {
      setShow(false);
      return;
    }

    // セッション状態をチェック
    const response = await sendToBackground({
      name: "get-session-state",
    });

    const session = response.session;

    // アクティブなセッションがない場合にオーバーレイを表示
    if (!session || !session.isActive) {
      // 残り利用可能時間を取得
      const settings = await storage.get("settings") || { dailyLimitMinutes: 30, presetMinutes: [1, 5, 10, 20] };
      const dailyUsage = await storage.get("dailyUsage") || {};
      const today = new Date().toISOString().split("T")[0];
      const todayUsage = dailyUsage[today] || { totalUsedMinutes: 0 };

      const remaining = Math.max(0, settings.dailyLimitMinutes - todayUsage.totalUsedMinutes);

      setRemainingMinutes(remaining);
      setPresets(settings.presetMinutes || [1, 5, 10, 20]);
      setShow(true);
    } else {
      setShow(false);
    }
  };

  const handlePresetClick = (minutes: number) => {
    setSelectedMinutes(minutes);
    setCustomMinutes("");
    setError("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomMinutes(value);

    if (value) {
      const minutes = parseInt(value, 10);
      if (!isNaN(minutes) && minutes > 0) {
        setSelectedMinutes(minutes);
      } else {
        setSelectedMinutes(null);
      }
    } else {
      setSelectedMinutes(null);
    }

    setError("");
  };

  const handleStart = async () => {
    if (!selectedMinutes) {
      setError("時間を選択してください");
      return;
    }

    if (selectedMinutes > remainingMinutes) {
      setError(`本日の残り利用可能時間は${remainingMinutes}分です`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await sendToBackground({
        name: "start-session",
        body: { durationMinutes: selectedMinutes },
      });

      if (response.success) {
        setShow(false);
      } else {
        setError(response.error || "セッションの開始に失敗しました");
      }
    } catch (err) {
      console.error("Error starting session:", err);
      setError("セッションの開始に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[999999]">
      <div className="bg-white rounded-xl p-8 max-w-md w-[90%] shadow-2xl">
        <h2 className="text-2xl font-semibold mb-4">
          X利用セッション開始
        </h2>

        <p className="text-gray-600 text-sm mb-6">
          本日の残り利用可能時間: <strong>{remainingMinutes}分</strong>
        </p>

        <div className="mb-5">
          <label className="block mb-2 font-medium">
            利用時間を選択
          </label>
          <div className="flex gap-2 flex-wrap">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handlePresetClick(minutes)}
                disabled={minutes > remainingMinutes || loading}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  selectedMinutes === minutes
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border border-gray-300 bg-white"
                } ${
                  minutes > remainingMinutes || loading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:border-blue-400"
                }`}
              >
                {minutes}分
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">
            カスタム時間（分）
          </label>
          <input
            type="number"
            value={customMinutes}
            onChange={handleCustomChange}
            placeholder="例: 15"
            disabled={loading}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {error && (
          <p className="text-red-600 mb-4 text-sm">
            {error}
          </p>
        )}

        <button
          onClick={handleStart}
          disabled={!selectedMinutes || loading}
          className={`w-full px-3 py-3 text-white border-none rounded-lg text-base font-semibold transition-colors ${
            selectedMinutes && !loading
              ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "開始中..." : "セッションを開始"}
        </button>
      </div>
    </div>
  );
};

export default Overlay;
