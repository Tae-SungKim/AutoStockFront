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
  DailyProfitRecord,
  AuthResponse,
  AvailableStrategy,
  UserStrategy,
  StrategyResponse,
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
  ): Promise<DailyProfitRecord[]> => {
    const params: { from?: string; to?: string } = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get<DailyProfitRecord[]>("/profit/real/total", {
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
    unit: number = 1
  ): Promise<BacktestResult> => {
    const response = await backtestApi.get<BacktestResult>(
      `/run/db/${strategy}`,
      { params: { market, unit } }
    );
    return response.data;
  },

  // DB 데이터로 멀티 코인 백테스트
  multiDb: async (
    markets: string[],
    strategy: string,
    unit: number = 1
  ): Promise<SimulationResult> => {
    const response = await backtestApi.get<SimulationResult>(
      "/multi/db",
      {
        params: {
          markets: markets.join(","),
          strategy,
          unit,
        },
      }
    );
    return response.data;
  },

  // DB에 저장된 마켓 목록 조회
  getMarkets: async (): Promise<string[]> => {
    const response = await backtestApi.get<string[]>("/markets/db");
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
