import { Loader2, Clock, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { SimulationTaskStatus } from "../types";

interface SimulationProgressViewProps {
  status: SimulationTaskStatus;
  onCancel: () => void;
  isCancelling?: boolean;
}

export function SimulationProgressView({
  status,
  onCancel,
  isCancelling = false,
}: SimulationProgressViewProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const getRemainingTime = () => {
    const remaining = status.estimatedSeconds - status.elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  };

  const getStatusColor = () => {
    switch (status.status) {
      case "PENDING":
        return "bg-yellow-500";
      case "RUNNING":
        return "bg-blue-500";
      case "COMPLETED":
        return "bg-green-500";
      case "FAILED":
        return "bg-red-500";
      case "CANCELLED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case "PENDING":
      case "RUNNING":
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "CANCELLED":
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "PENDING":
        return "대기 중";
      case "RUNNING":
        return "실행 중";
      case "COMPLETED":
        return "완료";
      case "FAILED":
        return "실패";
      case "CANCELLED":
        return "취소됨";
      default:
        return "알 수 없음";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              전략 최적화 {getStatusText()}
            </h3>
            <p className="text-sm text-gray-500">Task ID: {status.taskId.substring(0, 8)}...</p>
          </div>
        </div>

        {(status.status === "PENDING" || status.status === "RUNNING") && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                취소 중...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                작업 취소
              </>
            )}
          </button>
        )}
      </div>

      {/* 진행률 바 */}
      {(status.status === "PENDING" || status.status === "RUNNING") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">진행률</span>
            <span className="text-gray-900 font-semibold">{status.progress}%</span>
          </div>

          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full ${getStatusColor()} transition-all duration-500 ease-out`}
              style={{ width: `${status.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* 현재 단계 */}
      {status.currentStep && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">현재 단계</p>
          <p className="text-gray-800">{status.currentStep}</p>
        </div>
      )}

      {/* 시간 정보 */}
      {(status.status === "PENDING" || status.status === "RUNNING") && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">경과 시간</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(status.elapsedSeconds)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">예상 남은 시간</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(getRemainingTime())}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">예상 총 시간</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(status.estimatedSeconds)}
            </p>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {status.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium mb-1">오류 발생</p>
          <p className="text-red-800">{status.errorMessage}</p>
        </div>
      )}

      {/* 안내 메시지 */}
      {(status.status === "PENDING" || status.status === "RUNNING") && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>안내:</strong> 작업이 진행 중입니다. 브라우저를 닫지 마세요.
            페이지를 새로고침해도 작업은 계속 진행됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
