import React, { useState, useEffect } from "react";
import { strategyOptimizerService } from "../api/upbitApi";
import type { OptimizerStats, OptimizeResult, CurrentParams, OptimizedParams } from "../types";
import {
  Zap,
  Database,
  Play,
  RefreshCw,
  Check,
  AlertCircle,
  TrendingUp,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { useSimulationPolling } from "../hooks/useSimulationPolling";
import { SimulationProgressView } from "./SimulationProgressView";

// 전략명 한글 매핑
const strategyNameKorean: Record<string, string> = {
  "BollingerBandStrategy": "볼린저밴드 전략",
  "RSIStrategy": "RSI 전략",
  "MACDStrategy": "MACD 전략",
  "VolumeStrategy": "거래량 전략",
  "MovingAverageStrategy": "이동평균 전략",
  "StochasticStrategy": "스토캐스틱 전략",
  "IchimokuStrategy": "일목균형표 전략",
  "DataDrivenStrategy": "데이터 기반 전략",
};

// 파라미터 키 한글 매핑 (전체 키 우선, 그 다음 부분 키)
const paramKeyKorean: Record<string, string> = {
  // 볼린저밴드 관련 (전체 키)
  "bollinger.period": "볼린저 기간",
  "bollinger.multiplier": "볼린저 배수",
  "bollingerPeriod": "볼린저 기간",
  "bollingerMultiplier": "볼린저 배수",

  // RSI 관련 (전체 키)
  "rsi.period": "RSI 기간",
  "rsi.overbought": "RSI 과매수",
  "rsi.oversold": "RSI 과매도",
  "rsi.buyThreshold": "RSI 매수 기준",
  "rsi.sellThreshold": "RSI 매도 기준",
  "rsiPeriod": "RSI 기간",
  "rsiBuyThreshold": "RSI 매수 기준",
  "rsiSellThreshold": "RSI 매도 기준",

  // 손익 관련 (전체 키 - 중요!)
  "stopLoss.rate": "손절률",
  "takeProfit.rate": "익절률",
  "trailingStop.rate": "추적손절률",
  "stopLossRate": "손절률",
  "takeProfitRate": "익절률",
  "trailingStopRate": "추적손절률",

  // 거래량 관련 (전체 키)
  "volume.threshold": "거래량 기준",
  "volume.period": "거래량 기간",
  "volume.multiplier": "거래량 배수",
  "volumeIncreaseRate": "거래량 증가율",
  "volumeMultiplier": "거래량 배수",
  "volumePeriod": "거래량 기간",

  // MACD 관련 (전체 키)
  "macd.shortPeriod": "MACD 단기",
  "macd.longPeriod": "MACD 장기",
  "macd.signalPeriod": "MACD 시그널",
  "shortPeriod": "단기 기간",
  "longPeriod": "장기 기간",
  "signalPeriod": "시그널 기간",
  "fastPeriod": "빠른 기간",
  "slowPeriod": "느린 기간",

  // 이동평균 관련
  "ma.shortPeriod": "단기 이평선",
  "ma.longPeriod": "장기 이평선",
  "shortMaPeriod": "단기 이평선",
  "longMaPeriod": "장기 이평선",
  "maPeriod": "이평선 기간",

  // 예상 수익 관련
  "expectedWinRate": "예상 승률",
  "expectedProfitRate": "예상 수익률",

  // 부분 키 (fallback)
  "period": "기간",
  "multiplier": "배수",
  "threshold": "기준값",
  "overbought": "과매수",
  "oversold": "과매도",
  "rate": "비율",

  // 기타
  "enabled": "활성화",
  "priority": "우선순위",
  "minVolume": "최소 거래량",
  "maxVolume": "최대 거래량",
  "weight": "가중치",
};

// 파라미터 키를 한글로 변환하는 함수
const getKoreanParamKey = (key: string): string => {
  // 1. 전체 키로 먼저 매핑 시도
  if (paramKeyKorean[key]) {
    return paramKeyKorean[key];
  }
  // 2. 전체 키가 없으면 마지막 부분으로 시도
  const lastPart = key.split('.').pop() || key;
  return paramKeyKorean[lastPart] || lastPart;
};

// 전략명을 한글로 변환하는 함수
const getKoreanStrategyName = (name: string): string => {
  return strategyNameKorean[name] || name;
};

const StrategyOptimizer: React.FC = () => {
  const [stats, setStats] = useState<OptimizerStats | null>(null);
  const [currentParams, setCurrentParams] = useState<CurrentParams | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [lastOptimizedParams, setLastOptimizedParams] = useState<OptimizedParams | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("stats");
  const [useAsyncMode, setUseAsyncMode] = useState<boolean>(true); // 비동기 모드 토글
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // 비동기 폴링 훅
  const {
    status: simulationStatus,
    result: simulationResult,
    error: simulationError,
    isPolling,
    startPolling,
    stopPolling,
    cancelTask,
  } = useSimulationPolling();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await strategyOptimizerService.getStats();
      // API 응답 구조 검증
      if (data && typeof data === "object") {
        setStats({
          totalMarkets: data.totalMarkets ?? 0,
          totalCandles: data.totalCandles ?? 0,
          markets: Array.isArray(data.markets) ? data.markets : [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // 에러 시 빈 상태로 설정
      setStats({ totalMarkets: 0, totalCandles: 0, markets: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentParams = async () => {
    try {
      const data = await strategyOptimizerService.getCurrentParams();
      if (data && typeof data === "object") {
        setCurrentParams(data);
      }
    } catch (error) {
      console.error("Failed to fetch current params:", error);
    }
  };

  // 새로고침 복구: localStorage에서 taskId 확인
  useEffect(() => {
    const savedTaskId = localStorage.getItem("sim_task_id");
    const startTime = localStorage.getItem("sim_start_time");

    if (savedTaskId && startTime) {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);

      // 24시간 이내의 작업만 복구
      if (elapsed < 86400) {
        console.log("Restoring simulation task:", savedTaskId);
        startPolling(savedTaskId);
      } else {
        // 오래된 taskId 제거
        localStorage.removeItem("sim_task_id");
        localStorage.removeItem("sim_start_time");
      }
    }
  }, [startPolling]);

  // 시뮬레이션 완료 시 결과 처리
  useEffect(() => {
    if (simulationResult?.status === "COMPLETED" && simulationResult.result) {
      setOptimizeResult(simulationResult.result);
      if (simulationResult.result.params) {
        setLastOptimizedParams(simulationResult.result.params);
      }
      setMessage({ type: "success", text: "최적화가 완료되었습니다!" });
      fetchCurrentParams();
    } else if (simulationError) {
      setMessage({ type: "error", text: simulationError });
    }
  }, [simulationResult, simulationError]);

  // 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPolling) {
        e.preventDefault();
        e.returnValue = "작업이 진행 중입니다. 페이지를 나가시겠습니까?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPolling]);

  useEffect(() => {
    fetchStats();
    fetchCurrentParams();
  }, []);

  const handleOptimizeAll = async () => {
    if (!confirm("전체 최적화를 실행하시겠습니까? 수 분이 소요될 수 있습니다.")) return;

    setMessage(null);
    setOptimizeResult(null);

    if (useAsyncMode) {
      // 비동기 모드
      try {
        setOptimizing(true);
        console.log("[Optimizer] Starting async optimization...");
        const task = await strategyOptimizerService.startAsyncOptimization();
        console.log("[Optimizer] Task created:", task);
        startPolling(task.taskId);
      } catch (error: any) {
        console.error("[Optimizer] Failed to start optimization:", error);
        console.error("[Optimizer] Error response:", error.response);

        const errorMessage = error.response?.data?.message
          || error.response?.data?.error
          || error.message
          || "작업 시작에 실패했습니다.";

        const statusCode = error.response?.status;
        const fullMessage = statusCode
          ? `[${statusCode}] ${errorMessage}`
          : errorMessage;

        setMessage({
          type: "error",
          text: fullMessage
        });
      } finally {
        setOptimizing(false);
      }
    } else {
      // 동기 모드 (기존)
      try {
        setOptimizing(true);
        const result = await strategyOptimizerService.optimizeAndApply();
        setOptimizeResult(result);
        if (result.success) {
          setMessage({ type: "success", text: result.message });
          if (result.params) {
            setLastOptimizedParams(result.params);
          }
          fetchCurrentParams();
        } else {
          setMessage({ type: "error", text: result.message });
        }
      } catch (error: any) {
        console.error("[Optimizer] Sync optimization failed:", error);
        setMessage({
          type: "error",
          text: error.response?.data?.message || "최적화 실행에 실패했습니다."
        });
      } finally {
        setOptimizing(false);
      }
    }
  };

  const handleCancelSimulation = async () => {
    if (!confirm("작업을 취소하시겠습니까?")) return;

    try {
      setIsCancelling(true);
      await cancelTask();
      setMessage({ type: "success", text: "작업이 취소되었습니다." });
    } catch (error) {
      setMessage({ type: "error", text: "취소 요청에 실패했습니다." });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResetPolling = () => {
    if (!confirm("진행 중인 작업 추적을 중지하시겠습니까?")) return;

    stopPolling();
    localStorage.removeItem("sim_task_id");
    localStorage.removeItem("sim_start_time");
    setMessage({ type: "success", text: "작업 추적이 중지되었습니다." });
  };

  const handleOptimizeMarket = async () => {
    if (!selectedMarket) {
      setMessage({ type: "error", text: "마켓을 선택해주세요." });
      return;
    }

    try {
      setOptimizing(true);
      setMessage(null);
      const result = await strategyOptimizerService.optimizeAndApplyMarket(selectedMarket);
      setOptimizeResult(result);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        if (result.params) {
          setLastOptimizedParams(result.params);
        }
        fetchCurrentParams();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "마켓 최적화 실행에 실패했습니다." });
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyParams = async () => {
    if (!lastOptimizedParams) {
      setMessage({ type: "error", text: "적용할 최적화 파라미터가 없습니다. 먼저 최적화를 실행해주세요." });
      return;
    }

    try {
      setApplying(true);
      setMessage(null);
      const result = await strategyOptimizerService.applyParams(lastOptimizedParams);
      if (result.success) {
        setMessage({ type: "success", text: result.message || "파라미터가 적용되었습니다." });
        fetchCurrentParams();
      } else {
        setMessage({ type: "error", text: result.message || "파라미터 적용에 실패했습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "파라미터 적용에 실패했습니다." });
    } finally {
      setApplying(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Zap className="text-yellow-500" />
          전략 최적화
        </h1>
        <button
          onClick={() => {
            fetchStats();
            fetchCurrentParams();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {message.text}
        </div>
      )}

      {/* 시뮬레이션 진행 상태 (비동기 모드) */}
      {isPolling && simulationStatus && (
        <SimulationProgressView
          status={simulationStatus}
          onCancel={handleCancelSimulation}
          isCancelling={isCancelling}
        />
      )}

      {/* 디버깅: 강제로 폴링 중지 (항상 표시) */}
      {isPolling && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                디버깅 도구
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                폴링이 멈추지 않을 때 사용하세요
              </p>
            </div>
            <button
              onClick={handleResetPolling}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              🔧 강제 중지
            </button>
          </div>
        </div>
      )}

      {/* Data Statistics Section */}
      <div className="bg-white rounded-lg shadow border border-gray-100">
        <button
          className="w-full flex justify-between items-center p-4 border-b"
          onClick={() => toggleSection("stats")}
        >
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Database className="text-blue-500" />
            데이터 통계
          </h2>
          {expandedSection === "stats" ? (
            <ChevronUp className="text-gray-400" />
          ) : (
            <ChevronDown className="text-gray-400" />
          )}
        </button>

        {expandedSection === "stats" && (
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-600">분석 마켓</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {stats.totalMarkets ?? 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-purple-600">총 캔들 데이터</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {(stats.totalCandles ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {stats.markets && stats.markets.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">마켓별 데이터</h3>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">마켓</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">캔들 수</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">시작일</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">종료일</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {stats.markets.map((market) => (
                            <tr key={market.market} className="hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">{market.market}</td>
                              <td className="px-4 py-2 text-right">{(market.candleCount ?? 0).toLocaleString()}</td>
                              <td className="px-4 py-2 text-right text-sm text-gray-500">
                                {market.startDate?.substring(0, 10) || "-"}
                              </td>
                              <td className="px-4 py-2 text-right text-sm text-gray-500">
                                {market.endDate?.substring(0, 10) || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">데이터가 없습니다.</div>
            )}
          </div>
        )}
      </div>

      {/* Optimization Section */}
      <div className="bg-white rounded-lg shadow border border-gray-100">
        <button
          className="w-full flex justify-between items-center p-4 border-b"
          onClick={() => toggleSection("optimize")}
        >
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Target className="text-orange-500" />
            최적화 실행
          </h2>
          {expandedSection === "optimize" ? (
            <ChevronUp className="text-gray-400" />
          ) : (
            <ChevronDown className="text-gray-400" />
          )}
        </button>

        {expandedSection === "optimize" && (
          <div className="p-4 space-y-4">
            {/* 모드 전환 토글 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {useAsyncMode ? "비동기 모드 (권장)" : "동기 모드"}
                  </p>
                  <p className="text-xs text-blue-700">
                    {useAsyncMode
                      ? "백그라운드에서 실행되며 진행 상황을 실시간으로 확인할 수 있습니다."
                      : "작업이 완료될 때까지 브라우저가 대기합니다."}
                  </p>
                </div>
                <button
                  onClick={() => setUseAsyncMode(!useAsyncMode)}
                  disabled={isPolling || optimizing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    useAsyncMode ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useAsyncMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>주의:</strong> 최적화는 6,561개의 파라미터 조합을 테스트합니다.
                전체 최적화는 수 분이 소요될 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 전체 최적화 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">전체 최적화</h3>
                <p className="text-sm text-gray-500 mb-4">
                  모든 마켓 데이터를 분석하여 최적의 글로벌 파라미터를 찾습니다.
                </p>
                <button
                  onClick={handleOptimizeAll}
                  disabled={optimizing || isPolling}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
                >
                  {optimizing || isPolling ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} />
                  )}
                  {optimizing ? "시작 중..." : isPolling ? "실행 중..." : "전체 최적화 실행"}
                </button>
              </div>

              {/* 마켓별 최적화 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">마켓별 최적화</h3>
                <p className="text-sm text-gray-500 mb-4">
                  특정 마켓에 맞는 개별 파라미터를 찾습니다.
                </p>
                <div className="flex gap-2">
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="flex-1 p-2 border rounded-lg"
                  >
                    <option value="">마켓 선택</option>
                    {stats?.markets?.map((m) => (
                      <option key={m.market} value={m.market}>
                        {m.market}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleOptimizeMarket}
                    disabled={optimizing || !selectedMarket}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {optimizing ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Play size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 최적화 결과 */}
            {optimizeResult && (
              <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="text-green-500" />
                  최적화 결과
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">예상 승률</p>
                    <p className="text-xl font-bold text-green-600">
                      {optimizeResult.expectedWinRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">예상 수익률</p>
                    <p className="text-xl font-bold text-blue-600">
                      {optimizeResult.expectedProfitRate?.toFixed(2) || 0}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">총 시그널</p>
                    <p className="text-xl font-bold text-purple-600">
                      {optimizeResult.totalSignals || 0}
                    </p>
                  </div>
                </div>

                {optimizeResult.params && (
                  <div className="bg-white p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">최적화된 파라미터</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">볼린저 기간:</span>
                        <span className="font-medium">{optimizeResult.params.bollingerPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">볼린저 배수:</span>
                        <span className="font-medium">{optimizeResult.params.bollingerMultiplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">RSI 기간:</span>
                        <span className="font-medium">{optimizeResult.params.rsiPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">RSI 매수:</span>
                        <span className="font-medium">{optimizeResult.params.rsiBuyThreshold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">RSI 매도:</span>
                        <span className="font-medium">{optimizeResult.params.rsiSellThreshold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">손절률:</span>
                        <span className="font-medium text-red-500">{optimizeResult.params.stopLossRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">익절률:</span>
                        <span className="font-medium text-green-500">{optimizeResult.params.takeProfitRate}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Parameters Section */}
      <div className="bg-white rounded-lg shadow border border-gray-100">
        <button
          className="w-full flex justify-between items-center p-4 border-b"
          onClick={() => toggleSection("params")}
        >
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="text-green-500" />
            현재 적용된 파라미터
          </h2>
          {expandedSection === "params" ? (
            <ChevronUp className="text-gray-400" />
          ) : (
            <ChevronDown className="text-gray-400" />
          )}
        </button>

        {expandedSection === "params" && (
          <div className="p-4">
            {currentParams ? (
              <div className="space-y-4">
                {/* 데이터 기반 파라미터 (DataDrivenStrategy) */}
                {currentParams.dataDrivenParams && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">
                          {currentParams.market || "GLOBAL"}
                        </span>
                        데이터 기반 전략 파라미터
                      </h3>
                      <button
                        onClick={handleApplyParams}
                        disabled={applying || !lastOptimizedParams}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          lastOptimizedParams
                            ? "bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        title={lastOptimizedParams ? "최적화된 파라미터를 적용합니다" : "먼저 최적화를 실행해주세요"}
                      >
                        {applying ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        파라미터 적용
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">볼린저 기간</p>
                        <p className="font-medium">{currentParams.dataDrivenParams.bollingerPeriod}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">볼린저 배수</p>
                        <p className="font-medium">{currentParams.dataDrivenParams.bollingerMultiplier}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">RSI 기간</p>
                        <p className="font-medium">{currentParams.dataDrivenParams.rsiPeriod}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">RSI 매수</p>
                        <p className="font-medium">{currentParams.dataDrivenParams.rsiBuyThreshold}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">RSI 매도</p>
                        <p className="font-medium">{currentParams.dataDrivenParams.rsiSellThreshold}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">거래량 증가율</p>
                        <p className="font-medium">{currentParams.dataDrivenParams.volumeIncreaseRate}%</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">손절률</p>
                        <p className="font-medium text-red-500">{currentParams.dataDrivenParams.stopLossRate}%</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">익절률</p>
                        <p className="font-medium text-green-500">{currentParams.dataDrivenParams.takeProfitRate}%</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">예상 승률</p>
                        <p className="font-medium text-blue-500">{currentParams.dataDrivenParams.expectedWinRate}%</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">예상 수익률</p>
                        <p className="font-medium text-purple-500">{currentParams.dataDrivenParams.expectedProfitRate}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 전략별 파라미터 */}
                {currentParams.strategyParams && Object.keys(currentParams.strategyParams).length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">전략별 파라미터</h3>
                    <div className="space-y-3">
                      {Object.entries(currentParams.strategyParams).map(([strategyName, params]) => {
                        const paramEntries = Object.entries(params);
                        if (paramEntries.length === 0) return null;
                        return (
                          <div key={strategyName} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-600 mb-2">
                              {getKoreanStrategyName(strategyName)}
                              <span className="text-xs text-gray-400 ml-2">({strategyName})</span>
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {paramEntries.map(([key, value]) => (
                                <div key={key} className="flex justify-between bg-white p-1.5 rounded">
                                  <span className="text-gray-500">{getKoreanParamKey(key)}:</span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                파라미터 정보가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyOptimizer;
