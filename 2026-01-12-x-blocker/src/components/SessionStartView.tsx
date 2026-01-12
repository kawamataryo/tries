import { useSessionStart } from "~hooks/useSessionStart";
import { useEffect } from "react";

export function SessionStartView() {
  const {
    remainingMinutes,
    selectedMinutes,
    customMinutes,
    startLoading,
    startError,
    presets,
    loadSessionStartData,
    handlePresetClick,
    handleCustomChange,
    handleStartSession,
  } = useSessionStart();

  useEffect(() => {
    loadSessionStartData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          X利用セッション開始
        </h2>

        <p className="text-gray-600 text-center mb-6">
          本日の残り利用可能時間: <strong className="text-2xl text-blue-600">{remainingMinutes}分</strong>
        </p>

        <div className="mb-6">
          <label className="block mb-3 font-medium text-gray-700">
            利用時間を選択
          </label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handlePresetClick(minutes)}
                disabled={minutes > remainingMinutes || startLoading}
                className={`px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedMinutes === minutes
                    ? "border-3 border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                    : "border-2 border-gray-300 bg-white text-gray-700"
                } ${
                  minutes > remainingMinutes || startLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:border-blue-400 hover:shadow-md"
                }`}
              >
                {minutes}分
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            カスタム時間（分）
          </label>
          <input
            type="number"
            value={customMinutes}
            onChange={handleCustomChange}
            placeholder="例: 15"
            disabled={startLoading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {startError && (
          <p className="text-red-600 mb-4 text-sm text-center font-medium">
            {startError}
          </p>
        )}

        <button
          onClick={() => handleStartSession()}
          disabled={!selectedMinutes || startLoading}
          className={`w-full px-4 py-4 text-white border-none rounded-xl text-lg font-bold transition-all ${
            selectedMinutes && !startLoading
              ? "bg-blue-500 hover:bg-blue-600 cursor-pointer shadow-lg hover:shadow-xl"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {startLoading ? "開始中..." : "セッションを開始"}
        </button>
      </div>
    </div>
  );
}
