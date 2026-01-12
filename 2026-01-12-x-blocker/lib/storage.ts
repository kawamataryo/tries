import { Storage } from "@plasmohq/storage";
import type {
  Settings,
  Session,
  DailyUsage,
  SessionRecord,
} from "./types";
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  getToday,
} from "./types";

const storage = new Storage();

// 設定の取得
export async function getSettings(): Promise<Settings> {
  const settings = await storage.get<Settings>(STORAGE_KEYS.SETTINGS);
  return settings || DEFAULT_SETTINGS;
}

// 設定の保存
export async function saveSettings(settings: Settings): Promise<void> {
  await storage.set(STORAGE_KEYS.SETTINGS, settings);
}

// 現在のセッションの取得
export async function getCurrentSession(): Promise<Session | null> {
  return await storage.get<Session>(STORAGE_KEYS.CURRENT_SESSION);
}

// 現在のセッションの保存
export async function saveCurrentSession(session: Session | null): Promise<void> {
  if (session === null) {
    await storage.remove(STORAGE_KEYS.CURRENT_SESSION);
  } else {
    await storage.set(STORAGE_KEYS.CURRENT_SESSION, session);
  }
}

// 日次データの取得
export async function getDailyUsage(date?: string): Promise<DailyUsage> {
  const targetDate = date || getToday();
  const allDailyUsage = await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE) || {};

  return allDailyUsage[targetDate] || {
    date: targetDate,
    totalUsedMinutes: 0,
    sessions: [],
  };
}

// 日次データの保存
export async function saveDailyUsage(dailyUsage: DailyUsage): Promise<void> {
  const allDailyUsage = await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE) || {};
  allDailyUsage[dailyUsage.date] = dailyUsage;
  await storage.set(STORAGE_KEYS.DAILY_USAGE, allDailyUsage);
}

// セッション記録の追加
export async function addSessionRecord(record: SessionRecord): Promise<void> {
  const today = getToday();
  const dailyUsage = await getDailyUsage(today);

  dailyUsage.sessions.push(record);
  dailyUsage.totalUsedMinutes += record.durationMinutes;

  await saveDailyUsage(dailyUsage);
}

// 全日次データの取得（履歴表示用）
export async function getAllDailyUsage(): Promise<DailyUsage[]> {
  const allDailyUsage = await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE) || {};
  return Object.values(allDailyUsage).sort((a, b) => b.date.localeCompare(a.date));
}

// 残り利用可能時間の計算
export async function getRemainingMinutes(): Promise<number> {
  const settings = await getSettings();
  const dailyUsage = await getDailyUsage();
  const currentSession = await getCurrentSession();

  let usedMinutes = dailyUsage.totalUsedMinutes;

  // 現在アクティブなセッションの使用時間を加算
  if (currentSession && currentSession.isActive) {
    const elapsedSeconds = currentSession.durationMinutes * 60 - currentSession.remainingSeconds;
    usedMinutes += Math.floor(elapsedSeconds / 60);
  }

  return Math.max(0, settings.dailyLimitMinutes - usedMinutes);
}

// ストレージの初期化（初回起動時）
export async function initializeStorage(): Promise<void> {
  const settings = await storage.get<Settings>(STORAGE_KEYS.SETTINGS);
  if (!settings) {
    await saveSettings(DEFAULT_SETTINGS);
  }
}
