import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Activity,
  BarChart3,
  Grid3X3,
  Percent,
  Info,
} from "lucide-react";
import { replayApi, type LossPatternAnalysis } from "../../api/replayApi";
import { formatNumber, formatPercent } from "../../utils/formatUtils";

interface LossAnalysisProps {
  initialStrategy?: string;
  initialDays?: number;
}

const STRATEGIES = [
  { value: "VolumeConfirmedBreakoutStrategy", label: "돌파 전략" },
  { value: "impulse", label: "임펄스 전략" },
  { value: "momentum", label: "모멘텀 전략" },
];

export const LossAnalysis: React.FC<LossAnalysisProps> = ({
  initialStrategy = "VolumeConfirmedBreakoutStrategy",
  initialDays = 7,
}) => {
  const [strategy, setStrategy] = useState(initialStrategy);
  const [days, setDays] = useState(initialDays);
  const [analysis, setAnalysis] = useState<LossPatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await replayApi.getLossPatternAnalysis(strategy, days);
      setAnalysis(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("손실 분석 실패"));
    } finally {
      setLoading(false);
    }
  }, [strategy, days]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // 지표별 해석
  const getMetricInterpretation = (metric: string, value: number) => {
    switch (metric) {
      case "rsi":
        if (value < 30) return "과매도 상태에서 손실 발생 - 바닥 진입 주의";
        if (value > 70) return "과매수 상태에서 손실 발생 - 고점 진입 주의";
        return "중립 구간에서 손실 발생 - 추가 분석 필요";
      case "volumeRatio":
        if (value < 1.5) return "저거래량 시점 진입 - 유동성 부족 주의";
        if (value > 3) return "과도한 거래량 시점 진입 - 급등락 주의";
        return "적정 거래량 구간";
      case "density":
        if (value < 0.3) return "낮은 캔들 밀도 - 추세 약함";
        if (value > 0.7) return "높은 캔들 밀도 - 과열 주의";
        return "적정 밀도 구간";
      case "zScore":
        if (value < 2) return "약한 시그널에서 진입 - 기준 상향 필요";
        if (value > 3) return "강한 시그널에서도 손실 - 다른 요인 확인";
        return "적정 시그널 강도";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-content-secondary animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12 text-red-400">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          <span className="text-sm sm:text-base">{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 및 필터 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-content">
                  손실 패턴 분석
                </h2>
                <p className="text-xs sm:text-sm text-content-secondary">
                  손실 거래의 진입 조건 분석
                </p>
              </div>
            </div>
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>

          {/* 필터 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs text-content-secondary mb-1">
                전략
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-red-500"
              >
                {STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-content-secondary mb-1">
                분석 기간
              </label>
              <div className="flex gap-1">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                      days === d
                        ? "bg-red-600 text-white"
                        : "bg-surface-tertiary text-content-secondary hover:text-content"
                    }`}
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {analysis && analysis.totalLosses > 0 ? (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-surface-secondary rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs sm:text-sm text-content-secondary">
                  총 손실 거래
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-400">
                {formatNumber(analysis.totalLosses)}회
              </p>
            </div>
            <div className="bg-surface-secondary rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-blue-400" />
                <span className="text-xs sm:text-sm text-content-secondary">
                  평균 손실률
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">
                {formatPercent(analysis.avgLossRate, 2)}
              </p>
            </div>
          </div>

          {/* 지표별 분석 */}
          <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-content mb-4">
              손실 시점 평균 지표
            </h3>
            <div className="space-y-4">
              {/* RSI */}
              <div className="p-3 sm:p-4 bg-surface-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-content">RSI</span>
                  </div>
                  <span className="text-lg font-bold text-content">
                    {formatNumber(analysis.avgRsi, { decimals: 1 })}
                  </span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full mb-2">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(analysis.avgRsi, 100)}%` }}
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-content-secondary">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{getMetricInterpretation("rsi", analysis.avgRsi)}</span>
                </div>
              </div>

              {/* Volume Ratio */}
              <div className="p-3 sm:p-4 bg-surface-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-content">거래량 비율</span>
                  </div>
                  <span className="text-lg font-bold text-content">
                    {formatNumber(analysis.avgVolumeRatio, { decimals: 2 })}x
                  </span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full mb-2">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min((analysis.avgVolumeRatio / 5) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-content-secondary">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{getMetricInterpretation("volumeRatio", analysis.avgVolumeRatio)}</span>
                </div>
              </div>

              {/* Density */}
              <div className="p-3 sm:p-4 bg-surface-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium text-content">캔들 밀도</span>
                  </div>
                  <span className="text-lg font-bold text-content">
                    {formatPercent(analysis.avgDensity * 100, 1)}
                  </span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full mb-2">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${analysis.avgDensity * 100}%` }}
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-content-secondary">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{getMetricInterpretation("density", analysis.avgDensity)}</span>
                </div>
              </div>

              {/* Z-Score */}
              <div className="p-3 sm:p-4 bg-surface-tertiary/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-content">Z-Score</span>
                  </div>
                  <span className="text-lg font-bold text-content">
                    {formatNumber(analysis.avgZScore, { decimals: 2 })}
                  </span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full mb-2">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((analysis.avgZScore / 5) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-start gap-2 text-xs text-content-secondary">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{getMetricInterpretation("zScore", analysis.avgZScore)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 개선 제안 */}
          <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-content mb-4">
              개선 제안
            </h3>
            <div className="space-y-3">
              {analysis.avgRsi < 35 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium mb-1">
                    RSI 기준 조정 필요
                  </p>
                  <p className="text-content-secondary text-xs">
                    손실 평균 RSI가 {formatNumber(analysis.avgRsi, { decimals: 1 })}로 낮습니다.
                    과매도 구간(30 이하) 진입을 피하거나 RSI 35 이상에서만 진입하세요.
                  </p>
                </div>
              )}
              {analysis.avgVolumeRatio < 1.5 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm font-medium mb-1">
                    거래량 기준 상향 필요
                  </p>
                  <p className="text-content-secondary text-xs">
                    손실 시 평균 거래량 비율이 {formatNumber(analysis.avgVolumeRatio, { decimals: 2 })}x입니다.
                    최소 1.5x 이상의 거래량 조건을 추가하세요.
                  </p>
                </div>
              )}
              {analysis.avgZScore < 2.0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm font-medium mb-1">
                    시그널 강도 기준 상향 필요
                  </p>
                  <p className="text-content-secondary text-xs">
                    손실 시 평균 Z-Score가 {formatNumber(analysis.avgZScore, { decimals: 2 })}입니다.
                    Z-Score 2.5 이상에서만 진입하면 손실을 줄일 수 있습니다.
                  </p>
                </div>
              )}
              {analysis.avgDensity < 0.3 && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-400 text-sm font-medium mb-1">
                    캔들 밀도 기준 추가 필요
                  </p>
                  <p className="text-content-secondary text-xs">
                    손실 시 평균 밀도가 {formatPercent(analysis.avgDensity * 100, 1)}입니다.
                    밀도 30% 이상에서만 진입하여 추세 강도를 확인하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12 text-content-secondary">
            <TrendingDown className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-sm sm:text-base">손실 데이터가 없습니다</p>
            <p className="text-xs sm:text-sm mt-1 sm:mt-2">
              선택한 기간 동안 손실 거래가 없습니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LossAnalysis;
