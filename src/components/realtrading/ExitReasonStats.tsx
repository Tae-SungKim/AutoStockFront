import React from "react";
import { PieChart, AlertTriangle, Target, TrendingDown, Clock, Zap } from "lucide-react";

interface ExitReasonStatsProps {
  stats: Record<string, number>;
  totalTrades: number;
}

const exitReasonConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; description: string }
> = {
  TAKE_PROFIT: {
    label: "익절",
    color: "bg-green-500",
    icon: <Target className="w-4 h-4" />,
    description: "목표가 도달",
  },
  TRAILING_STOP: {
    label: "트레일링",
    color: "bg-blue-500",
    icon: <TrendingDown className="w-4 h-4" />,
    description: "트레일링 스탑",
  },
  STOP_LOSS_FIXED: {
    label: "고정 손절",
    color: "bg-red-500",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "고정 손절가",
  },
  STOP_LOSS_ATR: {
    label: "ATR 손절",
    color: "bg-red-400",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "ATR 기반 손절",
  },
  FAKE_IMPULSE: {
    label: "가짜 임펄스",
    color: "bg-yellow-500",
    icon: <Zap className="w-4 h-4" />,
    description: "임펄스 무효화",
  },
  WEAK_IMPULSE: {
    label: "약한 임펄스",
    color: "bg-yellow-400",
    icon: <Zap className="w-4 h-4" />,
    description: "약한 모멘텀",
  },
  TIMEOUT: {
    label: "타임아웃",
    color: "bg-gray-500",
    icon: <Clock className="w-4 h-4" />,
    description: "시간 초과",
  },
  SIGNAL_INVALID: {
    label: "시그널 무효",
    color: "bg-purple-500",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "시그널 무효화",
  },
  VOLUME_DROP: {
    label: "거래량 감소",
    color: "bg-orange-500",
    icon: <TrendingDown className="w-4 h-4" />,
    description: "거래량 급감",
  },
  OVERHEATED: {
    label: "과열",
    color: "bg-pink-500",
    icon: <Zap className="w-4 h-4" />,
    description: "시장 과열",
  },
};

export const ExitReasonStats: React.FC<ExitReasonStatsProps> = ({
  stats,
  totalTrades,
}) => {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">청산 사유 분포</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          청산 내역이 없습니다
        </div>
      </div>
    );
  }

  const sortedStats = Object.entries(stats)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalTrades > 0 ? (count / totalTrades) * 100 : 0,
      config: exitReasonConfig[reason] || {
        label: reason,
        color: "bg-gray-500",
        icon: <AlertTriangle className="w-4 h-4" />,
        description: reason,
      },
    }))
    .sort((a, b) => b.count - a.count);

  // FAKE_IMPULSE 비율 계산
  const fakeImpulseCount = stats.FAKE_IMPULSE || 0;
  const fakeImpulseRate = totalTrades > 0 ? (fakeImpulseCount / totalTrades) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">청산 사유 분포</h3>
      </div>

      <div className="space-y-3">
        {sortedStats.map(({ reason, count, percentage, config }) => (
          <div key={reason} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`p-1 rounded ${config.color} text-white`}>
                  {config.icon}
                </span>
                <span className="text-gray-300">{config.label}</span>
              </div>
              <span className="text-white font-medium">
                {count}건 ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.color} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* FAKE_IMPULSE 경고 */}
      {fakeImpulseRate > 10 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              FAKE_IMPULSE 비율: {fakeImpulseRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-yellow-300/70 mt-1">
            진입 필터 강화를 검토해 보세요
          </p>
        </div>
      )}

      {/* 총 거래 수 */}
      <div className="mt-4 pt-4 border-t border-gray-700 text-center">
        <p className="text-sm text-gray-400">
          총 청산: <span className="text-white font-medium">{totalTrades}건</span>
        </p>
      </div>
    </div>
  );
};

export default ExitReasonStats;
