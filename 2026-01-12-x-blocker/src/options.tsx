import { useEffect, useState } from "react";
import { DashboardView } from "~components/DashboardView";
import { SessionStartView } from "~components/SessionStartView";
import { ReflectionView } from "~components/ReflectionView";
import { useSettings } from "~hooks/useSettings";
import "~styles/global.css";

// URLパラメータから表示する画面を判定
type ViewMode = "default" | "start-session" | "reflection";

function getViewMode(): ViewMode {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  if (view === "start-session") return "start-session";
  if (view === "reflection") return "reflection";
  return "default";
}

function OptionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>(getViewMode());
  const [dashboardReloadKey, setDashboardReloadKey] = useState(0);
  const { settings, loadSettings } = useSettings();

  useEffect(() => {
    // URLパラメータが変わったらviewModeを更新
    const handleUrlChange = () => {
      setViewMode(getViewMode());
    };

    window.addEventListener("popstate", handleUrlChange);

    // 初期ロード
    if (viewMode === "default") {
      loadSettings();
    }

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [viewMode, loadSettings]);

  // セッション開始画面
  if (viewMode === "start-session") {
    return <SessionStartView />;
  }

  // 振り返り入力画面
  if (viewMode === "reflection") {
    return <ReflectionView />;
  }

  const handleOpenSettings = () => {
    window.location.href = chrome.runtime.getURL("tabs/settings.html");
  };

  // デフォルト画面（ダッシュボード）
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">X Blocker 設定</h1>
              <p className="text-gray-600 mt-2">
                X（旧Twitter）の利用を制限し、意図的な情報収集をサポートします
              </p>
            </div>
            <button
              onClick={handleOpenSettings}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="設定"
              aria-label="設定を開く"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </header>

        <DashboardView settings={settings} reloadKey={dashboardReloadKey} />
      </div>
    </div>
  );
}

export default OptionsPage;
