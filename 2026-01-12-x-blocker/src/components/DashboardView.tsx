import { useEffect } from "react";
import { DashboardStats } from "./DashboardStats";
import { SessionHistory } from "./SessionHistory";
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
    loadDashboardData,
  } = useDashboard();

  // 初期ロードとリロード
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">今日の利用状況</h2>

      <DashboardStats
        settings={settings}
        todayUsage={todayUsage}
        remainingMinutes={dashboardRemainingMinutes}
        loading={dashboardLoading}
      />

      {/* セッション履歴 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">セッション履歴</h3>
        <SessionHistory sessions={allSessions} />
      </div>
    </div>
  );
}
