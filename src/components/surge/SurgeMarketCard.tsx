import React from "react";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Grid3X3,
  Clock,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { SurgeMarket } from "../../api/realTradingApi";

interface SurgeMarketCardProps {
  market: SurgeMarket;
  onSelect?: (market: string) => void;
}

export const SurgeMarketCard: React.FC<SurgeMarketCardProps> = ({
  market,
  onSelect,
}) => {
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "STRONG":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "WEAK":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case "STRONG":
        return "강력";
      case "MEDIUM":
        return "보통";
      case "WEAK":
        return "약함";
      default:
        return strength;
    }
  };

  const getZScoreLevel = (zScore: number) => {
    if (zScore >= 3.0) return { label: "매우 강함", color: "text-green-400" };
    if (zScore >= 2.5) return { label: "강함", color: "text-green-300" };
    if (zScore >= 2.0) return { label: "보통", color: "text-yellow-400" };
    return { label: "약함", color: "text-gray-400" };
  };

  const zScoreLevel = getZScoreLevel(market.zScore);
  const isPositive = market.priceChangeRate >= 0;

  return (
    <div
      className={`bg-gray-700/50 rounded-lg p-4 border transition-all cursor-pointer hover:bg-gray-700 ${
        market.isValid
          ? "border-green-500/30 hover:border-green-500/50"
          : "border-yellow-500/30 hover:border-yellow-500/50"
      }`}
      onClick={() => onSelect?.(market.market)}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap
            className={`w-5 h-5 ${
              market.signalStrength === "STRONG"
                ? "text-green-400"
                : market.signalStrength === "MEDIUM"
                ? "text-yellow-400"
                : "text-gray-400"
            }`}
          />
          <div>
            <p className="font-bold text-white">{market.market}</p>
            {market.koreanName && (
              <p className="text-xs text-gray-400">{market.koreanName}</p>
            )}
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded border ${getStrengthColor(
            market.signalStrength
          )}`}
        >
          {getStrengthLabel(market.signalStrength)}
        </span>
      </div>

      {/* 가격 정보 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400">현재가</p>
          <p className="text-lg font-bold text-white">
            ₩{formatNumber(market.currentPrice, 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">변동률</p>
          <p
            className={`text-lg font-bold flex items-center gap-1 ${
              isPositive ? "text-red-400" : "text-blue-400"
            }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${!isPositive ? "rotate-180" : ""}`}
            />
            {isPositive ? "+" : ""}
            {formatNumber(market.priceChangeRate)}%
          </p>
        </div>
      </div>

      {/* 시그널 지표 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-800/50 rounded p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-gray-400">Z-Score</span>
          </div>
          <p className={`text-sm font-bold ${zScoreLevel.color}`}>
            {formatNumber(market.zScore)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-gray-400">거래량</span>
          </div>
          <p className="text-sm font-bold text-white">
            {formatNumber(market.normalizedVolume, 1)}x
          </p>
        </div>
        <div className="bg-gray-800/50 rounded p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Grid3X3 className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-gray-400">밀도</span>
          </div>
          <p className="text-sm font-bold text-white">
            {formatNumber(market.candleDensity * 100, 0)}%
          </p>
        </div>
      </div>

      {/* 유효성 및 시간 */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-400">{formatTime(market.detectedAt)}</span>
        </div>
        {!market.isValid && market.reason && (
          <div className="flex items-center gap-1 text-yellow-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{market.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurgeMarketCard;
