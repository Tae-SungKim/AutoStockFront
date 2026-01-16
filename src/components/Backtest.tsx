import { useState, useEffect } from "react";
import {
  Play,
  BarChart3,
  RefreshCw,
  CheckSquare,
  Square,
  Layers,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { backtest, strategyService, alters } from "../api/upbitApi";
import type {
  BacktestResult,
  SimulationResult,
  AvailableStrategy,
  ExitReason,
} from "../types";
import { ExitReasonChart } from "./ExitReasonChart";
import { EXIT_REASON_LABELS } from "../utils/exitReasonUtils";
import { ProgressBar } from "./ProgressBar";

type TabType = "single" | "multi" | "alerts"; // alerts 탭 추가

export function Backtest() {
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [singleResult, setSingleResult] = useState<BacktestResult | null>(null);
  const [multiResult, setMultiResult] = useState<SimulationResult | null>(null);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState(1);

  // 날짜 범위 상태 (기본값: 최근 30일)
  const getDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDates());

  // 전략 관련 상태
  const [availableStrategies, setAvailableStrategies] = useState<
    AvailableStrategy[]
  >([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");

  const [alerts, setAlerts] = useState<any[]>([]); // 급등/급락 감지 결과 상태 추가
  const [alertLoading, setAlertLoading] = useState(false);

  // 멀티 백테스트 진행 상황
  const [progressState, setProgressState] = useState<{
    current: number;
    total: number;
    currentMarket: string;
    completedMarkets: string[];
  } | null>(null);

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // 날짜를 yyyyMMdd 형식으로 변환
  const formatDateToAPI = (dateString: string): string => {
    return dateString.replace(/-/g, "");
  };

  const fetchMarkets = async () => {
    try {
      const markets = await backtest.getMarkets();
      setAvailableMarkets(markets);
      if (markets.length > 0 && !selectedMarket) {
        setSelectedMarket(markets[0]);
      }
      if (markets.length > 0 && selectedMarkets.length === 0) {
        setSelectedMarkets(markets.slice(0, 5));
      }
    } catch (err) {
      console.error("마켓 목록 조회 실패:", err);
    }
  };

  const fetchStrategies = async () => {
    try {
      const strategies = await strategyService.getAvailableStrategies();
      setAvailableStrategies(strategies);
      if (strategies.length > 0 && !selectedStrategy) {
        setSelectedStrategy(strategies[0].className);
      }
    } catch (err) {
      console.error("전략 목록 조회 실패:", err);
    }
  };

  const fetchMarketAlerts = async (market: string) => {
    try {
      setAlertLoading(true);
      const data = await alters.getMarketAlerts(market);
      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch market alerts:", error);
    } finally {
      setAlertLoading(false);
    }
  };

  const handleFetchAlerts = async () => {
    if (selectedMarket) {
      await fetchMarketAlerts(selectedMarket);
    } else {
      setError("마켓을 선택해주세요.");
    }
  };

  // 단일 마켓 백테스트
  const fetchSingleBacktest = async () => {
    if (!selectedStrategy || !selectedMarket) {
      setError("전략과 마켓을 선택해주세요.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await backtest.runDbStrategy(
        selectedStrategy,
        selectedMarket,
        unit,
        formatDateToAPI(dateRange.start),
        formatDateToAPI(dateRange.end)
      );
      setSingleResult(data);
    } catch (err) {
      setError("백테스트 실행에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 멀티 마켓 백테스트
  const fetchMultiBacktest = async () => {
    if (!selectedStrategy) {
      setError("전략을 선택해주세요.");
      return;
    }
    if (selectedMarkets.length === 0) {
      setError("최소 1개 이상의 마켓을 선택해주세요.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setProgressState(null);
      setMultiResult(null); // 이전 결과 초기화

      // 진행 상황 콜백 함수
      const handleProgress = (
        current: number,
        total: number,
        currentMarket: string,
        completed: string[]
      ) => {
        setProgressState({
          current,
          total,
          currentMarket,
          completedMarkets: completed,
        });
      };

      // 청크 단위로 백테스트 실행 (5개씩)
      const data = await backtest.multiDbWithProgress(
        selectedMarkets,
        selectedStrategy,
        unit,
        20, // 청크 사이즈
        handleProgress,
        formatDateToAPI(dateRange.start),
        formatDateToAPI(dateRange.end)
      );

      setMultiResult(data);
      setProgressState(null); // 완료 후 프로그래스 숨김

      // 일부 마켓이 실패한 경우 경고 메시지 표시
      const failedCount = selectedMarkets.length - data.totalMarkets;
      if (failedCount > 0) {
        setError(
          `백테스트 완료: ${data.totalMarkets}개 성공, ${failedCount}개 실패. 성공한 결과를 표시합니다.`
        );
      }
    } catch (err: any) {
      const errorMsg = err.message || "멀티마켓 백테스트 실행에 실패했습니다.";
      setError(errorMsg);
      console.error(err);
      setProgressState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    fetchStrategies();
  }, []);

  const handleRunBacktest = async () => {
    if (activeTab === "single") {
      await fetchSingleBacktest();
    } else {
      await fetchMultiBacktest();
    }
  };

  const toggleMarket = (market: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  const selectAllMarkets = () => {
    setSelectedMarkets([...availableMarkets]);
  };

  const clearAllMarkets = () => {
    setSelectedMarkets([]);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">
            백테스트 (DB 데이터)
          </h2>
        </div>
        {activeTab === "alerts" && (
          <button
            onClick={handleFetchAlerts}
            disabled={alertLoading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            {alertLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            감지 실행
          </button>
        )}
        {activeTab !== "alerts" && (
          <button
            onClick={handleRunBacktest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            실행
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("single")}
          className={
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
            (activeTab === "single"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          단일 마켓
        </button>
        <button
          onClick={() => setActiveTab("multi")}
          className={
            "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
            (activeTab === "multi"
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          <Layers className="w-4 h-4" />
          멀티 마켓
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={
            "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
            (activeTab === "alerts"
              ? "bg-yellow-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          <AlertTriangle className="w-4 h-4" />
          급등/급락 감지
        </button>
      </div>

      {error && (
        <div
          className={
            error.includes("성공") && error.includes("실패")
              ? "bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-4"
              : "bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4"
          }
        >
          <p
            className={
              error.includes("성공") && error.includes("실패")
                ? "text-yellow-400 text-sm"
                : "text-red-400 text-sm"
            }
          >
            {error}
          </p>
        </div>
      )}

      {/* 공통 설정: 전략 선택 */}
      <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
        <p className="text-white font-medium mb-3">전략 선택</p>
        {availableStrategies.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            전략 목록을 불러오는 중...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableStrategies.map((strategy) => (
              <button
                key={strategy.className}
                onClick={() => setSelectedStrategy(strategy.className)}
                className={
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " +
                  (selectedStrategy === strategy.className
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500")
                }
                title={strategy.description || strategy.name}
              >
                {selectedStrategy === strategy.className ? (
                  <CheckSquare className="w-3 h-3" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
                {strategy.name}
              </button>
            ))}
          </div>
        )}

        {/* 캔들 단위 선택 */}
        <div className="mt-4">
          <label className="text-gray-400 text-xs mb-1 block">
            캔들 단위 (분)
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(Number(e.target.value))}
            className="bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>1분</option>
            <option value={3}>3분</option>
            <option value={5}>5분</option>
            <option value={15}>15분</option>
            <option value={30}>30분</option>
            <option value={60}>60분</option>
          </select>
        </div>

        {/* 날짜 범위 선택 */}
        <div className="mt-4">
          <label className="text-gray-400 text-xs mb-1 block">
            백테스트 기간
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">시작일</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">종료일</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 단일 마켓 탭 */}
      {activeTab === "single" && (
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-white font-medium mb-3">마켓 선택</p>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
            >
              {availableMarkets.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </select>
          </div>

          {/* 단일 백테스트 결과 */}
          {singleResult && !loading && (
            <SingleResultView
              result={singleResult}
              formatNumber={formatNumber}
            />
          )}
        </div>
      )}

      {/* 멀티 마켓 탭 */}
      {activeTab === "multi" && (
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-medium">
                마켓 선택 ({selectedMarkets.length}개 선택됨)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAllMarkets}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  전체 선택
                </button>
                <button
                  onClick={clearAllMarkets}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  선택 해제
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableMarkets.map((market) => (
                <button
                  key={market}
                  onClick={() => toggleMarket(market)}
                  className={
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " +
                    (selectedMarkets.includes(market)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500")
                  }
                >
                  {selectedMarkets.includes(market) ? (
                    <CheckSquare className="w-3 h-3" />
                  ) : (
                    <Square className="w-3 h-3" />
                  )}
                  {market.replace("KRW-", "")}
                </button>
              ))}
            </div>
          </div>

          {/* 프로그래스 바 */}
          {progressState && (
            <ProgressBar
              total={progressState.total}
              current={progressState.current}
              currentMarket={progressState.currentMarket}
              completedMarkets={progressState.completedMarkets}
            />
          )}

          {/* 멀티 마켓 결과 */}
          {multiResult && !loading && (
            <MultiResultView result={multiResult} formatNumber={formatNumber} />
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-white font-medium mb-3">급등/급락 감지 결과</p>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                감지된 결과가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded-lg flex items-center justify-between border border-gray-700"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {alert.market} - {alert.alertType}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {alert.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {alert.currentPrice.toLocaleString()}원
                      </p>
                      <p
                        className={
                          alert.changeRate >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {alert.changeRate >= 0 ? "+" : ""}
                        {alert.changeRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}
    </div>
  );
}

function SingleResultView({
  result,
  formatNumber,
}: {
  result: BacktestResult;
  formatNumber: (num: number, decimals?: number) => string;
}) {
  const [selectedExitReason, setSelectedExitReason] =
    useState<ExitReason | null>(null);

  // exitReason으로 거래 내역 필터링
  const filteredTradeHistory = selectedExitReason
    ? result.tradeHistory.filter(
        (trade) =>
          trade.type === "SELL" && trade.exitReason === selectedExitReason
      )
    : result.tradeHistory;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-100 text-xs mb-1">마켓</p>
            <p className="text-white font-semibold">{result.market}</p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">전략</p>
            <p className="text-white font-semibold">{result.strategy}</p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">초기 자본</p>
            <p className="text-white font-semibold">
              ₩{formatNumber(result.initialBalance)}
            </p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">수익률</p>
            <p
              className={
                "font-semibold " +
                (result.totalProfitRate >= 0
                  ? "text-green-300"
                  : "text-red-300")
              }
            >
              {result.totalProfitRate >= 0 ? "+" : ""}
              {formatNumber(result.totalProfitRate, 2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="최종 자산"
          value={"₩" + formatNumber(result.finalTotalAsset)}
        />
        <StatCard label="거래 횟수" value={result.totalTrades + "회"} />
        <StatCard label="승률" value={formatNumber(result.winRate, 1) + "%"} />
        <StatCard
          label="Buy&Hold"
          value={formatNumber(result.buyAndHoldRate, 2) + "%"}
        />
      </div>

      {/* 종료 사유 차트 */}
      {result.exitReasonStats && (
        <ExitReasonChart
          exitReasonStats={result.exitReasonStats}
          onReasonClick={setSelectedExitReason}
          selectedReason={selectedExitReason}
        />
      )}

      {/* 거래 내역 */}
      {result.tradeHistory && result.tradeHistory.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">
            거래 내역
            {selectedExitReason && (
              <span className="text-sm text-gray-400 ml-2">
                ({EXIT_REASON_LABELS[selectedExitReason]} 필터링됨:{" "}
                {filteredTradeHistory.length}건)
              </span>
            )}
          </h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-700">
                <tr className="text-gray-400 border-b border-gray-600">
                  <th className="text-left py-2 px-2">시간</th>
                  <th className="text-center py-2 px-1">타입</th>
                  <th className="text-right py-2 px-2">가격</th>
                  <th className="text-right py-2 px-2">수량</th>
                  <th className="text-right py-2 px-2">금액</th>
                  <th className="text-right py-2 px-2">수익률</th>
                  <th className="text-center py-2 px-2">종료사유</th>
                </tr>
              </thead>
              <tbody>
                {filteredTradeHistory.map((trade, idx) => (
                  <tr
                    key={idx}
                    className={
                      "border-b border-gray-600/50 " +
                      (trade.type === "BUY" ? "bg-green-500/5" : "bg-red-500/5")
                    }
                  >
                    <td className="py-2 px-2 text-gray-300">
                      {trade.timestamp.replace("T", " ").substring(5, 16)}
                    </td>
                    <td className="py-2 px-1 text-center">
                      <span
                        className={
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium " +
                          (trade.type === "BUY"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400")
                        }
                      >
                        {trade.type === "BUY" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {trade.type === "BUY" ? "매수" : "매도"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-white">
                      ₩{formatNumber(trade.price)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-300">
                      {trade.volume.toFixed(8)}
                    </td>
                    <td className="py-2 px-2 text-right text-white">
                      ₩{formatNumber(trade.amount)}
                    </td>
                    <td
                      className={
                        "py-2 px-2 text-right font-medium " +
                        (trade.profitRate >= 0
                          ? "text-green-400"
                          : "text-red-400")
                      }
                    >
                      {trade.profitRate >= 0 ? "+" : ""}
                      {formatNumber(trade.profitRate, 2)}%
                    </td>
                    <td className="py-2 px-2 text-center">
                      {trade.type === "SELL" && trade.exitReason ? (
                        <span className="text-gray-300 text-xs">
                          {EXIT_REASON_LABELS[trade.exitReason]}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiResultView({
  result,
  formatNumber,
}: {
  result: SimulationResult;
  formatNumber: (num: number, decimals?: number) => string;
}) {
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [selectedExitReason, setSelectedExitReason] =
    useState<ExitReason | null>(null);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-yellow-300" />
          <p className="text-white font-semibold">{result.strategy}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-100 text-xs mb-1">분석 마켓</p>
            <p className="text-white font-semibold">{result.totalMarkets}개</p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">총 초기자본</p>
            <p className="text-white font-semibold">
              ₩{formatNumber(result.totalInitialBalance)}
            </p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">총 최종자산</p>
            <p className="text-white font-semibold">
              ₩{formatNumber(result.totalFinalAsset)}
            </p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">총 수익률</p>
            <p
              className={
                "font-semibold " +
                (result.totalProfitRate >= 0
                  ? "text-green-300"
                  : "text-red-300")
              }
            >
              {result.totalProfitRate >= 0 ? "+" : ""}
              {formatNumber(result.totalProfitRate, 2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="평균 수익률"
          value={formatNumber(result.averageProfitRate, 2) + "%"}
          positive={result.averageProfitRate >= 0}
        />
        <StatCard
          label="평균 승률"
          value={formatNumber(result.averageWinRate, 1) + "%"}
        />
        <StatCard
          label="수익/손실 마켓"
          value={`${result.profitableMarkets} / ${result.losingMarkets}`}
          positive={result.profitableMarkets > result.losingMarkets}
        />
        <StatCard
          label="최고 마켓"
          value={result.bestMarket.replace("KRW-", "")}
          subValue={
            (result.bestMarketProfitRate >= 0 ? "+" : "") +
            formatNumber(result.bestMarketProfitRate, 2) +
            "%"
          }
          positive={result.bestMarketProfitRate >= 0}
        />
      </div>

      {/* 멀티 코인 전체 종료 사유 차트 */}
      {result.totalExitReasonStats && (
        <ExitReasonChart
          exitReasonStats={result.totalExitReasonStats}
          onReasonClick={setSelectedExitReason}
          selectedReason={selectedExitReason}
        />
      )}

      {/* Market Results */}
      <div>
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          마켓별 결과
          {selectedExitReason && (
            <span className="text-sm text-gray-400">
              ({EXIT_REASON_LABELS[selectedExitReason]} 필터링됨)
            </span>
          )}
        </h3>
        <div className="space-y-2">
          {result.marketResults
            .filter((marketResult) => {
              // 선택된 종료 사유가 없으면 모든 마켓 표시
              if (!selectedExitReason) return true;

              // 선택된 종료 사유를 가진 거래가 있는 마켓만 표시
              return marketResult.tradeHistory?.some(
                (trade) =>
                  trade.type === "SELL" &&
                  trade.exitReason === selectedExitReason
              );
            })
            .map((marketResult) => (
              <div
                key={marketResult.market}
                className="bg-gray-700/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedMarket(
                      expandedMarket === marketResult.market
                        ? null
                        : marketResult.market
                    )
                  }
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {marketResult.market.replace("KRW-", "")}
                    </span>
                    <span className="text-gray-400 text-sm">
                      거래 {marketResult.totalTrades}회
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={
                        "font-medium " +
                        (marketResult.totalProfitRate >= 0
                          ? "text-green-400"
                          : "text-red-400")
                      }
                    >
                      {marketResult.totalProfitRate >= 0 ? "+" : ""}
                      {formatNumber(marketResult.totalProfitRate, 2)}%
                    </span>
                    {expandedMarket === marketResult.market ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedMarket === marketResult.market && (
                  <div className="px-3 pb-3 border-t border-gray-600">
                    <div className="grid grid-cols-4 gap-2 py-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">최종 자산</p>
                        <p className="text-white">
                          ₩{formatNumber(marketResult.finalTotalAsset)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Buy&Hold</p>
                        <p className="text-blue-400">
                          {formatNumber(marketResult.buyAndHoldRate, 2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">승률</p>
                        <p className="text-white">
                          {formatNumber(marketResult.winRate, 1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">거래</p>
                        <p className="text-white">
                          {marketResult.buyCount}매수 / {marketResult.sellCount}
                          매도
                        </p>
                      </div>
                    </div>

                    {marketResult.tradeHistory &&
                      marketResult.tradeHistory.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {/* 거래 내역 테이블 */}
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-700">
                              <tr className="text-gray-400 border-b border-gray-600">
                                <th className="text-left py-2 px-2">시간</th>
                                <th className="text-center py-2 px-1">타입</th>
                                <th className="text-right py-2 px-2">가격</th>
                                <th className="text-right py-2 px-2">수량</th>
                                <th className="text-right py-2 px-2">금액</th>
                                <th className="text-right py-2 px-2">잔액</th>
                                <th className="text-right py-2 px-2">수익률</th>
                                <th className="text-center py-2 px-2">
                                  종료사유
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {marketResult.tradeHistory
                                .filter((trade) => {
                                  // 선택된 exitReason이 있으면 필터링
                                  if (!selectedExitReason) return true;
                                  return (
                                    trade.type === "SELL" &&
                                    trade.exitReason === selectedExitReason
                                  );
                                })
                                .map((trade, idx) => (
                                  <tr
                                    key={idx}
                                    className={
                                      "border-b border-gray-600/50 " +
                                      (trade.type === "BUY"
                                        ? "bg-green-500/5"
                                        : "bg-red-500/5")
                                    }
                                  >
                                    <td className="py-2 px-2 text-gray-300">
                                      {trade.timestamp
                                        .replace("T", " ")
                                        .substring(5, 16)}
                                    </td>
                                    <td className="py-2 px-1 text-center">
                                      <span
                                        className={
                                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium " +
                                          (trade.type === "BUY"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400")
                                        }
                                      >
                                        {trade.type === "BUY" ? (
                                          <TrendingUp className="w-3 h-3" />
                                        ) : (
                                          <TrendingDown className="w-3 h-3" />
                                        )}
                                        {trade.type === "BUY" ? "매수" : "매도"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 text-right text-white">
                                      ₩{formatNumber(trade.price)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-gray-300">
                                      {trade.volume.toFixed(8)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-white">
                                      ₩{formatNumber(trade.amount)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-gray-300">
                                      ₩{formatNumber(trade.balance)}
                                    </td>
                                    <td
                                      className={
                                        "py-2 px-2 text-right font-medium " +
                                        (trade.profitRate >= 0
                                          ? "text-green-400"
                                          : "text-red-400")
                                      }
                                    >
                                      {trade.profitRate >= 0 ? "+" : ""}
                                      {formatNumber(trade.profitRate, 2)}%
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      {trade.type === "SELL" &&
                                      trade.exitReason ? (
                                        <span className="text-gray-300 text-xs">
                                          {EXIT_REASON_LABELS[trade.exitReason]}
                                        </span>
                                      ) : (
                                        <span className="text-gray-600 text-xs">
                                          -
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>

                          {/* 거래 요약 */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-600">
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">총 거래</p>
                              <p className="text-white text-sm font-medium">
                                {marketResult.tradeHistory.length}회
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">
                                총 매수금액
                              </p>
                              <p className="text-green-400 text-sm font-medium">
                                ₩
                                {formatNumber(
                                  marketResult.tradeHistory
                                    .filter((t) => t.type === "BUY")
                                    .reduce((sum, t) => sum + t.amount, 0)
                                )}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">
                                총 매도금액
                              </p>
                              <p className="text-red-400 text-sm font-medium">
                                ₩
                                {formatNumber(
                                  marketResult.tradeHistory
                                    .filter((t) => t.type === "SELL")
                                    .reduce((sum, t) => sum + t.amount, 0)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {(!marketResult.tradeHistory ||
                      marketResult.tradeHistory.length === 0) && (
                      <p className="text-gray-500 text-sm text-center py-2">
                        거래 내역 없음
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

          {/* 필터링 후 결과가 없을 때 메시지 */}
          {selectedExitReason &&
            result.marketResults.filter((marketResult) =>
              marketResult.tradeHistory?.some(
                (trade) =>
                  trade.type === "SELL" &&
                  trade.exitReason === selectedExitReason
              )
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  {EXIT_REASON_LABELS[selectedExitReason]} 종료 사유를 가진
                  마켓이 없습니다.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  positive,
}: {
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white text-lg font-semibold">{value}</p>
      {subValue && (
        <p
          className={
            "text-xs mt-1 " +
            (positive === undefined
              ? "text-gray-400"
              : positive
              ? "text-green-400"
              : "text-red-400")
          }
        >
          {subValue}
        </p>
      )}
    </div>
  );
}
