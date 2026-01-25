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

  const handleExit = async () => {
    await onExit(position.market);
    setShowExitConfirm(false);
  };

  // Z-score 레벨 표시
  const getZScoreLevel = (zScore: number) => {
    if (zScore >= 3.0) return { label: "매우 강함", color: "text-green-400" };
    if (zScore >= 2.5) return { label: "강함", color: "text-green-300" };
    if (zScore >= 2.0) return { label: "보통", color: "text-yellow-400" };
    return { label: "약함", color: "text-gray-400" };
  };

  const zScoreLevel = getZScoreLevel(position.entrySignal.zScore);

  return (
    <div className="bg-gray-700/50 rounded-lg overflow-hidden">
      {/* 메인 정보 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-bold text-white text-lg">{position.market}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatHoldingTime(position.holdingMinutes)}</span>
                {position.strategy && (
                  <span className="text-blue-400">{position.strategy}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-xl font-bold ${profitColor}`}>
              {isProfit ? "+" : ""}
              {formatNumber(position.profitRate, 2)}%
            </p>
            <p className={`text-sm ${profitColor}`}>
              {isProfit ? "+" : ""}₩{formatNumber(position.netProfit)}
            </p>
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400">진입가</p>
            <p className="text-white font-medium">
              ₩{formatNumber(position.entryPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">현재가</p>
            <p className={`font-medium ${profitColor}`}>
              ₩{formatNumber(position.currentPrice)}
            </p>
          </div>
          {position.targetPrice && (
            <div>
              <p className="text-xs text-gray-400">목표가</p>
              <p className="text-purple-400 font-medium">
                ₩{formatNumber(position.targetPrice)}
              </p>
            </div>
          )}
        </div>

        {/* 진입 시그널 요약 */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">진입 사유</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className={zScoreLevel.color}>
                Z: {position.entrySignal.zScore.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-white">
                Vol: {position.entrySignal.normalizedVolume.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Grid3X3 className="w-4 h-4 text-yellow-400" />
              <span className="text-white">
                밀도: {(position.entrySignal.candleDensity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* 확장된 상세 정보 */}
        {expanded && (
          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Z-Score</p>
                <p className={`font-medium ${zScoreLevel.color}`}>
                  {position.entrySignal.zScore.toFixed(3)} ({zScoreLevel.label})
                </p>
              </div>
              <div>
                <p className="text-gray-400">정규화 거래량</p>
                <p className="text-white font-medium">
                  평균 대비 {position.entrySignal.normalizedVolume.toFixed(2)}배
                </p>
              </div>
              <div>
                <p className="text-gray-400">캔들 밀도</p>
                <p className="text-white font-medium">
                  {(position.entrySignal.candleDensity * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">진입 시간대</p>
                <p className="text-white font-medium">
                  {position.entrySignal.timeSlot}시
                </p>
              </div>
            </div>
            {position.entrySignal.reason && (
              <div>
                <p className="text-gray-400 text-sm">판단 사유</p>
                <p className="text-white text-sm mt-1">
                  {position.entrySignal.reason}
                </p>
              </div>
            )}
            {position.stopLossPrice && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-red-400" />
                    <span className="text-gray-400">손절가:</span>
                    <span className="text-red-400">
                      ₩{formatNumber(position.stopLossPrice)}
                    </span>
                  </div>
                  {position.targetPrice && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400">목표가:</span>
                      <span className="text-green-400">
                        ₩{formatNumber(position.targetPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-4">
          {showExitConfirm ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm mb-3">
                {position.market} 포지션을 청산하시겠습니까?
              </p>
              <p className="text-xs text-gray-400 mb-3">
                예상 수익: {isProfit ? "+" : ""}₩{formatNumber(position.netProfit)} (
                {isProfit ? "+" : ""}
                {formatNumber(position.profitRate, 2)}%)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                  disabled={exitLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleExit}
                  disabled={exitLoading}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exitLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  청산
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
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
