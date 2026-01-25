import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Clock,
} from "lucide-react";

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

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatHoldingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">빠른 통계</h3>

      <div className="space-y-4">
        {/* 총 수익 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isProfit ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <span className="text-gray-400 text-sm">총 수익</span>
          </div>
          <div className="text-right">
            <p
              className={`font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}
            >
              {isProfit ? "+" : ""}₩{formatNumber(totalProfit)}
            </p>
            <p
              className={`text-xs ${isProfit ? "text-green-400" : "text-red-400"}`}
            >
              {isProfit ? "+" : ""}
              {formatNumber(avgProfitRate, 2)}%
            </p>
          </div>
        </div>

        {/* 보유 포지션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">보유 포지션</span>
          </div>
          <p className="font-bold text-white">{positionCount}개</p>
        </div>

        {/* 승률 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">승률</span>
          </div>
          <p className="font-bold text-white">{formatNumber(winRate, 1)}%</p>
        </div>

        {/* 오늘 거래 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-sm">오늘 거래</span>
          </div>
          <p className="font-bold text-white">{todayTrades}건</p>
        </div>

        {/* 평균 보유 시간 */}
        {avgHoldingTime > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-500/20">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-gray-400 text-sm">평균 보유</span>
            </div>
            <p className="font-bold text-white">
              {formatHoldingTime(avgHoldingTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStats;
