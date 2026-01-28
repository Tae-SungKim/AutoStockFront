import React, { useState } from "react";
import {
  Clock,
  Activity,
  BarChart3,
  Grid3X3,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
} from "lucide-react";
import type { Position } from "../../api/realTradingApi";
import {
  formatNumber,
  formatWonCompact,
  formatPercent,
  formatHoldingTime,
} from "../../utils/formatUtils";

interface PositionCardProps {
  position: Position;
  onExit: (market: string) => Promise<unknown>;
  exitLoading: boolean;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onExit,
  exitLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isProfit = position.profitRate >= 0;
  const profitColor = isProfit ? "text-red-400" : "text-blue-400";

  const handleExit = async () => {
    await onExit(position.market);
    setShowExitConfirm(false);
  };

  // Z-score 레벨 표시
  const getZScoreLevel = (zScore: number) => {
    if (zScore >= 3.0) return { label: "매우 강함", color: "text-green-400" };
    if (zScore >= 2.5) return { label: "강함", color: "text-green-300" };
    if (zScore >= 2.0) return { label: "보통", color: "text-yellow-400" };
    return { label: "약함", color: "text-content-muted" };
  };

  const zScoreLevel = getZScoreLevel(position.entrySignal.zScore);

  return (
    <div className="bg-surface-tertiary/50 rounded-lg overflow-hidden">
      {/* 메인 정보 */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <p className="font-bold text-content text-base sm:text-lg">{position.market}</p>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-content-secondary mt-0.5 sm:mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatHoldingTime(position.holdingMinutes)}</span>
                {position.strategy && (
                  <span className="text-blue-400 hidden sm:inline">{position.strategy}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-lg sm:text-xl font-bold ${profitColor}`}>
              {formatPercent(position.profitRate, 2, true)}
            </p>
            <p className={`text-xs sm:text-sm ${profitColor}`}>
              {isProfit ? "+" : ""}{formatWonCompact(position.netProfit)}
            </p>
          </div>
        </div>

        {/* 가격 정보 - Responsive Grid */}
        <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          <div>
            <p className="text-xs text-content-secondary">진입가</p>
            <p className="text-content font-medium text-sm sm:text-base">
              {formatWonCompact(position.entryPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-secondary">현재가</p>
            <p className={`font-medium text-sm sm:text-base ${profitColor}`}>
              {formatWonCompact(position.currentPrice)}
            </p>
          </div>
          {position.targetPrice && (
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-content-secondary">목표가</p>
              <p className="text-purple-400 font-medium text-sm sm:text-base">
                {formatWonCompact(position.targetPrice)}
              </p>
            </div>
          )}
        </div>

        {/* 진입 시그널 요약 */}
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-surface-secondary/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-content-secondary">진입 사유</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-content-secondary hover:text-content transition-colors p-1"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          {/* Mobile: 2 cols, Desktop: 3 cols */}
          <div className="mt-2 grid grid-cols-3 gap-1 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className={zScoreLevel.color}>
                {formatNumber(position.entrySignal.zScore, { decimals: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-content">
                {formatNumber(position.entrySignal.normalizedVolume, { decimals: 1 })}x
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="text-content">
                {formatPercent(position.entrySignal.candleDensity * 100, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* 확장된 상세 정보 */}
        {expanded && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-surface-secondary/50 rounded-lg space-y-2 sm:space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div>
                <p className="text-content-secondary">Z-Score</p>
                <p className={`font-medium ${zScoreLevel.color}`}>
                  {formatNumber(position.entrySignal.zScore, { decimals: 3 })} ({zScoreLevel.label})
                </p>
              </div>
              <div>
                <p className="text-content-secondary">거래량</p>
                <p className="text-content font-medium">
                  {formatNumber(position.entrySignal.normalizedVolume, { decimals: 2 })}배
                </p>
              </div>
              <div>
                <p className="text-content-secondary">캔들 밀도</p>
                <p className="text-content font-medium">
                  {formatPercent(position.entrySignal.candleDensity * 100, 1)}
                </p>
              </div>
              <div>
                <p className="text-content-secondary">진입 시간대</p>
                <p className="text-content font-medium">
                  {position.entrySignal.timeSlot}시
                </p>
              </div>
            </div>
            {position.entrySignal.reason && (
              <div>
                <p className="text-content-secondary text-xs sm:text-sm">판단 사유</p>
                <p className="text-content text-xs sm:text-sm mt-1">
                  {position.entrySignal.reason}
                </p>
              </div>
            )}
            {position.stopLossPrice && (
              <div className="pt-2 border-t border-line">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    <span className="text-content-secondary">손절:</span>
                    <span className="text-red-400">
                      {formatWonCompact(position.stopLossPrice)}
                    </span>
                  </div>
                  {position.targetPrice && (
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      <span className="text-content-secondary">목표:</span>
                      <span className="text-green-400">
                        {formatWonCompact(position.targetPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-3 sm:mt-4">
          {showExitConfirm ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
              <p className="text-red-400 text-xs sm:text-sm mb-2 sm:mb-3">
                {position.market} 포지션을 청산하시겠습니까?
              </p>
              <p className="text-xs text-content-secondary mb-2 sm:mb-3">
                예상 수익: {isProfit ? "+" : ""}{formatWonCompact(position.netProfit)} (
                {formatPercent(position.profitRate, 2, true)})
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded hover:bg-surface-hover text-xs sm:text-sm"
                  disabled={exitLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleExit}
                  disabled={exitLoading}
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  {exitLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  청산
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
            >
              수동 청산
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionCard;
