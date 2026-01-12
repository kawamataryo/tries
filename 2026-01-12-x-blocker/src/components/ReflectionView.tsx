import { useReflection } from "~hooks/useReflection";

export function ReflectionView() {
  const {
    reflection,
    setReflection,
    reflectionLoading,
    reflectionError,
    handleSaveReflection,
  } = useReflection();

  const canSave = reflection.trim().length > 0 && !reflectionLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            セッション終了
          </h2>
          <p className="text-lg text-gray-600">
            この時間で何を得られましたか？
          </p>
        </div>

        <div className="mb-6">
          <label className="block mb-3 font-semibold text-gray-700">
            振り返り（必須）
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            onKeyDown={(e) => {
              // ⌘+Enter で「保存して終了」と同じ処理を実行する
              if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                if (canSave) handleSaveReflection();
              }
            }}
            placeholder="例: 新しい技術のトレンドを3つ発見できた"
            rows={5}
            disabled={reflectionLoading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-sm text-gray-500 mt-2">
            {reflection.trim().length}文字
          </p>
        </div>

        {reflectionError && (
          <p className="text-red-600 mb-4 text-sm text-center font-medium">
            {reflectionError}
          </p>
        )}

        <button
          onClick={handleSaveReflection}
          disabled={!canSave}
          className={`w-full px-4 py-4 text-white border-none rounded-xl text-lg font-bold transition-all ${
            canSave
              ? "bg-purple-500 hover:bg-purple-600 cursor-pointer shadow-lg hover:shadow-xl"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {reflectionLoading ? "保存中..." : "保存して終了"}
        </button>

        <p className="text-sm text-gray-500 text-center mt-4">
          振り返りを入力するまで、Xにアクセスできません
        </p>
      </div>
    </div>
  );
}
