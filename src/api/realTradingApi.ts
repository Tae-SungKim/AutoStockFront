import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios";
import type { AuthResponse } from "../types";

// 공통 인터셉터 설정 함수
function setupAuthInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError & { config: { _retry?: boolean } }) => {
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

// Real Trading API Types
export interface EngineStatus {
  running: boolean;
  startedAt: string | null;
  activeMarkets: number;
  totalPositions: number;
  currentStrategy: string;
  uptime?: number;
}

export interface EntrySignal {
  zScore: number;
  normalizedVolume: number;
  candleDensity: number;
  timeSlot: number;
  reason: string;
  avgVolume?: number;
  currentVolume?: number;
}

export interface Position {
  id: string;
  market: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  profitRate: number;
  netProfit: number;
  entryTime: string;
  holdingMinutes: number;
  entrySignal: EntrySignal;
  targetPrice?: number;
  stopLossPrice?: number;
  strategy?: string;
}

export interface ExitResult {
  success: boolean;
  market: string;
  exitPrice: number;
  netProfit: number;
  profitRate: number;
  exitReason: string;
  message?: string;
}

export interface EngineActionResult {
  success: boolean;
  message: string;
  status?: EngineStatus;
}

// Real Trading API
const realTradingApiInstance = axios.create({
  baseURL: "/api/v1/realtrading",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(realTradingApiInstance);

export const realTradingApi = {
  // 엔진 상태 조회
  getEngineStatus: async (): Promise<EngineStatus> => {
    const response = await realTradingApiInstance.get<EngineStatus>("/engine/status");
    return response.data;
  },

  // 엔진 시작
  startEngine: async (): Promise<EngineActionResult> => {
    const response = await realTradingApiInstance.post<EngineActionResult>("/engine/start");
    return response.data;
  },

  // 엔진 정지
  stopEngine: async (): Promise<EngineActionResult> => {
    const response = await realTradingApiInstance.post<EngineActionResult>("/engine/stop");
    return response.data;
  },

  // 포지션 조회
  getPositions: async (userId: string): Promise<Position[]> => {
    const response = await realTradingApiInstance.get<Position[]>(`/positions/${userId}`);
    return response.data;
  },

  // 개별 포지션 청산
  exitPosition: async (userId: string, market: string): Promise<ExitResult> => {
    const response = await realTradingApiInstance.post<ExitResult>(
      `/positions/${userId}/${market}/exit`
    );
    return response.data;
  },

  // 전체 포지션 청산
  exitAllPositions: async (userId: string): Promise<ExitResult[]> => {
    const response = await realTradingApiInstance.post<ExitResult[]>(
      `/positions/${userId}/exit-all`
    );
    return response.data;
  },
};

// Backtest API Types (추가)
export interface BacktestParams {
  strategy: string;
  market: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  unit?: number;
}

export interface BacktestResultExtended {
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  avgProfit: number;
  avgLoss: number;
  equityCurve: Array<{ date: string; return: number; equity: number }>;
  trades: Array<{
    entryTime: string;
    exitTime: string;
    entryPrice: number;
    exitPrice: number;
    profitRate: number;
    exitReason: string;
    market?: string;
  }>;
  exitReasonStats: Record<string, number>;
}

// Time Slot Performance Types
export interface TimeSlotData {
  hour: number;
  profitRate: number;
  tradeCount: number;
  winRate: number;
  isActive: boolean;
}

export interface TimeSlotPerformance {
  slots: TimeSlotData[];
  bestHours: number[];
  worstHours: number[];
  recommendation: string;
}

// Optimizer API Types (추가)
export interface OptimizationParams {
  strategy: string;
  market?: string;
  startDate?: string;
  endDate?: string;
  populationSize?: number;
  generations?: number;
}

export interface OptimizationTaskResult {
  taskId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  currentStep?: string;
  estimatedTimeRemaining?: number;
  result?: {
    optimizedParams: Record<string, number>;
    beforeMetrics: {
      profitRate: number;
      winRate: number;
      sharpeRatio: number;
    };
    afterMetrics: {
      profitRate: number;
      winRate: number;
      sharpeRatio: number;
    };
    improvement: {
      profitRate: number;
      winRate: number;
    };
    timeSlotPerformance?: TimeSlotPerformance;
  };
  errorMessage?: string;
}

// Extended Optimizer API
const optimizerApiInstance = axios.create({
  baseURL: "/api/strategy-optimizer",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(optimizerApiInstance);

// Impulse Replay API Types
export interface ReplaySignal {
  market: string;
  timestamp: string;
  zScore: number;
  normalizedVolume: number;
  candleDensity: number;
  priceChange: number;
  isValid: boolean;
  reason?: string;
}

export interface ReplayResult {
  market: string;
  signals: ReplaySignal[];
  totalSignals: number;
  validSignals: number;
  invalidSignals: number;
  summary: {
    avgZScore: number;
    avgVolume: number;
    avgDensity: number;
    successRate: number;
  };
}

export interface ReplayAnalysis {
  market: string;
  period: string;
  analysis: {
    strongSignals: number;
    weakSignals: number;
    fakeSignals: number;
    avgHoldingTime: number;
    profitableRate: number;
    avgProfit: number;
    avgLoss: number;
    bestTimeSlots: number[];
    worstTimeSlots: number[];
  };
  recommendations: string[];
}

export interface SurgeMarket {
  market: string;
  koreanName?: string;
  currentPrice: number;
  priceChange: number;
  priceChangeRate: number;
  volume: number;
  volumeChange: number;
  zScore: number;
  normalizedVolume: number;
  candleDensity: number;
  detectedAt: string;
  signalStrength: "STRONG" | "MEDIUM" | "WEAK";
  isValid: boolean;
  reason?: string;
}

export interface LiveSurgeData {
  surgeMarkets: SurgeMarket[];
  lastUpdated: string;
  totalScanned: number;
  surgeCount: number;
}

// Impulse Replay API
const impulseReplayApiInstance = axios.create({
  baseURL: "/api/impulse/replay",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(impulseReplayApiInstance);

export const impulseReplayApi = {
  // 단일 마켓 리플레이 실행
  runReplay: async (market: string, count: number = 200): Promise<ReplayResult> => {
    const response = await impulseReplayApiInstance.get<ReplayResult>("/run", {
      params: { market, count },
    });
    return response.data;
  },

  // 단일 마켓 리플레이 분석
  getAnalysis: async (market: string, count: number = 200): Promise<ReplayAnalysis> => {
    const response = await impulseReplayApiInstance.get<ReplayAnalysis>("/analysis", {
      params: { market, count },
    });
    return response.data;
  },

  // 전체 KRW 마켓 리플레이
  runAllMarkets: async (): Promise<ReplayResult[]> => {
    const response = await impulseReplayApiInstance.get<ReplayResult[]>("/run/all");
    return response.data;
  },

  // 급등 감지 마켓 스캔
  scanSurgeMarkets: async (): Promise<SurgeMarket[]> => {
    const response = await impulseReplayApiInstance.get<SurgeMarket[]>("/scan");
    return response.data;
  },

  // 실시간 급등 마켓 조회
  getLiveSurgeMarkets: async (): Promise<LiveSurgeData> => {
    const response = await impulseReplayApiInstance.get<LiveSurgeData>("/live");
    return response.data;
  },
};

export const optimizerApi = {
  // 시간대별 성과 조회
  getTimeSlotPerformance: async (
    strategy: string,
    market?: string
  ): Promise<TimeSlotPerformance> => {
    const response = await optimizerApiInstance.get<TimeSlotPerformance>(
      "/time-slot-performance",
      {
        params: { strategy, market },
      }
    );
    return response.data;
  },

  // 비동기 최적화 시작
  startOptimization: async (
    params: OptimizationParams
  ): Promise<{ taskId: string }> => {
    const response = await optimizerApiInstance.post<{ taskId: string }>(
      "/async/optimize-and-apply",
      params
    );
    return response.data;
  },

  // 태스크 상태 조회
  getTaskStatus: async (taskId: string): Promise<OptimizationTaskResult> => {
    const response = await optimizerApiInstance.get<OptimizationTaskResult>(
      `/tasks/${taskId}`
    );
    return response.data;
  },

  // 태스크 취소
  cancelTask: async (
    taskId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await optimizerApiInstance.post<{
      success: boolean;
      message: string;
    }>(`/tasks/${taskId}/cancel`);
    return response.data;
  },

  // 현재 파라미터 조회 (전략별)
  getCurrentParams: async (
    strategyName: string
  ): Promise<Record<string, any>> => {
    const response = await optimizerApiInstance.get<Record<string, any>>(
      `/current-params/${strategyName}`
    );
    return response.data;
  },

  // 최적화된 파라미터 적용
  applyOptimizedParams: async (
    strategyName: string,
    params: Record<string, number>
  ): Promise<{ success: boolean; message: string }> => {
    const response = await optimizerApiInstance.post<{
      success: boolean;
      message: string;
    }>(`/apply-params/${strategyName}`, params);
    return response.data;
  },
};

export default realTradingApi;
