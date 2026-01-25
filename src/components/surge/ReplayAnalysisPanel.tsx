import React, { useState, useCallback } from "react";
import {
  Play,
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { impulseReplayApi, type ReplayResult, type ReplayAnalysis } from "../../api/realTradingApi";

interface ReplayAnalysisPanelProps {
  initialMarket?: string;
}

export const ReplayAnalysisPanel: React.FC<ReplayAnalysisPanelProps> = ({
  initialMarket = "KRW-BTC",
}) => {
  const [market, setMarket] = useState(initialMarket);
  const [count, setCount] = useState(200);
  const [replayResult, setReplayResult] = useState<ReplayResult | null>(null);
  const [analysis, setAnalysis] = useState<ReplayAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<"replay" | "analysis">("replay");

  const runReplay = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await impulseReplayApi.runReplay(market, count);
      setReplayResult(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("리플레이 실행 실패"));
    } finally {
      setLoading(false);
    }
  }, [market, count]);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await impulseReplayApi.getAnalysis(market, count);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("분석 실행 실패"));
    } finally {
      setLoading(false);
    }
  }, [market, count]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">시그널 리플레이</h2>
            <p className="text-sm text-gray-400">과거 시그널 검증 및 분석</p>
          </div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">마켓</label>
          <input
            type="text"
            value={market}
            onChange={(e) => setMarket(e.target.value.toUpperCase())}
            placeholder="KRW-BTC"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">캔들 수</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value={50}>50개</option>
            <option value={100}>100개</option>
            <option value={200}>200개</option>
            <option value={500}>500개</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={runReplay}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading && activeTab === "replay" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            리플레이
          </button>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading && activeTab === "analysis" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            분석
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error.message}</p>
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("replay")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "replay"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          리플레이 결과
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "analysis"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          분석 결과
        </button>
      </div>

      {/* 리플레이 결과 */}
      {activeTab === "replay" && replayResult && (
        <div className="space-y-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">총 시그널</p>
              <p className="text-2xl font-bold text-white">
                {replayResult.totalSignals ?? 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">유효 시그널</p>
              <p className="text-2xl font-bold text-green-400">
                {replayResult.validSignals ?? 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">무효 시그널</p>
              <p className="text-2xl font-bold text-red-400">
                {replayResult.invalidSignals ?? 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">성공률</p>
              <p className="text-2xl font-bold text-blue-400">
                {formatNumber(replayResult.summary?.successRate ?? 0)}%
              </p>
            </div>
          </div>

          {/* 평균 지표 */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">평균 지표</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">Z-Score</p>
                <p className="text-lg font-bold text-purple-400">
                  {formatNumber(replayResult.summary?.avgZScore ?? 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">거래량</p>
                <p className="text-lg font-bold text-blue-400">
                  {formatNumber(replayResult.summary?.avgVolume ?? 0)}x
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">밀도</p>
                <p className="text-lg font-bold text-yellow-400">
                  {formatNumber((replayResult.summary?.avgDensity ?? 0) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* 시그널 목록 */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              시그널 목록 (최근 20개)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-600">
                    <th className="text-left py-2">시간</th>
                    <th className="text-right py-2">Z-Score</th>
                    <th className="text-right py-2">거래량</th>
                    <th className="text-right py-2">밀도</th>
                    <th className="text-right py-2">가격변동</th>
                    <th className="text-center py-2">유효</th>
                  </tr>
                </thead>
                <tbody>
                  {(replayResult.signals ?? []).slice(0, 20).map((signal, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="py-2 text-gray-300">
                        {new Date(signal.timestamp).toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2 text-right text-purple-400">
                        {formatNumber(signal.zScore)}
                      </td>
                      <td className="py-2 text-right text-blue-400">
                        {formatNumber(signal.normalizedVolume)}x
                      </td>
                      <td className="py-2 text-right text-yellow-400">
                        {formatNumber(signal.candleDensity * 100)}%
                      </td>
                      <td
                        className={`py-2 text-right ${
                          signal.priceChange >= 0 ? "text-red-400" : "text-blue-400"
                        }`}
                      >
                        {signal.priceChange >= 0 ? "+" : ""}
                        {formatNumber(signal.priceChange)}%
                      </td>
                      <td className="py-2 text-center">
                        {signal.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-400 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 분석 결과 */}
      {activeTab === "analysis" && analysis && (
        <div className="space-y-6">
          {/* 분석 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">강한 시그널</p>
              <p className="text-2xl font-bold text-green-400">
                {analysis.analysis?.strongSignals ?? 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">약한 시그널</p>
              <p className="text-2xl font-bold text-yellow-400">
                {analysis.analysis?.weakSignals ?? 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">가짜 시그널</p>
              <p className="text-2xl font-bold text-red-400">
                {analysis.analysis?.fakeSignals ?? 0}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">수익률</p>
              <p className="text-2xl font-bold text-blue-400">
                {formatNumber(analysis.analysis?.profitableRate ?? 0)}%
              </p>
            </div>
          </div>

          {/* 수익/손실 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">평균 수익</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                +{formatNumber(analysis.analysis?.avgProfit ?? 0)}%
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">평균 손실</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {formatNumber(analysis.analysis?.avgLoss ?? 0)}%
              </p>
            </div>
          </div>

          {/* 시간대 분석 */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">시간대 분석</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">최적 시간대</p>
                <div className="flex flex-wrap gap-2">
                  {(analysis.analysis?.bestTimeSlots ?? []).map((hour) => (
                    <span
                      key={hour}
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm"
                    >
                      {hour}시
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">비추천 시간대</p>
                <div className="flex flex-wrap gap-2">
                  {(analysis.analysis?.worstTimeSlots ?? []).map((hour) => (
                    <span
                      key={hour}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm"
                    >
                      {hour}시
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 추천 사항 */}
          {(analysis.recommendations ?? []).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-400 mb-3">추천 사항</h3>
              <ul className="space-y-2">
                {(analysis.recommendations ?? []).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 평균 보유 시간 */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">평균 보유 시간:</span>
              <span className="text-white font-medium">
                {analysis.analysis?.avgHoldingTime ?? 0}분
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!replayResult && !analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>마켓을 입력하고 리플레이 또는 분석을 실행하세요</p>
        </div>
      )}
    </div>
  );
};

export default ReplayAnalysisPanel;
