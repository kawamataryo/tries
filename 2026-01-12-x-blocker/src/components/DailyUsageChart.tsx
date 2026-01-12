import type { DailyUsage } from "~lib/types";

interface DailyUsageChartProps {
  dailyUsageHistory: DailyUsage[];
  dailyLimitMinutes: number;
}

export function DailyUsageChart({ dailyUsageHistory, dailyLimitMinutes }: DailyUsageChartProps) {
  if (dailyUsageHistory.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        データがありません
      </div>
    );
  }

  // 直近30日分を「古い→新しい」順にして描画（視認性向上）
  const data = [...dailyUsageHistory].reverse();

  // 最大値を計算（上限時間の1.2倍か、実際の最大値の大きい方）
  const maxValue = Math.max(
    dailyLimitMinutes * 1.2,
    ...data.map((d) => d.totalUsedMinutes)
  );

  // 日付をフォーマット（MM/DD形式）
  const formatDate = (dateStr: string): string => {
    // `YYYY-MM-DD` をそのまま分解（TZの影響を受けない）
    const [, m, d] = dateStr.split("-");
    return `${Number(m)}/${Number(d)}`;
  };

  const chartHeightPx = 180;
  const limitRatio = Math.min(1, dailyLimitMinutes / maxValue);
  const limitLineBottomPx = Math.round(limitRatio * chartHeightPx);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">日別利用時間グラフ（直近30日）</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="relative">
          {/* グリッド + Y軸ラベル */}
          <div
            className="relative"
            style={{ height: `${chartHeightPx}px` }}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = Math.round(maxValue * ratio);
              const bottomPx = Math.round(ratio * chartHeightPx);
              return (
                <div
                  key={ratio}
                  className="absolute left-0 right-0"
                  style={{ bottom: `${bottomPx}px` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-12 text-right text-[11px] text-gray-500 shrink-0">
                      {value}分
                    </div>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>
                </div>
              );
            })}

            {/* 上限ライン */}
            <div
              className="absolute left-0 right-0"
              style={{ bottom: `${limitLineBottomPx}px` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-12" />
                <div className="flex-1 border-t-2 border-dashed border-red-400" />
                <div className="text-[11px] text-red-500 font-semibold shrink-0">
                  上限: {dailyLimitMinutes}分
                </div>
              </div>
            </div>

            {/* 棒グラフ */}
            <div className="absolute inset-0 flex items-end">
              <div className="w-12" />
              <div className="flex-1 flex items-end gap-1">
                {data.map((usage, idx) => {
                  const ratio = Math.min(1, usage.totalUsedMinutes / maxValue);
                  const heightPx = Math.max(1, Math.round(ratio * chartHeightPx));
                  const isOver = usage.totalUsedMinutes > dailyLimitMinutes;
                  const showLabel =
                    data.length <= 10 ||
                    idx % Math.ceil(data.length / 10) === 0 ||
                    idx === data.length - 1;

                  return (
                    <div key={usage.date} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-sm ${isOver ? "bg-red-500" : "bg-blue-500"}`}
                        style={{ height: `${heightPx}px` }}
                        title={`${usage.date}：${usage.totalUsedMinutes}分`}
                        aria-label={`${usage.date}：${usage.totalUsedMinutes}分`}
                      />
                      <div className="h-5 mt-1">
                        {showLabel ? (
                          <div className="text-[10px] text-gray-500 whitespace-nowrap">
                            {formatDate(usage.date)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 凡例と統計情報 */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>利用時間</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500 border-dashed border-t"></div>
            <span>上限</span>
          </div>
          {dailyUsageHistory.length > 0 && (
            <div className="ml-auto text-xs text-gray-500">
              平均: {Math.round(
                data.reduce((sum, d) => sum + d.totalUsedMinutes, 0) /
                  data.length
              )}分/日
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
