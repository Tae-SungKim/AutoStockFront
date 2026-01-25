import React from "react";
import { AlertTriangle, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import type { Position } from "../../api/realTradingApi";
import { PositionCard } from "./PositionCard";

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
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12 text-red-400">
          <AlertTriangle className="w-6 h-6 mr-2" />
          포지션 로딩 실패
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

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">
            보유 포지션
            {hasPositions && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({positions.length}개)
              </span>
            )}
          </h2>
          {hasPositions && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-gray-400">총 수익:</span>
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <TrendingUp className="w-4 h-4 text-red-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-blue-400" />
                )}
                <span className={isProfit ? "text-red-400" : "text-blue-400"}>
                  {isProfit ? "+" : ""}₩{formatNumber(totalProfit)} (
                  {isProfit ? "+" : ""}
                  {formatNumber(totalProfitRate, 2)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {hasPositions && (
          <button
            onClick={handleExitAll}
            disabled={exitAllLoading}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {exitAllLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            전체 청산
          </button>
        )}
      </div>

      {hasPositions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="text-center py-12 text-gray-400">
          <p>보유 중인 포지션이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default PositionGrid;
