import { useState, useEffect, useRef, useCallback } from "react";
import { strategyOptimizerService } from "../api/upbitApi";
import type { SimulationTaskStatus, AsyncSimulationResult } from "../types";

const POLLING_INTERVAL = 2500; // 2.5초
const MAX_RETRIES = 3;

interface UseSimulationPollingResult {
  status: SimulationTaskStatus | null;
  result: AsyncSimulationResult | null;
  error: string | null;
  isPolling: boolean;
  startPolling: (taskId: string) => void;
  stopPolling: () => void;
  cancelTask: () => Promise<void>;
}

export function useSimulationPolling(): UseSimulationPollingResult {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<SimulationTaskStatus | null>(null);
  const [result, setResult] = useState<AsyncSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // Polling 시작
  const startPolling = useCallback((newTaskId: string) => {
    setTaskId(newTaskId);
    setIsPolling(true);
    setError(null);
    retryCountRef.current = 0;

    // localStorage에 taskId 저장 (새로고침 대응)
    localStorage.setItem("sim_task_id", newTaskId);
    localStorage.setItem("sim_start_time", Date.now().toString());
  }, []);

  // Polling 중지
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setIsPolling(false);

    // localStorage 클리어
    localStorage.removeItem("sim_task_id");
    localStorage.removeItem("sim_start_time");
  }, []);

  // 작업 취소
  const cancelTask = useCallback(async () => {
    if (!taskId) return;

    try {
      await strategyOptimizerService.cancelTask(taskId);
      stopPolling();
      setStatus((prev) =>
        prev ? { ...prev, status: "CANCELLED" } : null
      );
    } catch (err) {
      console.error("Failed to cancel task:", err);
      setError("작업 취소에 실패했습니다.");
    }
  }, [taskId, stopPolling]);

  // 상태 조회 함수
  const pollStatus = useCallback(async () => {
    if (!taskId || !isMountedRef.current) return;

    try {
      const statusData = await strategyOptimizerService.getTaskStatus(taskId);

      console.log("[Polling] Task status:", taskId, statusData);

      if (!isMountedRef.current) return;

      setStatus(statusData);
      retryCountRef.current = 0; // 성공 시 재시도 카운트 리셋

      // 완료 상태 처리
      if (statusData.status === "COMPLETED") {
        console.log("[Polling] Task completed, fetching result...");
        // 결과 조회
        const resultData = await strategyOptimizerService.getTaskResult(taskId);

        console.log("[Polling] Result fetched:", resultData);

        if (!isMountedRef.current) return;

        setResult(resultData);
        stopPolling();
        console.log("[Polling] Polling stopped");
      } else if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
        console.log("[Polling] Task failed or cancelled");
        stopPolling();
        setError(
          statusData.errorMessage ||
          `작업이 ${statusData.status === "FAILED" ? "실패" : "취소"}되었습니다.`
        );
      } else {
        // PENDING 또는 RUNNING 상태면 계속 폴링
        console.log("[Polling] Continuing polling, status:", statusData.status);
        pollingTimerRef.current = setTimeout(pollStatus, POLLING_INTERVAL);
      }
    } catch (err: any) {
      console.error("Polling error:", err);

      if (!isMountedRef.current) return;

      // 재시도 로직
      retryCountRef.current += 1;
      if (retryCountRef.current < MAX_RETRIES) {
        console.log(`[Polling] Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
        pollingTimerRef.current = setTimeout(pollStatus, POLLING_INTERVAL * 2); // 실패 시 더 긴 간격
      } else {
        console.log("[Polling] Max retries reached, stopping");
        stopPolling();
        setError(
          err.response?.data?.message ||
          "작업 상태 조회에 실패했습니다. 네트워크를 확인해주세요."
        );
      }
    }
  }, [taskId, stopPolling]);

  // taskId가 설정되면 폴링 시작
  useEffect(() => {
    if (taskId && isPolling) {
      pollStatus();
    }

    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, [taskId, isPolling, pollStatus]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
    };
  }, []);

  return {
    status,
    result,
    error,
    isPolling,
    startPolling,
    stopPolling,
    cancelTask,
  };
}
