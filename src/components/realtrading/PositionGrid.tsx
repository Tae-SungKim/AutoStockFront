import React from "react";
import { AlertTriangle, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import type { Position } from "../../api/realTradingApi";
import { PositionCard } from "./PositionCard";
import { formatWonCompact, formatPercent } from "../../utils/formatUtils";

interface PositionGridProps {
  positions: Position[];
  loading: boolean;
  error: Error | null;
  onExitPosition: (market: string) => Promise<unknown>;
  onExitAll: () => Promise<unknown>;
  exitLoading: boolean;
  exitAllLoading: boolean;
}

export const PositionGrid: React.FC<PositionGridProps> = ({
  positions,
  loading,
  error,
  onExitPosition,
  onExitAll,
  exitLoading,
  exitAllLoading,
}) => {
  const handleExitAll = () => {
    if (!positions || positions.length === 0) return;

    if (confirm(`${positions.length}개 포지션을 모두 청산하시겠습니까?`)) {
      onExitAll();
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-content-secondary animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12 text-red-400">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          <span className="text-sm sm:text-base">포지션 로딩 실패</span>
        </div>
      </div>
    );
  }

  const hasPositions = positions && positions.length > 0;

  // 총 수익 계산
  const totalProfit = positions?.reduce((sum, p) => sum + p.netProfit, 0) ?? 0;
  const totalProfitRate = positions?.length
    ? positions.reduce((sum, p) => sum + p.profitRate, 0) / positions.length
    : 0;
  const isProfit = totalProfit >= 0;

  return (
    <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-content">
            보유 포지션
            {hasPositions && (
              <span className="ml-2 text-sm font-normal text-content-secondary">
                ({positions.length}개)
              </span>
            )}
          </h2>
          {hasPositions && (
            <div className="flex items-center gap-2 text-xs sm:text-sm mt-1">
              <span className="text-content-secondary">총 수익:</span>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                )}
                <span className={isProfit ? "text-red-400" : "text-blue-400"}>
                  {isProfit ? "+" : ""}{formatWonCompact(totalProfit)} (
                  {formatPercent(totalProfitRate, 2, true)})
                </span>
              </div>
            </div>
          )}
        </div>

        {hasPositions && (
          <button
            onClick={handleExitAll}
            disabled={exitAllLoading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {exitAllLoading && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />}
            전체 청산
          </button>
        )}
      </div>

      {hasPositions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              onExit={onExitPosition}
              exitLoading={exitLoading}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 text-content-secondary">
          <p className="text-sm sm:text-base">보유 중인 포지션이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default PositionGrid;
