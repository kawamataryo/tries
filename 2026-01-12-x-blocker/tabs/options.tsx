import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import type { Settings, DailyUsage } from "~lib/types";
import { DEFAULT_SETTINGS } from "~lib/types";
import { getSettings, saveSettings, getAllDailyUsage } from "~lib/storage";
import "~styles/global.css";

const storage = new Storage();

function OptionsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dailyLimit, setDailyLimit] = useState("30");
  const [presetInput, setPresetInput] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [history, setHistory] = useState<DailyUsage[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const loadSettings = async () => {
    const currentSettings = await getSettings();
    setSettings(currentSettings);
    setDailyLimit(currentSettings.dailyLimitMinutes.toString());
    setPresets(currentSettings.presetMinutes);
  };

  const loadHistory = async () => {
    const allHistory = await getAllDailyUsage();
    setHistory(allHistory);
  };

  const handleSaveSettings = async () => {
    const limit = parseInt(dailyLimit, 10);

    if (isNaN(limit) || limit <= 0) {
      setMessage("1日の制限時間は正の数である必要があります");
      return;
    }

    if (presets.length === 0) {
      setMessage("少なくとも1つのプリセット時間を設定してください");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const newSettings: Settings = {
        dailyLimitMinutes: limit,
        presetMinutes: presets,
      };

      await saveSettings(newSettings);
      setSettings(newSettings);
      setMessage("設定を保存しました");

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreset = () => {
    const value = parseInt(presetInput, 10);

    if (isNaN(value) || value <= 0) {
      setMessage("プリセット時間は正の数である必要があります");
      return;
    }

    if (presets.includes(value)) {
      setMessage("この時間は既に登録されています");
      return;
    }

    setPresets([...presets, value].sort((a, b) => a - b));
    setPresetInput("");
    setMessage("");
  };

  const handleRemovePreset = (value: number) => {
    setPresets(presets.filter((p) => p !== value));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">X Blocker 設定</h1>
          <p className="text-gray-600 mt-2">
            X（旧Twitter）の利用を制限し、意図的な情報収集をサポートします
          </p>
        </header>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "settings"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            設定
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            履歴
          </button>
        </div>

        {/* 設定タブ */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">基本設定</h2>

            {/* 1日の利用時間上限 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1日の総利用時間上限（分）
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* プリセット時間 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プリセット時間（分）
              </label>
              <div className="flex gap-2 flex-wrap mb-3">
                {presets.map((preset) => (
                  <div
                    key={preset}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg"
                  >
                    <span>{preset}分</span>
                    <button
                      onClick={() => handleRemovePreset(preset)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={presetInput}
                  onChange={(e) => setPresetInput(e.target.value)}
                  placeholder="例: 15"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddPreset}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  追加
                </button>
              </div>
            </div>

            {/* メッセージ */}
            {message && (
              <p className={`mb-4 text-sm ${message.includes("失敗") ? "text-red-600" : "text-green-600"}`}>
                {message}
              </p>
            )}

            {/* 保存ボタン */}
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              }`}
            >
              {saving ? "保存中..." : "設定を保存"}
            </button>
          </div>
        )}

        {/* 履歴タブ */}
        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">利用履歴</h2>

            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                まだ履歴がありません
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((day) => (
                  <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{day.date}</h3>
                      <span className="text-sm text-gray-600">
                        合計: {day.totalUsedMinutes}分
                      </span>
                    </div>

                    {day.sessions.length === 0 ? (
                      <p className="text-sm text-gray-500">セッションなし</p>
                    ) : (
                      <div className="space-y-3">
                        {day.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-gray-50 rounded p-3 border-l-4 border-blue-500"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-gray-600">
                                {new Date(session.startTime).toLocaleTimeString("ja-JP", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" - "}
                                {new Date(session.endTime).toLocaleTimeString("ja-JP", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {session.durationMinutes}分
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{session.reflection}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OptionsPage;
