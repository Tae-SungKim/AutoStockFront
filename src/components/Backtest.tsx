import { useState, useEffect } from "react";
import {
  Play,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trophy,
  RefreshCw,
  ArrowUpDown,
  CheckSquare,
  Square,
  Layers,
  Zap,
  Crown,
} from "lucide-react";
import { backtest, strategyService } from "../api/upbitApi";
import type {
  BacktestCompareSummary,
  MultiMarketCompareResult,
  SimulationResult,
  AvailableStrategy,
} from "../types";

type TabType = "single" | "multi" | "simulate";

export function Backtest() {
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [summary, setSummary] = useState<BacktestCompareSummary | null>(null);
  const [multiResult, setMultiResult] =
    useState<MultiMarketCompareResult | null>(null);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [simSelectedMarkets, setSimSelectedMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simMode, setSimMode] = useState<"select" | "top">("top");
  const [topN, setTopN] = useState(10);
  const [candleCount, setCandleCount] = useState(200);

  // 전략 관련 상태
  const [availableStrategies, setAvailableStrategies] = useState<
    AvailableStrategy[]
  >([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return dateStr.replace("T", " ").substring(0, 16);
  };

  const fetchMarkets = async () => {
    try {
      const markets = await backtest.getMarkets();
      setAvailableMarkets(markets);
      if (markets.length > 0 && selectedMarkets.length === 0) {
        setSelectedMarkets(markets.slice(0, 5));
      }
      if (markets.length > 0 && simSelectedMarkets.length === 0) {
        setSimSelectedMarkets(markets.slice(0, 5));
      }
    } catch (err) {
      console.error("마켓 목록 조회 실패:", err);
    }
  };

  const fetchStrategies = async () => {
    try {
      const strategies = await strategyService.getAvailableStrategies();
      setAvailableStrategies(strategies);
      // 기본적으로 매수 전략만 선택
      if (selectedStrategies.length === 0) {
        const buyStrategies = strategies
          .filter((s) => s.type === "BUY")
          .map((s) => s.name);
        setSelectedStrategies(buyStrategies.slice(0, 1));
      }
    } catch (err) {
      console.error("전략 목록 조회 실패:", err);
    }
  };

  const toggleStrategy = (strategyName: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategyName)
        ? prev.filter((s) => s !== strategyName)
        : [...prev, strategyName]
    );
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await backtest.compareSummary();
      setSummary(data);
    } catch (err) {
      setError("전략 비교 데이터를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMultiMarketResult = async () => {
    if (selectedMarkets.length === 0) {
      setError("최소 1개 이상의 마켓을 선택해주세요.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await backtest.multiCompare(selectedMarkets);
      setMultiResult(data);
    } catch (err) {
      setError("멀티마켓 백테스트 결과를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: SimulationResult;
      if (simMode === "top") {
        data = await backtest.simulateTop(
          topN,
          candleCount,
          selectedStrategies.join(",")
        );
      } else {
        if (simSelectedMarkets.length === 0) {
          setError("최소 1개 이상의 마켓을 선택해주세요.");
          setLoading(false);
          return;
        }
        data = await backtest.simulateMulti(simSelectedMarkets);
      }
      setSimulationResult(data);
    } catch (err) {
      setError("시뮬레이션 결과를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    fetchSummary();
    fetchStrategies();
  }, []);

  const handleRunBacktest = async () => {
    if (activeTab === "single") {
      await fetchSummary();
    } else if (activeTab === "multi") {
      await fetchMultiMarketResult();
    } else {
      await fetchSimulation();
    }
  };

  const toggleMarket = (market: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  const toggleSimMarket = (market: string) => {
    setSimSelectedMarkets((prev) =>
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

  const selectAllSimMarkets = () => {
    setSimSelectedMarkets([...availableMarkets]);
  };

  const clearAllSimMarkets = () => {
    setSimSelectedMarkets([]);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">
            백테스트 시뮬레이션
          </h2>
        </div>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
          onClick={() => {
            setActiveTab("multi");
            if (availableMarkets.length === 0) fetchMarkets();
          }}
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
          onClick={() => {
            setActiveTab("simulate");
            if (availableMarkets.length === 0) fetchMarkets();
          }}
          className={
            "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
            (activeTab === "simulate"
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          <Zap className="w-4 h-4" />
          실전 시뮬레이션
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {activeTab === "single" && summary && (
        <SummaryView summary={summary} formatNumber={formatNumber} />
      )}

      {activeTab === "multi" && (
        <MultiMarketView
          availableMarkets={availableMarkets}
          selectedMarkets={selectedMarkets}
          multiResult={multiResult}
          loading={loading}
          onToggleMarket={toggleMarket}
          onSelectAll={selectAllMarkets}
          onClearAll={clearAllMarkets}
          formatNumber={formatNumber}
        />
      )}

      {activeTab === "simulate" && (
        <SimulationView
          availableMarkets={availableMarkets}
          selectedMarkets={simSelectedMarkets}
          simulationResult={simulationResult}
          loading={loading}
          simMode={simMode}
          topN={topN}
          candleCount={candleCount}
          onSimModeChange={setSimMode}
          onTopNChange={setTopN}
          onCandleCountChange={setCandleCount}
          onToggleMarket={toggleSimMarket}
          onSelectAll={selectAllSimMarkets}
          onClearAll={clearAllSimMarkets}
          formatNumber={formatNumber}
          formatDate={formatDate}
          availableStrategies={availableStrategies}
          selectedStrategies={selectedStrategies}
          onToggleStrategy={toggleStrategy}
        />
      )}

      {loading && !summary && !multiResult && !simulationResult && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}
    </div>
  );
}

function SimulationView({
  availableMarkets,
  selectedMarkets,
  simulationResult,
  loading,
  simMode,
  topN,
  candleCount,
  onSimModeChange,
  onTopNChange,
  onCandleCountChange,
  onToggleMarket,
  onSelectAll,
  onClearAll,
  formatNumber,
  formatDate,
  availableStrategies,
  selectedStrategies,
  onToggleStrategy,
}: {
  availableMarkets: string[];
  selectedMarkets: string[];
  simulationResult: SimulationResult | null;
  loading: boolean;
  simMode: "select" | "top";
  topN: number;
  candleCount: number;
  onSimModeChange: (mode: "select" | "top") => void;
  onTopNChange: (n: number) => void;
  onCandleCountChange: (n: number) => void;
  onToggleMarket: (market: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  formatNumber: (num: number, decimals?: number) => string;
  formatDate: (dateStr: string) => string;
  availableStrategies: AvailableStrategy[];
  selectedStrategies: string[];
  onToggleStrategy: (strategyName: string) => void;
}) {
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-white font-medium mb-3">매매 전략 선택</p>
        <p className="text-gray-400 text-xs mb-3">
          시뮬레이션에 사용할 전략을 선택하세요. 선택한 전략으로 백테스트가
          진행됩니다.
        </p>

        {availableStrategies.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            전략 목록을 불러오는 중...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableStrategies.map((strategy) => (
              <button
                key={strategy.className}
                onClick={() => onToggleStrategy(strategy.className)}
                className={
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " +
                  (selectedStrategies.includes(strategy.className)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500")
                }
                title={strategy.description || strategy.name}
              >
                {selectedStrategies.includes(strategy.className) ? (
                  <CheckSquare className="w-3 h-3" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
                {strategy.name}
              </button>
            ))}
          </div>
        )}

        {selectedStrategies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <p className="text-gray-400 text-xs">
              선택된 전략:{" "}
              <span className="text-white">
                {selectedStrategies.join(", ")}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Simulation Mode Selection */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-white font-medium mb-3">시뮬레이션 모드</p>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => onSimModeChange("top")}
            className={
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
              (simMode === "top"
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500")
            }
          >
            <Crown className="w-4 h-4" />
            상위 N개 코인
          </button>
          <button
            onClick={() => onSimModeChange("select")}
            className={
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
              (simMode === "select"
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500")
            }
          >
            <CheckSquare className="w-4 h-4" />
            마켓 직접 선택
          </button>
        </div>

        {simMode === "top" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                상위 코인 개수
              </label>
              <select
                value={topN}
                onChange={(e) => onTopNChange(Number(e.target.value))}
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value={5}>상위 5개</option>
                <option value={10}>상위 10개</option>
                <option value={15}>상위 15개</option>
                <option value={20}>상위 20개</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                캔들 개수 (분석 기간)
              </label>
              <select
                value={candleCount}
                onChange={(e) => onCandleCountChange(Number(e.target.value))}
                className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value={100}>100개 (~25시간)</option>
                <option value={200}>200개 (~50시간)</option>
                <option value={300}>300개 (~75시간)</option>
                <option value={500}>500개 (~5일)</option>
              </select>
            </div>
          </div>
        )}

        {simMode === "select" && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">
                {selectedMarkets.length}개 마켓 선택됨
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onSelectAll}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  전체 선택
                </button>
                <button
                  onClick={onClearAll}
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
                  onClick={() => onToggleMarket(market)}
                  className={
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " +
                    (selectedMarkets.includes(market)
                      ? "bg-green-600 text-white"
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
          </>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      )}

      {/* Results */}
      {simulationResult && !loading && (
        <>
          {/* Summary Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-300" />
              <p className="text-white font-semibold">
                {simulationResult.strategy}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-green-100 text-xs mb-1">분석 마켓</p>
                <p className="text-white font-semibold">
                  {simulationResult.totalMarkets}개
                </p>
              </div>
              <div>
                <p className="text-green-100 text-xs mb-1">총 초기자본</p>
                <p className="text-white font-semibold">
                  ₩{formatNumber(simulationResult.totalInitialBalance)}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-xs mb-1">총 최종자산</p>
                <p className="text-white font-semibold">
                  ₩{formatNumber(simulationResult.totalFinalAsset)}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-xs mb-1">�� 수익률</p>
                <p
                  className={
                    "font-semibold " +
                    (simulationResult.totalProfitRate >= 0
                      ? "text-yellow-300"
                      : "text-red-300")
                  }
                >
                  {simulationResult.totalProfitRate >= 0 ? "+" : ""}
                  {formatNumber(simulationResult.totalProfitRate, 2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="평균 수익률"
              value={formatNumber(simulationResult.averageProfitRate, 2) + "%"}
              positive={simulationResult.averageProfitRate >= 0}
            />
            <StatCard
              label="평균 승률"
              value={formatNumber(simulationResult.averageWinRate, 1) + "%"}
            />
            <StatCard
              label="수익 마켓"
              value={simulationResult.profitableMarkets + "개"}
              subValue={"손실 " + simulationResult.losingMarkets + "개"}
              positive={
                simulationResult.profitableMarkets >
                simulationResult.losingMarkets
              }
            />
            <StatCard
              label="최고 마켓"
              value={simulationResult.bestMarket.replace("KRW-", "")}
              subValue={
                (simulationResult.bestMarketProfitRate >= 0 ? "+" : "") +
                formatNumber(simulationResult.bestMarketProfitRate, 2) +
                "%"
              }
              positive={simulationResult.bestMarketProfitRate >= 0}
            />
          </div>

          {/* Market Results */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              마켓별 결과
            </h3>
            <div className="space-y-2">
              {simulationResult.marketResults.map((result) => (
                <div
                  key={result.market}
                  className="bg-gray-700/50 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedMarket(
                        expandedMarket === result.market ? null : result.market
                      )
                    }
                    className="w-full p-3 flex items-center justify-between hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">
                        {result.market.replace("KRW-", "")}
                      </span>
                      <span className="text-gray-400 text-sm">
                        거래 {result.totalTrades}회
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={
                          "font-medium " +
                          (result.totalProfitRate >= 0
                            ? "text-green-400"
                            : "text-red-400")
                        }
                      >
                        {result.totalProfitRate >= 0 ? "+" : ""}
                        {formatNumber(result.totalProfitRate, 2)}%
                      </span>
                      <ArrowUpDown
                        className={
                          "w-4 h-4 text-gray-400 transition-transform " +
                          (expandedMarket === result.market ? "rotate-180" : "")
                        }
                      />
                    </div>
                  </button>

                  {expandedMarket === result.market && (
                    <div className="px-3 pb-3 border-t border-gray-600">
                      <div className="grid grid-cols-4 gap-2 py-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">최종 자산</p>
                          <p className="text-white">
                            ₩{formatNumber(result.finalTotalAsset)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Buy&Hold</p>
                          <p className="text-blue-400">
                            {formatNumber(result.buyAndHoldRate, 2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">승률</p>
                          <p className="text-white">
                            {formatNumber(result.winRate, 1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">기간</p>
                          <p className="text-white text-xs">
                            {formatDate(result.startDate).split(" ")[0]}
                          </p>
                        </div>
                      </div>

                      {result.tradeHistory.length > 0 && (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {result.tradeHistory.map((trade, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-gray-600/30 rounded px-2 py-1"
                            >
                              <div className="flex items-center gap-2">
                                {trade.type === "BUY" ? (
                                  <TrendingUp className="w-3 h-3 text-green-400" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-400" />
                                )}
                                <span className="text-gray-300">
                                  {formatDate(trade.timestamp)}
                                </span>
                              </div>
                              <span
                                className={
                                  trade.profitRate >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {trade.profitRate >= 0 ? "+" : ""}
                                {formatNumber(trade.profitRate, 2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.tradeHistory.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-2">
                          거래 내역 없음
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!simulationResult && !loading && (
        <div className="text-center py-8 text-gray-400">
          설정을 선택하고 실행 버튼을 눌러주세요
        </div>
      )}
    </div>
  );
}

function MultiMarketView({
  availableMarkets,
  selectedMarkets,
  multiResult,
  loading,
  onToggleMarket,
  onSelectAll,
  onClearAll,
  formatNumber,
}: {
  availableMarkets: string[];
  selectedMarkets: string[];
  multiResult: MultiMarketCompareResult | null;
  loading: boolean;
  onToggleMarket: (market: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  formatNumber: (num: number, decimals?: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Market Selection */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium">
            마켓 선택 ({selectedMarkets.length}개 선택됨)
          </p>
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              전체 선택
            </button>
            <button
              onClick={onClearAll}
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
              onClick={() => onToggleMarket(market)}
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

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      )}

      {multiResult && !loading && (
        <>
          {/* Summary Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-purple-100 text-xs mb-1">분석 마켓</p>
                <p className="text-white font-semibold">
                  {multiResult.markets.length}개
                </p>
              </div>
              <div>
                <p className="text-purple-100 text-xs mb-1">마켓당 초기자본</p>
                <p className="text-white font-semibold">
                  ₩{formatNumber(multiResult.initialBalancePerMarket)}
                </p>
              </div>
              <div>
                <p className="text-purple-100 text-xs mb-1">최고 전략</p>
                <p className="text-yellow-300 font-semibold flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {multiResult.bestStrategy}
                </p>
              </div>
              <div>
                <p className="text-purple-100 text-xs mb-1">최고 총 수익률</p>
                <p
                  className={
                    "font-semibold " +
                    (multiResult.bestTotalProfitRate >= 0
                      ? "text-green-300"
                      : "text-red-300")
                  }
                >
                  {multiResult.bestTotalProfitRate >= 0 ? "+" : ""}
                  {formatNumber(multiResult.bestTotalProfitRate, 2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Strategy Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-3 px-2">전략</th>
                  <th className="text-right py-3 px-2">총 수익률</th>
                  <th className="text-right py-3 px-2">평균 수익률</th>
                  <th className="text-right py-3 px-2">평균 승률</th>
                  <th className="text-right py-3 px-2">수익 마켓</th>
                  <th className="text-right py-3 px-2">손실 마켓</th>
                  <th className="text-right py-3 px-2">최고 마켓</th>
                  <th className="text-right py-3 px-2">최저 마켓</th>
                </tr>
              </thead>
              <tbody>
                {multiResult.strategyResults.map((strategy) => (
                  <tr
                    key={strategy.strategy}
                    className={
                      "border-b border-gray-700/50 " +
                      (strategy.strategy === multiResult.bestStrategy
                        ? "bg-purple-500/10"
                        : "")
                    }
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {strategy.strategy === multiResult.bestStrategy && (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-white">{strategy.strategy}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span
                        className={
                          strategy.totalProfitRate >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {strategy.totalProfitRate >= 0 ? "+" : ""}
                        {formatNumber(strategy.totalProfitRate, 2)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span
                        className={
                          strategy.averageProfitRate >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {strategy.averageProfitRate >= 0 ? "+" : ""}
                        {formatNumber(strategy.averageProfitRate, 2)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 text-gray-300">
                      {formatNumber(strategy.averageWinRate, 1)}%
                    </td>
                    <td className="text-right py-3 px-2 text-green-400">
                      {strategy.profitableMarkets}
                    </td>
                    <td className="text-right py-3 px-2 text-red-400">
                      {strategy.losingMarkets}
                    </td>
                    <td className="text-right py-3 px-2 text-blue-400">
                      {strategy.bestMarket.replace("KRW-", "")}
                    </td>
                    <td className="text-right py-3 px-2 text-orange-400">
                      {strategy.worstMarket.replace("KRW-", "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!multiResult && !loading && (
        <div className="text-center py-8 text-gray-400">
          마켓을 선택하고 실행 버튼을 눌러주세요
        </div>
      )}
    </div>
  );
}

function SummaryView({
  summary,
  formatNumber,
}: {
  summary: BacktestCompareSummary;
  formatNumber: (num: number, decimals?: number) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-100 text-xs mb-1">마켓</p>
            <p className="text-white font-semibold">{summary.market}</p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">초기 자본</p>
            <p className="text-white font-semibold">
              ₩{formatNumber(summary.initialBalance)}
            </p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">최고 전략</p>
            <p className="text-yellow-300 font-semibold flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {summary.bestStrategy}
            </p>
          </div>
          <div>
            <p className="text-purple-100 text-xs mb-1">최고 수익률</p>
            <p className="text-green-300 font-semibold">
              +{formatNumber(summary.bestProfitRate, 2)}%
            </p>
          </div>
        </div>
        <p className="text-purple-200 text-xs mt-3">{summary.period}</p>
      </div>

      {/* Strategy Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-3 px-2">전략</th>
              <th className="text-right py-3 px-2">수익률</th>
              <th className="text-right py-3 px-2">거래 횟수</th>
              <th className="text-right py-3 px-2">승률</th>
              <th className="text-right py-3 px-2">최대 손실</th>
              <th className="text-right py-3 px-2">Buy&Hold</th>
            </tr>
          </thead>
          <tbody>
            {summary.strategies.map((strategy) => (
              <tr
                key={strategy.strategy}
                className={
                  "border-b border-gray-700/50 " +
                  (strategy.strategy === summary.bestStrategy
                    ? "bg-purple-500/10"
                    : "")
                }
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {strategy.strategy === summary.bestStrategy && (
                      <Trophy className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-white">{strategy.strategy}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-2">
                  <span
                    className={
                      strategy.totalProfitRate >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {strategy.totalProfitRate >= 0 ? "+" : ""}
                    {formatNumber(strategy.totalProfitRate, 2)}%
                  </span>
                </td>
                <td className="text-right py-3 px-2 text-gray-300">
                  {strategy.totalTrades}
                </td>
                <td className="text-right py-3 px-2 text-gray-300">
                  {formatNumber(strategy.winRate, 1)}%
                </td>
                <td className="text-right py-3 px-2 text-red-400">
                  {formatNumber(strategy.maxLossRate, 2)}%
                </td>
                <td className="text-right py-3 px-2 text-blue-400">
                  {formatNumber(strategy.buyAndHoldRate, 2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
