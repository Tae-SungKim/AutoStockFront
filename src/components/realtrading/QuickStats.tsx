import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Clock,
} from "lucide-react";
import {
  formatNumber,
  formatWonCompact,
  formatPercent,
  formatHoldingTime,
} from "../../utils/formatUtils";

interface QuickStatsProps {
  totalProfit: number;
  avgProfitRate: number;
  positionCount: number;
  winRate?: number;
  todayTrades?: number;
  avgHoldingTime?: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  totalProfit,
  avgProfitRate,
  positionCount,
  winRate = 0,
  todayTrades = 0,
  avgHoldingTime = 0,
}) => {
  const isProfit = totalProfit >= 0;

  return (
    <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-bold text-content mb-3 sm:mb-4">빠른 통계</h3>

      {/* Mobile: 2x3 Grid, Desktop: List */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
        {/* 총 수익 */}
        <div className="sm:flex sm:items-center sm:justify-between col-span-2 sm:col-span-1 bg-surface-tertiary/30 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-0">
            <div
              className={`p-1.5 sm:p-2 rounded-lg ${
                isProfit ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
              )}
            </div>
            <span className="text-content-secondary text-xs sm:text-sm">총 수익</span>
          </div>
          <div className="sm:text-right">
            <p
              className={`font-bold text-sm sm:text-base ${isProfit ? "text-green-400" : "text-red-400"}`}
            >
              {isProfit ? "+" : ""}{formatWonCompact(totalProfit)}
            </p>
            <p
              className={`text-xs ${isProfit ? "text-green-400" : "text-red-400"}`}
            >
              {formatPercent(avgProfitRate, 2, true)}
            </p>
          </div>
        </div>

        {/* 보유 포지션 */}
        <div className="sm:flex sm:items-center sm:justify-between bg-surface-tertiary/30 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <span className="text-content-secondary text-xs sm:text-sm">보유</span>
          </div>
          <p className="font-bold text-content text-sm sm:text-base">{positionCount}개</p>
        </div>

        {/* 승률 */}
        <div className="sm:flex sm:items-center sm:justify-between bg-surface-tertiary/30 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            </div>
            <span className="text-content-secondary text-xs sm:text-sm">승률</span>
          </div>
          <p className="font-bold text-content text-sm sm:text-base">{formatNumber(winRate, { decimals: 1 })}%</p>
        </div>

        {/* 오늘 거래 */}
        <div className="sm:flex sm:items-center sm:justify-between bg-surface-tertiary/30 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/20">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            </div>
            <span className="text-content-secondary text-xs sm:text-sm">오늘</span>
          </div>
          <p className="font-bold text-content text-sm sm:text-base">{todayTrades}건</p>
        </div>

        {/* 평균 보유 시간 */}
        {avgHoldingTime > 0 && (
          <div className="sm:flex sm:items-center sm:justify-between bg-surface-tertiary/30 sm:bg-transparent rounded-lg p-3 sm:p-0">
            <div className="flex items-center gap-2 mb-1 sm:mb-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gray-500/20">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-content-muted" />
              </div>
              <span className="text-content-secondary text-xs sm:text-sm">보유시간</span>
            </div>
            <p className="font-bold text-content text-sm sm:text-base">
              {formatHoldingTime(avgHoldingTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStats;
