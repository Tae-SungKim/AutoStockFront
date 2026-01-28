import axios, { type AxiosInstance } from "axios";

// Auth interceptor setup
function setupAuthInterceptor(instance: AxiosInstance) {
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
}

// Types
export interface StrategyReplayLog {
  id: number;
  strategyName: string;
  market: string;
  logTime: string;
  action: "BUY" | "HOLD" | "EXIT" | "ENTRY";
  reason?: string;
  price: number;
  rsi?: number;
  atr?: number;
  volumeRatio?: number;
  density?: number;
  zScore?: number;
  prevZScore?: number;
  volume?: number;
  avgVolume?: number;
  profitRate?: number;
  serverId: string;
  sessionId: string;
  createdAt: string;
}

export interface SessionInfo {
  sessionId: string;
  startTime: string;
  endTime: string;
  logCount: number;
}

export interface TradeResult {
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  profitRate: number;
}

export interface SimulationResult {
  market: string;
  strategy: string;
  error?: string;
  startTime: string;
  endTime: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  maxDrawdown: number;
  tradeResults: TradeResult[];
}

export interface LossPatternAnalysis {
  totalLosses: number;
  avgRsi: number;
  avgVolumeRatio: number;
  avgDensity: number;
  avgZScore: number;
  avgLossRate: number;
}

export interface ActionStats {
  actionCounts: Record<string, number>;
  actionAvgProfit: Record<string, number>;
  topMarkets: Array<{ market: string; count: number }>;
}

export interface MemoryLogInfo {
  sessionId: string;
  logCount: number;
  logs: StrategyReplayLog[];
}

export interface MultiSimulationRequest {
  strategy: string;
  markets: string[];
  from: string;
  to: string;
  capital: number;
}

// API instance
const replayApiInstance = axios.create({
  baseURL: "/api/replay",
  headers: {
    "Content-Type": "application/json",
  },
});
setupAuthInterceptor(replayApiInstance);

// API functions
export const replayApi = {
  // 로그 조회
  getLogsByMarket: async (market: string, limit: number = 100): Promise<StrategyReplayLog[]> => {
    const response = await replayApiInstance.get<StrategyReplayLog[]>(`/logs/market/${market}`, {
      params: { limit },
    });
    return response.data;
  },

  getLogsBySession: async (sessionId: string): Promise<StrategyReplayLog[]> => {
    const response = await replayApiInstance.get<StrategyReplayLog[]>(`/logs/session/${sessionId}`);
    return response.data;
  },

  getLogs: async (params: {
    strategy?: string;
    market?: string;
    from?: string;
    to?: string;
  }): Promise<StrategyReplayLog[]> => {
    const response = await replayApiInstance.get<StrategyReplayLog[]>("/logs", { params });
    return response.data;
  },

  getSessions: async (strategy: string): Promise<SessionInfo[]> => {
    const response = await replayApiInstance.get<SessionInfo[]>(`/sessions/${strategy}`);
    return response.data;
  },

  // 시뮬레이션
  runSimulation: async (params: {
    strategy: string;
    market: string;
    from: string;
    to: string;
    capital?: number;
  }): Promise<SimulationResult> => {
    const response = await replayApiInstance.get<SimulationResult>("/simulate", {
      params: { ...params, capital: params.capital ?? 1000000 },
    });
    return response.data;
  },

  runMultiSimulation: async (request: MultiSimulationRequest): Promise<SimulationResult[]> => {
    const response = await replayApiInstance.post<SimulationResult[]>("/simulate/multi", request);
    return response.data;
  },

  runSessionSimulation: async (sessionId: string, capital: number = 1000000): Promise<SimulationResult> => {
    const response = await replayApiInstance.get<SimulationResult>(`/simulate/session/${sessionId}`, {
      params: { capital },
    });
    return response.data;
  },

  // 분석
  getLossPatternAnalysis: async (strategy: string, days: number = 7): Promise<LossPatternAnalysis> => {
    const response = await replayApiInstance.get<LossPatternAnalysis>("/analysis/loss-pattern", {
      params: { strategy, days },
    });
    return response.data;
  },

  getStats: async (strategy: string, days: number = 7): Promise<ActionStats> => {
    const response = await replayApiInstance.get<ActionStats>("/analysis/stats", {
      params: { strategy, days },
    });
    return response.data;
  },

  // 관리
  getMemoryLogs: async (): Promise<MemoryLogInfo> => {
    const response = await replayApiInstance.get<MemoryLogInfo>("/memory/breakout");
    return response.data;
  },

  clearMemoryLogs: async (): Promise<string> => {
    const response = await replayApiInstance.delete<string>("/memory/breakout");
    return response.data;
  },

  setDbLogging: async (enabled: boolean): Promise<void> => {
    await replayApiInstance.put("/config/db-logging", null, {
      params: { enabled },
    });
  },

  cleanupLogs: async (daysToKeep: number = 30): Promise<{ deleted: number; daysToKeep: number }> => {
    const response = await replayApiInstance.delete<{ deleted: number; daysToKeep: number }>("/logs/cleanup", {
      params: { daysToKeep },
    });
    return response.data;
  },
};

export default replayApi;
