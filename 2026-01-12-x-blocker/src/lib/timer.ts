import type { Session } from "./types";
import { getToday, formatDate } from "./types";

/**
 * 新しいセッションを作成
 */
export function createSession(durationMinutes: number): Session {
  const now = Date.now();
  return {
    id: `session_${now}`,
    startTime: now,
    durationMinutes,
    remainingSeconds: durationMinutes * 60,
    isActive: true,
  };
}

/**
 * セッションの残り時間をデクリメント
 */
export function decrementSession(session: Session): Session {
  return {
    ...session,
    remainingSeconds: Math.max(0, session.remainingSeconds - 1),
  };
}

/**
 * セッションが終了したかどうかを判定
 */
export function isSessionExpired(session: Session): boolean {
  return session.remainingSeconds <= 0;
}

/**
 * セッションを一時停止
 */
export function pauseSession(session: Session): Session {
  return {
    ...session,
    isActive: false,
  };
}

/**
 * セッションを再開
 */
export function resumeSession(session: Session): Session {
  return {
    ...session,
    isActive: true,
  };
}

/**
 * セッションが今日のものかどうかを判定（日本時間ベース）
 */
export function isSessionToday(session: Session): boolean {
  // `formatDate` / `getToday` がどちらも「JST基準のYYYY-MM-DD」なので、
  // ここは単純に比較でOK（実行環境のローカルTZに依存しない）
  const sessionDateStr = formatDate(new Date(session.startTime));
  return sessionDateStr === getToday();
}

/**
 * セッションの経過時間を計算（秒）
 */
export function getElapsedSeconds(session: Session): number {
  return session.durationMinutes * 60 - session.remainingSeconds;
}

/**
 * セッションの経過時間を計算（分）
 */
export function getElapsedMinutes(session: Session): number {
  return Math.floor(getElapsedSeconds(session) / 60);
}

/**
 * MM:SS形式でフォーマット
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
