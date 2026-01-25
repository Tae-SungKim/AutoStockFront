import { useState, useEffect, useCallback } from "react";
import {
  realTradingApi,
  type EngineStatus,
  type Position,
  type ExitResult,
} from "../api/realTradingApi";
import { useAuth } from "../contexts/AuthContext";

// 엔진 상태 훅
export const useEngineStatus = (pollingInterval: number = 3000) => {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await realTradingApi.getEngineStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch engine status")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollingInterval]);

  return { status, loading, error, refetch: fetchStatus };
};

// 포지션 훅
export const usePositions = (pollingInterval: number = 5000) => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!user?.username) return;

    try {
      const data = await realTradingApi.getPositions(user.username);

      // 🔥 핵심: 배열 보장
      const normalized = Array.isArray(data) ? data : [];

      setPositions(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch positions")
      );
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchPositions, pollingInterval]);

  return { positions, loading, error, refetch: fetchPositions };
};

// 엔진 시작 훅
export const useStartEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startEngine = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await realTradingApi.startEngine();
      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to start engine");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { startEngine, loading, error };
};

// 엔진 정지 훅
export const useStopEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stopEngine = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await realTradingApi.stopEngine();
      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to stop engine");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { stopEngine, loading, error };
};

// 포지션 청산 훅
export const useExitPosition = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exitPosition = async (market: string): Promise<ExitResult> => {
    if (!user?.username) {
      throw new Error("User not authenticated");
    }

    setLoading(true);
    setError(null);
    try {
      const result = await realTradingApi.exitPosition(user.username, market);
      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to exit position");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { exitPosition, loading, error };
};

// 전체 포지션 청산 훅
export const useExitAllPositions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exitAllPositions = async (): Promise<ExitResult[]> => {
    if (!user?.username) {
      throw new Error("User not authenticated");
    }

    setLoading(true);
    setError(null);
    try {
      const results = await realTradingApi.exitAllPositions(user.username);
      return results;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to exit all positions");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { exitAllPositions, loading, error };
};

// 통합 훅: 엔진 상태 + 포지션
export const useRealTrading = () => {
  const engineStatus = useEngineStatus();
  const positionsHook = usePositions();
  const startEngineHook = useStartEngine();
  const stopEngineHook = useStopEngine();
  const exitPositionHook = useExitPosition();
  const exitAllHook = useExitAllPositions();

  // 배열 보장
  const positionsList = Array.isArray(positionsHook.positions) ? positionsHook.positions : [];

  const totalProfit = positionsList.reduce(
    (sum, p) => sum + (p.netProfit || 0),
    0
  );
  const avgProfitRate = positionsList.length > 0
    ? positionsList.reduce((sum, p) => sum + (p.profitRate || 0), 0) / positionsList.length
    : 0;

  return {
    // 상태
    engineStatus: engineStatus.status,
    engineLoading: engineStatus.loading,
    engineError: engineStatus.error,
    positions: positionsList,
    positionsLoading: positionsHook.loading,
    positionsError: positionsHook.error,

    // 통계
    totalProfit,
    avgProfitRate,
    positionCount: positionsList.length,

    // 액션
    startEngine: startEngineHook.startEngine,
    startEngineLoading: startEngineHook.loading,
    stopEngine: stopEngineHook.stopEngine,
    stopEngineLoading: stopEngineHook.loading,
    exitPosition: exitPositionHook.exitPosition,
    exitPositionLoading: exitPositionHook.loading,
    exitAllPositions: exitAllHook.exitAllPositions,
    exitAllLoading: exitAllHook.loading,

    // 새로고침
    refetchStatus: engineStatus.refetch,
    refetchPositions: positionsHook.refetch,
  };
};
