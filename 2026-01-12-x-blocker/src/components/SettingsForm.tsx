import type { Settings } from "~lib/types";

interface SettingsFormProps {
  settings: Settings;
  dailyLimit: string;
  setDailyLimit: (value: string) => void;
  presetInput: string;
  setPresetInput: (value: string) => void;
  presets: number[];
  saving: boolean;
  message: string;
  onAddPreset: () => void;
  onRemovePreset: (value: number) => void;
  onSave: () => void;
}

export function SettingsForm({
  settings,
  dailyLimit,
  setDailyLimit,
  presetInput,
  setPresetInput,
  presets,
  saving,
  message,
  onAddPreset,
  onRemovePreset,
  onSave,
}: SettingsFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
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
                onClick={() => onRemovePreset(preset)}
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
            onClick={onAddPreset}
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
        onClick={onSave}
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
  );
}
