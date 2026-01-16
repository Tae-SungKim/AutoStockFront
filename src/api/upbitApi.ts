import axios, { type AxiosInstance } from "axios";
import type {
  Account,
  Market,
  Ticker,
  Candle,
  OrderResponse,
  TradingStatus,
  BacktestResult,
  SimulationResult,
  TradeProfitRecord,
  TradeProfitSummary,
  DailyProfitResponse,
  AuthResponse,
  AvailableStrategy,
  UserStrategy,
  StrategyResponse,
  MarketAlert,
  MarketScanResult,
  TopGainerLoser,
  DashboardData,
  DashboardResponse,
  DashboardSummary,
  RebalanceStatus,
  RebalancePlan,
  RebalanceExecuteResult,
  EqualAllocationResult,
  RebalanceTarget,
  BacktestVisualizationResult,
  StrategyCompareResult,
  CoinHeatmapResult,
  StrategyParamDefinition,
  StrategyParamDetail,
  StrategyParamUpdateResult,
  StrategyParamSummary,
  OptimizerStats,
  OptimizeResult,
  CurrentParams,
  ApplyParamsResponse,
  OptimizedParams,
  SimulationTask,
  SimulationTaskStatus,
  AsyncSimulationResult,
} from "../types";

// 공통 인터셉터 설정 함수
function setupAuthInterceptor(instance: AxiosInstance) {
  // Request interceptor: 토큰 자동 추가
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: 401 시 토큰 갱신
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const response = await axios.post<AuthResponse>("/api/auth/refresh", {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/";
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
}

const api = axios.create({
  baseURL: "/api/upbit",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(api);

export const upbitApi = {
  getAccounts: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>("/accounts");
    return response.data;
  },

  getMarkets: async (): Promise<Market[]> => {
    const response = await api.get<Market[]>("/markets");
    return response.data;
  },

  getTicker: async (markets: string): Promise<Ticker[]> => {
    const response = await api.get<Ticker[]>("/ticker", {
      params: { markets },
    });
    return response.data;
  },

  getMinuteCandles: async (
    unit: number,
    market: string,
    count: number = 100
  ): Promise<Candle[]> => {
    const response = await api.get<Candle[]>("/candles/minutes/" + unit, {
      params: { market, count },
    });
    return response.data;
  },

  getDayCandles: async (
    market: string,
    count: number = 100
  ): Promise<Candle[]> => {
    const response = await api.get<Candle[]>("/candles/days", {
      params: { market, count },
    });
    return response.data;
  },

  buyMarketOrder: async (
    market: string,
    price: number
  ): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>("/orders/buy/market", null, {
      params: { market, price },
    });
    return response.data;
  },

  sellMarketOrder: async (
    market: string,
    volume: number
  ): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>(
      "/orders/sell/market",
      null,
      {
        params: { market, volume },
      }
    );
    return response.data;
  },

  buyLimitOrder: async (
    market: string,
    volume: number,
    price: number
  ): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>("/orders/buy/limit", null, {
      params: { market, volume, price },
    });
    return response.data;
  },

  sellLimitOrder: async (
    market: string,
    volume: number,
    price: number
  ): Promise<OrderResponse> => {
    const response = await api.post<OrderResponse>("/orders/sell/limit", null, {
      params: { market, volume, price },
    });
    return response.data;
  },

  cancelOrder: async (uuid: string): Promise<OrderResponse> => {
    const response = await api.delete<OrderResponse>("/orders/" + uuid);
    return response.data;
  },

  getOrder: async (uuid: string): Promise<OrderResponse> => {
    const response = await api.get<OrderResponse>("/orders/" + uuid);
    return response.data;
  },

  executeAutoTrading: async (): Promise<{
    status: string;
    message: string;
  }> => {
    const response = await api.post<{ status: string; message: string }>(
      "/trading/execute"
    );
    return response.data;
  },

  getTradingStatus: async (): Promise<TradingStatus> => {
    const response = await api.get<TradingStatus>("/trading/status");
    return response.data;
  },
  getDailyProfit: async (
    from?: string,
    to?: string
  ): Promise<DailyProfitResponse> => {
    const params: { from?: string; to?: string } = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get<DailyProfitResponse>("/profit/real/total", {
      params,
    });
    return response.data;
  },
};

const backtestApi = axios.create({
  baseURL: "/api/backtest",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(backtestApi);

export const backtest = {
  // DB 데이터로 단일 전략 백테스트
  runDbStrategy: async (
    strategy: string,
    market: string,
    unit: number = 1,
    startDate?: string,
    endDate?: string
  ): Promise<BacktestResult> => {
    const params: any = { market, unit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await backtestApi.get<BacktestResult>(
      `/run/db/${strategy}`,
      { params }
    );
    return response.data;
  },

  // DB 데이터로 멀티 코인 백테스트
  multiDb: async (
    markets: string[],
    strategy: string,
    unit: number = 1,
    startDate?: string,
    endDate?: string
  ): Promise<SimulationResult> => {
    const params: any = {
      markets: markets.join(","),
      strategy,
      unit,
    };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await backtestApi.get<SimulationResult>("/multi/db", {
      params,
    });
    return response.data;
  },

  // DB 데이터로 멀티 코인 백테스트 (청크 단위, 진행 상황 콜백)
  multiDbWithProgress: async (
    markets: string[],
    strategy: string,
    unit: number = 1,
    chunkSize: number = 20,
    onProgress?: (
      current: number,
      total: number,
      currentMarket: string,
      completed: string[]
    ) => void,
    startDate?: string,
    endDate?: string
  ): Promise<SimulationResult> => {
    const chunks: string[][] = [];
    for (let i = 0; i < markets.length; i += chunkSize) {
      chunks.push(markets.slice(i, i + chunkSize));
    }

    let allMarketResults: BacktestResult[] = [];
    let completedMarkets: string[] = [];
    let failedMarkets: string[] = [];
    let processedCount = 0;

    for (const chunk of chunks) {
      // 현재 청크의 첫 번째 마켓을 현재 처리 중으로 표시
      if (onProgress) {
        onProgress(processedCount, markets.length, chunk[0], completedMarkets);
      }

      try {
        // 청크 단위로 백테스트 실행
        const params: any = {
          markets: chunk.join(","),
          strategy,
          unit,
        };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await backtestApi.get<SimulationResult>("/multi/db", {
          params,
        });

        // 결과 누적
        allMarketResults = [
          ...allMarketResults,
          ...response.data.marketResults,
        ];
        completedMarkets = [...completedMarkets, ...chunk];
        processedCount += chunk.length;

        // 진행 상황 업데이트
        if (onProgress) {
          onProgress(processedCount, markets.length, "", completedMarkets);
        }
      } catch (error: any) {
        // 에러 발생 시에도 계속 진행
        console.error(`[MultiBacktest] Chunk failed:`, chunk, error);
        failedMarkets = [...failedMarkets, ...chunk];
        processedCount += chunk.length;

        // 실패한 청크도 진행 상황에 반영
        if (onProgress) {
          onProgress(processedCount, markets.length, "", completedMarkets);
        }
      }
    }

    // 최종 결과 집계
    if (allMarketResults.length === 0) {
      // 모든 마켓이 실패한 경우
      throw new Error(
        `모든 마켓의 백테스트가 실패했습니다. 실패한 마켓: ${failedMarkets.join(
          ", "
        )}`
      );
    }

    // 실패한 마켓이 있는 경우 콘솔에 경고 출력
    if (failedMarkets.length > 0) {
      console.warn(
        `[MultiBacktest] ${failedMarkets.length}개 마켓 실패:`,
        failedMarkets
      );
      console.log(
        `[MultiBacktest] ${allMarketResults.length}개 마켓 성공:`,
        completedMarkets
      );
    }

    // 전체 통계 계산
    const totalInitialBalance = allMarketResults.reduce(
      (sum, r) => sum + r.initialBalance,
      0
    );
    const totalFinalAsset = allMarketResults.reduce(
      (sum, r) => sum + r.finalTotalAsset,
      0
    );
    const totalProfitRate =
      ((totalFinalAsset - totalInitialBalance) / totalInitialBalance) * 100;
    const averageProfitRate =
      allMarketResults.reduce((sum, r) => sum + r.totalProfitRate, 0) /
      allMarketResults.length;
    const averageWinRate =
      allMarketResults.reduce((sum, r) => sum + r.winRate, 0) /
      allMarketResults.length;
    const profitableMarkets = allMarketResults.filter(
      (r) => r.totalProfitRate > 0
    ).length;
    const losingMarkets = allMarketResults.filter(
      (r) => r.totalProfitRate <= 0
    ).length;

    // 최고/최저 마켓 찾기
    const sortedByProfit = [...allMarketResults].sort(
      (a, b) => b.totalProfitRate - a.totalProfitRate
    );
    const bestMarket = sortedByProfit[0];
    const worstMarket = sortedByProfit[sortedByProfit.length - 1];

    // exitReasonStats 통합 (있는 경우)
    const totalExitReasonStats: Record<string, number> = {};
    allMarketResults.forEach((result) => {
      if (result.exitReasonStats) {
        Object.entries(result.exitReasonStats).forEach(([reason, count]) => {
          totalExitReasonStats[reason] =
            (totalExitReasonStats[reason] || 0) + count;
        });
      }
    });

    const finalResult: SimulationResult = {
      strategy,
      totalMarkets: allMarketResults.length, // 실제 성공한 마켓 수
      initialBalancePerMarket: totalInitialBalance / allMarketResults.length,
      totalInitialBalance,
      totalFinalAsset,
      totalProfitRate,
      averageProfitRate,
      averageWinRate,
      profitableMarkets,
      losingMarkets,
      bestMarket: bestMarket.market,
      bestMarketProfitRate: bestMarket.totalProfitRate,
      worstMarket: worstMarket.market,
      worstMarketProfitRate: worstMarket.totalProfitRate,
      marketResults: allMarketResults,
      profitRateByMarket: Object.fromEntries(
        allMarketResults.map((r) => [r.market, r.totalProfitRate])
      ),
      totalExitReasonStats:
        Object.keys(totalExitReasonStats).length > 0
          ? totalExitReasonStats
          : undefined,
    };

    return finalResult;
  },

  // DB에 저장된 마켓 목록 조회
  getMarkets: async (): Promise<string[]> => {
    const response = await backtestApi.get<string[]>("/markets/db");
    return response.data;
  },
  getMarketAlerts: async (market: string): Promise<MarketAlert[]> => {
    const response = await backtestApi.get<MarketAlert[]>(
      `/alerts/markets${market}`
    );
    return response.data;
  },

  // 백테스트 시각화 (Single)
  getVisualization: async (
    market: string,
    strategy?: string,
    initialBalance: number = 1000000,
    candleUnit: number = 5,
    candleCount: number = 200
  ): Promise<BacktestVisualizationResult> => {
    const response = await backtestApi.get<BacktestVisualizationResult>(
      "/visualization/single",
      {
        params: { market, strategy, initialBalance, candleUnit, candleCount },
      }
    );
    return response.data;
  },

  // 백테스트 시각화 (DB)
  getVisualizationDb: async (
    market: string,
    strategy?: string,
    initialBalance: number = 1000000,
    unit?: number
  ): Promise<BacktestVisualizationResult> => {
    const response = await backtestApi.get<BacktestVisualizationResult>(
      "/visualization/single/db",
      {
        params: { market, strategy, initialBalance, unit },
      }
    );
    return response.data;
  },

  // 전략 비교
  compareStrategies: async (
    market: string,
    initialBalance: number = 1000000,
    candleUnit: number = 5,
    candleCount: number = 200
  ): Promise<StrategyCompareResult> => {
    const response = await backtestApi.get<StrategyCompareResult>(
      "/visualization/compare-strategies",
      {
        params: { market, initialBalance, candleUnit, candleCount },
      }
    );
    return response.data;
  },

  // 코인 히트맵
  getCoinHeatmap: async (
    markets: string[],
    strategy: string,
    initialBalance: number = 1000000,
    candleUnit: number = 5,
    candleCount: number = 200
  ): Promise<CoinHeatmapResult> => {
    const response = await backtestApi.post<CoinHeatmapResult>(
      "/visualization/coin-heatmap",
      {
        markets,
        strategy,
        initialBalance,
        candleUnit,
        candleCount,
      }
    );
    return response.data;
  },
};

const altersApi = axios.create({
  baseURL: "/api/alerts",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(altersApi);
export const alters = {
  getMarketAlerts: async (market: string): Promise<MarketAlert[]> => {
    const response = await altersApi.get<MarketAlert[]>(`/market/${market}`);
    return response.data;
  },
};

const tradeHistoryApi = axios.create({
  baseURL: "/api/trade-history",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(tradeHistoryApi);

export const tradeHistory = {
  getProfit: async (): Promise<TradeProfitRecord[]> => {
    const response = await tradeHistoryApi.get<TradeProfitRecord[]>("/profit");
    return response.data;
  },

  getProfitByMarket: async (market: string): Promise<TradeProfitRecord[]> => {
    const response = await tradeHistoryApi.get<TradeProfitRecord[]>(
      "/profit/market/" + market
    );
    return response.data;
  },

  getSummary: async (): Promise<TradeProfitSummary> => {
    const response = await tradeHistoryApi.get<TradeProfitSummary>(
      "/profit/summary"
    );
    return response.data;
  },

  getSummaryByMarket: async (market: string): Promise<TradeProfitSummary> => {
    const response = await tradeHistoryApi.get<TradeProfitSummary>(
      "/profit/summary/" + market
    );
    return response.data;
  },
};

// Strategy API
const strategyApi = axios.create({
  baseURL: "/api/user/strategies",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(strategyApi);

export const strategyService = {
  // 사용 가능한 전략 목록 조회
  getAvailableStrategies: async (): Promise<AvailableStrategy[]> => {
    const response = await strategyApi.get<AvailableStrategy[]>("/available");
    return response.data;
  },

  // 현재 사용자 전략 설정 조회
  getUserStrategies: async (): Promise<UserStrategy[]> => {
    const response = await strategyApi.get<UserStrategy[]>("");
    return response.data;
  },

  // 활성화된 전략만 조회
  getEnabledStrategies: async (): Promise<UserStrategy[]> => {
    const response = await strategyApi.get<UserStrategy[]>("/enabled");
    return response.data;
  },

  // 전략 활성화/비활성화 토글
  toggleStrategy: async (
    strategyName: string,
    enabled: boolean
  ): Promise<StrategyResponse> => {
    const response = await strategyApi.post<StrategyResponse>("/toggle", {
      strategyName,
      enabled,
    });
    return response.data;
  },

  // 여러 전략 한번에 설정
  setStrategies: async (strategies: string[]): Promise<StrategyResponse> => {
    const response = await strategyApi.post<StrategyResponse>("/set", {
      strategies,
    });
    return response.data;
  },

  // 모든 설정 초기화
  resetStrategies: async (): Promise<StrategyResponse> => {
    const response = await strategyApi.delete<StrategyResponse>("");
    return response.data;
  },
};

// Alert API
const alertApi = axios.create({
  baseURL: "/api/alerts",
  headers: { "Content-Type": "application/json" },
});
setupAuthInterceptor(alertApi);

export const alertService = {
  getMarketAlert: async (market: string): Promise<MarketAlert[]> => {
    const response = await alertApi.get<MarketAlert[]>(`/market/${market}`);
    return response.data;
  },
  scanMarket: async (topN: number = 50): Promise<MarketScanResult> => {
    const response = await alertApi.get<MarketScanResult>("/scan", {
      params: { topN },
    });
    return response.data;
  },
  getTopGainers: async (limit: number = 10): Promise<TopGainerLoser[]> => {
    const response = await alertApi.get<TopGainerLoser[]>("/top-gainers", {
      params: { limit },
    });
    return response.data;
  },
  getTopLosers: async (limit: number = 10): Promise<TopGainerLoser[]> => {
    const response = await alertApi.get<TopGainerLoser[]>("/top-losers", {
      params: { limit },
    });
    return response.data;
  },
};

// Dashboard API
const dashboardApi = axios.create({
  baseURL: "/api/dashboard",
  headers: { "Content-Type": "application/json" },
});
setupAuthInterceptor(dashboardApi);

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await dashboardApi.get<DashboardResponse>("");
    return response.data.data;
  },
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await dashboardApi.get<DashboardSummary>("/summary");
    return response.data;
  },
};

// Rebalance API
const rebalanceApi = axios.create({
  baseURL: "/api/rebalance",
  headers: { "Content-Type": "application/json" },
});
setupAuthInterceptor(rebalanceApi);

export const rebalanceService = {
  getStatus: async (targets: RebalanceTarget[]): Promise<RebalanceStatus> => {
    const response = await rebalanceApi.post<RebalanceStatus>("/status", {
      targets,
    });
    return response.data;
  },
  getPlan: async (targets: RebalanceTarget[]): Promise<RebalancePlan> => {
    const response = await rebalanceApi.post<RebalancePlan>("/plan", {
      targets,
    });
    return response.data;
  },
  execute: async (
    targets: RebalanceTarget[]
  ): Promise<RebalanceExecuteResult> => {
    const response = await rebalanceApi.post<RebalanceExecuteResult>(
      "/execute",
      { targets }
    );
    return response.data;
  },
  getEqualAllocation: async (
    markets: string[],
    krwReservePercent: number
  ): Promise<EqualAllocationResult[]> => {
    const response = await rebalanceApi.post<EqualAllocationResult[]>(
      "/equal-allocation",
      { markets, krwReservePercent }
    );
    return response.data;
  },
};

// Strategy Params API
const strategyParamApi = axios.create({
  baseURL: "/api/strategy-params",
  headers: { "Content-Type": "application/json" },
});
setupAuthInterceptor(strategyParamApi);

export const strategyParamService = {
  getStrategies: async (): Promise<string[]> => {
    const response = await strategyParamApi.get<string[]>("/strategies");
    return response.data;
  },
  getDefinitions: async (
    strategyName: string
  ): Promise<StrategyParamDefinition[]> => {
    const response = await strategyParamApi.get<StrategyParamDefinition[]>(
      `/definitions/${strategyName}`
    );
    return response.data;
  },
  getParams: async (strategyName: string): Promise<Record<string, any>> => {
    const response = await strategyParamApi.get<Record<string, any>>(
      `/${strategyName}`
    );
    return response.data;
  },
  getParamDetails: async (
    strategyName: string
  ): Promise<StrategyParamDetail[]> => {
    const response = await strategyParamApi.get<StrategyParamDetail[]>(
      `/${strategyName}/details`
    );
    return response.data;
  },
  updateParam: async (
    strategyName: string,
    key: string,
    value: string
  ): Promise<StrategyParamUpdateResult> => {
    const response = await strategyParamApi.put<StrategyParamUpdateResult>(
      `/${strategyName}/${key}`,
      { value }
    );
    return response.data;
  },
  updateParams: async (
    strategyName: string,
    params: Record<string, string>
  ): Promise<StrategyParamUpdateResult> => {
    const response = await strategyParamApi.put<StrategyParamUpdateResult>(
      `/${strategyName}`,
      params
    );
    return response.data;
  },
  resetParams: async (
    strategyName: string
  ): Promise<StrategyParamUpdateResult> => {
    const response = await strategyParamApi.delete<StrategyParamUpdateResult>(
      `/${strategyName}`
    );
    return response.data;
  },
  resetParam: async (
    strategyName: string,
    key: string
  ): Promise<StrategyParamUpdateResult> => {
    const response = await strategyParamApi.delete<StrategyParamUpdateResult>(
      `/${strategyName}/${key}`
    );
    return response.data;
  },
  getSummary: async (): Promise<StrategyParamSummary> => {
    const response = await strategyParamApi.get<StrategyParamSummary>(
      "/summary"
    );
    return response.data;
  },
};

// Strategy Optimizer API
const strategyOptimizerApi = axios.create({
  baseURL: "/api/strategy-optimizer",
  headers: { "Content-Type": "application/json" },
});
setupAuthInterceptor(strategyOptimizerApi);

export const strategyOptimizerService = {
  getStats: async (): Promise<OptimizerStats> => {
    const response = await strategyOptimizerApi.get<OptimizerStats>("/stats");
    return response.data;
  },
  optimize: async (): Promise<OptimizeResult> => {
    const response = await strategyOptimizerApi.post<OptimizeResult>(
      "/optimize"
    );
    return response.data;
  },
  optimizeMarket: async (market: string): Promise<OptimizeResult> => {
    const response = await strategyOptimizerApi.post<OptimizeResult>(
      `/optimize/${market}`
    );
    return response.data;
  },
  optimizeAndApply: async (): Promise<OptimizeResult> => {
    const response = await strategyOptimizerApi.post<OptimizeResult>(
      "/optimize-and-apply"
    );
    return response.data;
  },
  optimizeAndApplyMarket: async (market: string): Promise<OptimizeResult> => {
    const response = await strategyOptimizerApi.post<OptimizeResult>(
      `/optimize-and-apply/${market}`
    );
    return response.data;
  },
  getCurrentParams: async (): Promise<CurrentParams> => {
    const response = await strategyOptimizerApi.get<CurrentParams>(
      "/current-params"
    );
    return response.data;
  },
  applyParams: async (
    params: OptimizedParams
  ): Promise<ApplyParamsResponse> => {
    const response = await strategyOptimizerApi.post<ApplyParamsResponse>(
      "/apply-params",
      params
    );
    return response.data;
  },

  // 비동기 최적화 API
  startAsyncOptimization: async (): Promise<SimulationTask> => {
    const response = await strategyOptimizerApi.post<SimulationTask>(
      "/async/optimize-and-apply"
    );
    return response.data;
  },

  getTaskStatus: async (taskId: string): Promise<SimulationTaskStatus> => {
    const response = await strategyOptimizerApi.get<SimulationTaskStatus>(
      `/tasks/${taskId}`
    );
    return response.data;
  },

  getTaskResult: async (taskId: string): Promise<AsyncSimulationResult> => {
    const response = await strategyOptimizerApi.get<AsyncSimulationResult>(
      `/result/${taskId}`
    );
    return response.data;
  },

  cancelTask: async (
    taskId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await strategyOptimizerApi.post<{
      success: boolean;
      message: string;
    }>(`/tasks/${taskId}/cancel`);
    return response.data;
  },
};
