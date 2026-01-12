import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { sendToBackground } from "@plasmohq/messaging";
import { getSettings } from "~lib/storage";
import { getToday } from "~lib/types";
import type { Session } from "~lib/types";

const storage = new Storage();

export function useSessionStart() {
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // セッション開始画面用データをロード
  const loadSessionStartData = async () => {
    try {
      const currentSettings = await getSettings();
      setPresets(currentSettings.presetMinutes);

      const currentSession = await storage.get<Session>("currentSession");
      setActiveSession(currentSession && currentSession.isActive ? currentSession : null);

      const dailyUsage = (await storage.get("dailyUsage")) || {};
      const today = getToday();
      const todayUsage = dailyUsage[today] || { totalUsedMinutes: 0 };

      const remaining = Math.max(
        0,
        currentSettings.dailyLimitMinutes - todayUsage.totalUsedMinutes
      );
      setRemainingMinutes(remaining);
    } catch (error) {
      console.error("Error loading session start data:", error);
      setStartError("データの読み込みに失敗しました");
    }
  };

  // セッション開始画面：プリセット選択
  const handlePresetClick = async (minutes: number) => {
    // 残り時間チェック
    if (minutes > remainingMinutes) {
      setStartError(`本日の残り利用可能時間は${remainingMinutes}分です`);
      return;
    }

    // 選択状態を更新
    setSelectedMinutes(minutes);
    setCustomMinutes("");
    setStartError("");

    // 自動でセッションを開始
    await handleStartSession(minutes);
  };

  // セッション開始画面：カスタム入力
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

    setStartError("");
  };

  // セッション開始
  const handleStartSession = async (minutesParam?: number) => {
    // 既にアクティブなセッションがある場合は再開扱いにする
    const currentSession = await storage.get<Session>("currentSession");
    if (currentSession && currentSession.isActive && currentSession.remainingSeconds > 0) {
      window.location.replace("https://x.com/home");
      return;
    }

    const minutes = minutesParam ?? selectedMinutes;

    if (!minutes) {
      setStartError("時間を選択してください");
      return;
    }

    if (minutes > remainingMinutes) {
      setStartError(`本日の残り利用可能時間は${remainingMinutes}分です`);
      return;
    }

    setStartLoading(true);
    setStartError("");

    try {
      const response = await sendToBackground({
        name: "start-session",
        body: { durationMinutes: minutes },
      });

      if (response.success) {
        // 履歴を置き換えてXへ遷移（戻るでセッション開始画面に戻れない）
        window.location.replace("https://x.com/home");
      } else {
        setStartError(response.error || "セッションの開始に失敗しました");
      }
    } catch (err) {
      console.error("Error starting session:", err);
      setStartError("セッションの開始に失敗しました");
    } finally {
      setStartLoading(false);
    }
  };

  // セッション再開（Xへ戻る）
  const handleResumeSession = () => {
    window.location.replace("https://x.com/home");
  };

  // セッション終了
  const handleEndSession = async () => {
    setStartLoading(true);
    setStartError("");
    try {
      const response = await sendToBackground({
        name: "end-session",
        body: {},
      });

      if (!response.success) {
        setStartError(response.error || "セッションの終了に失敗しました");
        return;
      }

      await loadSessionStartData();
    } catch (err) {
      console.error("Error ending session:", err);
      setStartError("セッションの終了に失敗しました");
    } finally {
      setStartLoading(false);
    }
  };

  return {
    remainingMinutes,
    selectedMinutes,
    customMinutes,
    startLoading,
    startError,
    presets,
    activeSession,
    loadSessionStartData,
    handlePresetClick,
    handleCustomChange,
    handleStartSession,
    handleResumeSession,
    handleEndSession,
  };
}
