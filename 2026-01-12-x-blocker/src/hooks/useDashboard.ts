import { useState } from "react";
import type { DailyUsage, SessionRecord } from "~lib/types";
import { getSettings, getAllDailyUsage, getDailyUsage, getRemainingMinutes } from "~lib/storage";

// セッション記録に日付情報を追加した型
export interface SessionRecordWithDate extends SessionRecord {
  date: string;
}

export function useDashboard() {
  const [todayUsage, setTodayUsage] = useState<DailyUsage | null>(null);
  const [dashboardRemainingMinutes, setDashboardRemainingMinutes] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<SessionRecordWithDate[]>([]);
  const [dailyUsageHistory, setDailyUsageHistory] = useState<DailyUsage[]>([]);

  // 全セッション履歴を取得（最新順）
  const loadAllSessions = async () => {
    try {
      const allDailyUsage = await getAllDailyUsage();
      const sessionsWithDate: SessionRecordWithDate[] = [];

      allDailyUsage.forEach((dailyUsage) => {
        dailyUsage.sessions.forEach((session) => {
          sessionsWithDate.push({
            ...session,
            date: dailyUsage.date,
          });
        });
      });

      // startTimeでソート（最新順）
      sessionsWithDate.sort((a, b) => b.startTime - a.startTime);

      setAllSessions(sessionsWithDate);
    } catch (error) {
      console.error("Error loading all sessions:", error);
    }
  };

  // 日別利用時間履歴を取得（直近30日分）
  const loadDailyUsageHistory = async () => {
    try {
      const allDailyUsage = await getAllDailyUsage();
      // 最新30日分に制限
      const recentUsage = allDailyUsage.slice(0, 30);
      setDailyUsageHistory(recentUsage);
    } catch (error) {
      console.error("Error loading daily usage history:", error);
    }
  };

  // ダッシュボードデータをロード
  const loadDashboardData = async (skipSessions = false) => {
    setDashboardLoading(true);
    try {
      const currentSettings = await getSettings();
      const todayData = await getDailyUsage();
      const remaining = await getRemainingMinutes();

      setTodayUsage(todayData);
      setDashboardRemainingMinutes(remaining);
      
      if (!skipSessions) {
        await loadAllSessions();
        await loadDailyUsageHistory();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  return {
    todayUsage,
    dashboardRemainingMinutes,
    dashboardLoading,
    allSessions,
    dailyUsageHistory,
    loadDashboardData,
  };
}
