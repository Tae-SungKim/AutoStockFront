import React, { useState } from "react";
import {
  Play,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Percent,
  Activity,
} from "lucide-react";
import { replayApi, type SimulationResult, type MultiSimulationRequest } from "../../api/replayApi";
import { formatNumber, formatWonCompact, formatPercent } from "../../utils/formatUtils";

interface SimulationPanelProps {
  initialStrategy?: string;
  initialMarket?: string;
  sessionId?: string;
}

const STRATEGIES = [
  { value: "VolumeConfirmedBreakoutStrategy", label: "돌파 전략" },
  { value: "impulse", label: "임펄스 전략" },
  { value: "momentum", label: "모멘텀 전략" },
];

// 날짜 기본값 (최근 7일)
const getDefaultDates = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
};

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  initialStrategy = "VolumeConfirmedBreakoutStrategy",
  initialMarket = "",
  sessionId,
}) => {
  const defaultDates = getDefaultDates();

  const [mode, setMode] = useState<"single" | "multi" | "session">(
    sessionId ? "session" : "single"
  );
  const [strategy, setStrategy] = useState(initialStrategy);
  const [market, setMarket] = useState(initialMarket);
  const [markets, setMarkets] = useState("");
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);
  const [capital, setCapital] = useState(1000000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      if (mode === "session" && sessionId) {
        const result = await replayApi.runSessionSimulation(sessionId, capital);
        setResults([result]);
      } else if (mode === "multi") {
        const marketList = markets
          .split(",")
          .map((m) => m.trim())
          .filter((m) => m);

        if (marketList.length === 0) {
          throw new Error("마켓을 입력해주세요");
        }

        const request: MultiSimulationRequest = {
          strategy,
          markets: marketList,
          from,
          to,
          capital,
        };
        const result = await replayApi.runMultiSimulation(request);
        setResults(result);
      } else {
        if (!market) {
          throw new Error("마켓을 입력해주세요");
        }
        const result = await replayApi.runSimulation({
          strategy,
          market,
          from,
          to,
          capital,
        });
        setResults([result]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("시뮬레이션 실패"));
    } finally {
      setLoading(false);
    }
  };

  // 결과 요약 계산
  const summary = results.length > 0
    ? {
        totalReturn: results.reduce((sum, r) => sum + (r.totalReturn ?? 0), 0) / results.length,
        totalTrades: results.reduce((sum, r) => sum + (r.totalTrades ?? 0), 0),
        avgWinRate:
          results.reduce((sum, r) => sum + (r.winRate ?? 0), 0) / results.length,
        avgMaxDrawdown:
          results.reduce((sum, r) => sum + (r.maxDrawdown ?? 0), 0) / results.length,
        successCount: results.filter((r) => !r.error && (r.totalReturn ?? 0) > 0).length,
      }
    : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 설정 패널 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-content">
              시뮬레이션 실행
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary">
              과거 로그 기반 수익 시뮬레이션
            </p>
          </div>
        </div>

        {/* 모드 선택 */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setMode("single")}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
              mode === "single"
                ? "bg-green-600 text-white"
                : "bg-surface-tertiary text-content-secondary hover:text-content"
            }`}
          >
            단일 마켓
          </button>
          <button
            onClick={() => setMode("multi")}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
              mode === "multi"
                ? "bg-green-600 text-white"
                : "bg-surface-tertiary text-content-secondary hover:text-content"
            }`}
          >
            멀티 마켓
          </button>
          {sessionId && (
            <button
              onClick={() => setMode("session")}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                mode === "session"
                  ? "bg-green-600 text-white"
                  : "bg-surface-tertiary text-content-secondary hover:text-content"
              }`}
            >
              세션 기반
            </button>
          )}
        </div>

        {/* 입력 폼 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {mode !== "session" && (
            <>
              <div>
                <label className="block text-xs text-content-secondary mb-1">
                  전략
                </label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-green-500"
                >
                  {STRATEGIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "single" ? (
                <div>
                  <label className="block text-xs text-content-secondary mb-1">
                    마켓
                  </label>
                  <input
                    type="text"
                    value={market}
                    onChange={(e) => setMarket(e.target.value.toUpperCase())}
                    placeholder="KRW-BTC"
                    className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-xs text-content-secondary mb-1">
                    마켓 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={markets}
                    onChange={(e) => setMarkets(e.target.value.toUpperCase())}
                    placeholder="KRW-BTC, KRW-ETH, KRW-XRP"
                    className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-content-secondary mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-xs text-content-secondary mb-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </>
          )}

          <div className={mode === "session" ? "sm:col-span-2" : ""}>
            <label className="block text-xs text-content-secondary mb-1">
              초기 자본
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              min={10000}
              step={100000}
              className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* 실행 버튼 */}
        <button
          onClick={runSimulation}
          disabled={loading}
          className="w-full mt-4 px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          시뮬레이션 실행
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error.message}</span>
          </div>
        )}
      </div>

      {/* 결과 요약 */}
      {summary && (
        <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-content mb-4">
            결과 요약
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
            <div className="bg-surface-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-xs text-content-secondary">평균 수익률</span>
              </div>
              <p
                className={`text-lg sm:text-xl font-bold ${
                  summary.totalReturn >= 0 ? "text-red-400" : "text-blue-400"
                }`}
              >
                {formatPercent(summary.totalReturn, 2, true)}
              </p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                <span className="text-xs text-content-secondary">총 거래</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-content">
                {formatNumber(summary.totalTrades)}
              </p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-xs text-content-secondary">평균 승률</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-content">
                {formatPercent(summary.avgWinRate, 1)}
              </p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                <span className="text-xs text-content-secondary">평균 MDD</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-400">
                {formatPercent(summary.avgMaxDrawdown, 1)}
              </p>
            </div>
            <div className="bg-surface-tertiary/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-xs text-content-secondary">수익 마켓</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-content">
                {summary.successCount}/{results.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 상세 결과 */}
      {results.length > 0 && (
        <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-content mb-4">
            상세 결과 ({results.length}개 마켓)
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-lg ${
                  result.error
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-surface-tertiary/50"
                }`}
              >
                {result.error ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">{result.market}</span>
                    <span className="text-sm">- {result.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-content">
                          {result.market}
                        </span>
                        <span className="text-xs text-content-secondary">
                          {result.strategy}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(result.totalReturn ?? 0) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                        )}
                        <span
                          className={`font-bold ${
                            (result.totalReturn ?? 0) >= 0 ? "text-red-400" : "text-blue-400"
                          }`}
                        >
                          {formatPercent(result.totalReturn ?? 0, 2, true)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-content-secondary">거래:</span>{" "}
                        <span className="text-content">{result.totalTrades}회</span>
                      </div>
                      <div>
                        <span className="text-content-secondary">승률:</span>{" "}
                        <span className="text-content">
                          {formatPercent(result.winRate ?? 0, 1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-content-secondary">최종 자본:</span>{" "}
                        <span className="text-content">
                          {formatWonCompact(result.finalCapital)}
                        </span>
                      </div>
                      <div>
                        <span className="text-content-secondary">MDD:</span>{" "}
                        <span className="text-red-400">
                          {formatPercent(result.maxDrawdown ?? 0, 1)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;
