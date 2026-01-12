// 設定データ
export interface Settings {
  dailyLimitMinutes: number;        // 1日の総利用時間上限（分）
  presetMinutes: number[];          // プリセット時間（例: [1, 5, 10, 20]）
}

// セッションデータ
export interface Session {
  id: string;                       // セッションID
  startTime: number;                // 開始時刻（timestamp）
  durationMinutes: number;          // セッション時間（分）
  remainingSeconds: number;         // 残り時間（秒）
  isActive: boolean;                // アクティブ状態
}

// 日次データ
export interface DailyUsage {
  date: string;                     // YYYY-MM-DD
  totalUsedMinutes: number;         // 使用済み時間（分）
  sessions: SessionRecord[];        // セッション記録
}

// セッション記録
export interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  reflection: string;               // 振り返り内容
}

// Storageキー
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CURRENT_SESSION: 'currentSession',
  DAILY_USAGE: 'dailyUsage',
} as const;

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
  dailyLimitMinutes: 30,            // デフォルト: 30分/日
  presetMinutes: [1, 5, 10, 20],    // デフォルトプリセット
};

// 日付フォーマット関数（ローカルTZベース）
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

// 今日の日付を取得（ローカルTZ）
export function getToday(): string {
  return formatDate(new Date());
}
