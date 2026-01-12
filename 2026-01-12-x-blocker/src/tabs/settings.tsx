import { useEffect } from "react";
import { SettingsForm } from "~components/SettingsForm";
import { useSettings } from "~hooks/useSettings";
import "~styles/global.css";

function SettingsPage() {
  const {
    settings,
    dailyLimit,
    setDailyLimit,
    presetInput,
    setPresetInput,
    presets,
    saving,
    message,
    loadSettings,
    handleSaveSettings,
    handleAddPreset,
    handleRemovePreset,
  } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    await handleSaveSettings(async () => {
      // 設定保存後にダッシュボードに戻る
      setTimeout(() => {
        window.location.href = chrome.runtime.getURL("options.html");
      }, 1000);
    });
  };

  const handleBack = () => {
    window.location.href = chrome.runtime.getURL("options.html");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              title="戻る"
              aria-label="戻る"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">基本設定</h1>
          </div>
          <p className="text-gray-600 ml-12">
            X（旧Twitter）の利用制限に関する設定を行います
          </p>
        </header>

        <SettingsForm
          settings={settings}
          dailyLimit={dailyLimit}
          setDailyLimit={setDailyLimit}
          presetInput={presetInput}
          setPresetInput={setPresetInput}
          presets={presets}
          saving={saving}
          message={message}
          onAddPreset={handleAddPreset}
          onRemovePreset={handleRemovePreset}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

export default SettingsPage;
