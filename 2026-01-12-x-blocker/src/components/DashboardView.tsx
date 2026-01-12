import { useEffect } from "react";
import { DashboardStats } from "./DashboardStats";
import { SessionHistory } from "./SessionHistory";
import { DailyUsageChart } from "./DailyUsageChart";
import { useDashboard } from "~hooks/useDashboard";
import type { Settings } from "~lib/types";

interface DashboardViewProps {
  settings: Settings;
  reloadKey?: number;
}

export function DashboardView({ settings, reloadKey }: DashboardViewProps) {
  const {
    todayUsage,
    dashboardRemainingMinutes,
    dashboardLoading,
    allSessions,
    dailyUsageHistory,
    loadDashboardData,
  } = useDashboard();

  // 初期ロードとリロード
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const handleStartSession = () => {
    window.location.href = chrome.runtime.getURL("options.html?view=start-session");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">今日の利用状況</h2>
        <button
          onClick={handleStartSession}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          新しいセッションを開始
        </button>
      </div>

      <DashboardStats
        settings={settings}
        todayUsage={todayUsage}
        remainingMinutes={dashboardRemainingMinutes}
        loading={dashboardLoading}
      />

      {/* 日別利用時間グラフ */}
      <div className="mt-6">
        <DailyUsageChart
          dailyUsageHistory={dailyUsageHistory}
          dailyLimitMinutes={settings.dailyLimitMinutes}
        />
      </div>

      {/* セッション履歴 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">セッション履歴</h3>
        <SessionHistory sessions={allSessions} />
      </div>
    </div>
  );
}
