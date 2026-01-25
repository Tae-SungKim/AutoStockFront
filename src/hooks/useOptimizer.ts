import { useState, useEffect, useCallback, useRef } from "react";
import {
  optimizerApi,
  type OptimizationParams,
  type OptimizationTaskResult,
  type TimeSlotPerformance,
} from "../api/realTradingApi";

// 비동기 최적화 훅
export const useAsyncOptimization = () => {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<OptimizationTaskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 폴링 정리
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
  }, []);

  // 태스크 상태 조회
  const fetchTaskStatus = useCallback(async (id: string) => {
    try {
      const result = await optimizerApi.getTaskStatus(id);
      setStatus(result);

      // 완료 또는 실패 시 폴링 중지
      if (result.status === "COMPLETED" || result.status === "FAILED") {
        stopPolling();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch task status");
      setError(error);
      stopPolling();
      throw error;
    }
  }, [stopPolling]);

  // 최적화 시작
  const startOptimization = async (params: OptimizationParams) => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await optimizerApi.startOptimization(params);
      setTaskId(result.taskId);

      // 폴링 시작
      setPolling(true);
      pollingRef.current = setInterval(() => {
        fetchTaskStatus(result.taskId);
      }, 2000);

      // 초기 상태 조회
      await fetchTaskStatus(result.taskId);

      return result.taskId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to start optimization");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 태스크 취소
  const cancelOptimization = async () => {
    if (!taskId) return;

    try {
      await optimizerApi.cancelTask(taskId);
      stopPolling();
      setStatus((prev) =>
        prev ? { ...prev, status: "FAILED", errorMessage: "Cancelled by user" } : null
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to cancel optimization");
      setError(error);
      throw error;
    }
  };

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    taskId,
    status,
    loading,
    polling,
    error,
    startOptimization,
    cancelOptimization,
    isCompleted: status?.status === "COMPLETED",
    isFailed: status?.status === "FAILED",
    progress: status?.progress ?? 0,
  };
};

// 시간대별 성과 훅
export const useTimeSlotPerformance = (
  strategy: string,
  market?: string
) => {
  const [data, setData] = useState<TimeSlotPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!strategy) return;

    setLoading(true);
    try {
      const result = await optimizerApi.getTimeSlotPerformance(strategy, market);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch time slot performance"));
    } finally {
      setLoading(false);
    }
  }, [strategy, market]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// 파라미터 비교 훅
export const useParamComparison = (strategyName: string) => {
  const [currentParams, setCurrentParams] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchParams = useCallback(async () => {
    if (!strategyName) return;

    setLoading(true);
    try {
      const result = await optimizerApi.getCurrentParams(strategyName);
      setCurrentParams(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch current params"));
    } finally {
      setLoading(false);
    }
  }, [strategyName]);

  useEffect(() => {
    fetchParams();
  }, [fetchParams]);

  const applyParams = async (params: Record<string, number>) => {
    try {
      const result = await optimizerApi.applyOptimizedParams(strategyName, params);
      if (result.success) {
        await fetchParams(); // 적용 후 다시 조회
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to apply params");
      setError(error);
      throw error;
    }
  };

  return { currentParams, loading, error, refetch: fetchParams, applyParams };
};
