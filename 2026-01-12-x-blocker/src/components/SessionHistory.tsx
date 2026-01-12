import { useState } from "react";
import { SessionHistoryItem } from "./SessionHistoryItem";
import type { SessionRecordWithDate } from "~hooks/useDashboard";

interface SessionHistoryProps {
  sessions: SessionRecordWithDate[];
}

const SESSIONS_PER_PAGE = 5;

export function SessionHistory({ sessions }: SessionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
  const endIndex = startIndex + SESSIONS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>まだセッションがありません</p>
        <p className="text-sm mt-2">セッションを開始して、意図的な情報収集を始めましょう</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {currentSessions.map((session) => (
          <SessionHistoryItem key={session.id} session={session} />
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            前へ
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            次へ
          </button>
        </div>
      )}
    </>
  );
}
