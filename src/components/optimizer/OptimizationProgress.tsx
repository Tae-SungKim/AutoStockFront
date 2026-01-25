import React from "react";
import { Loader2, CheckCircle, XCircle, Clock, X } from "lucide-react";
import type { OptimizationTaskResult } from "../../api/realTradingApi";

interface OptimizationProgressProps {
  status: OptimizationTaskResult | null;
  onCancel?: () => void;
  cancelLoading?: boolean;
}

export const OptimizationProgress: React.FC<OptimizationProgressProps> = ({
  status,
  onCancel,
  cancelLoading = false,
}) => {
  const getStatusIcon = () => {
    switch (status?.status) {
      case "COMPLETED":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case "FAILED":
        return <XCircle className="w-6 h-6 text-red-400" />;
      case "RUNNING":
        return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />;
      case "PENDING":
        return <Clock className="w-6 h-6 text-yellow-400" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status?.status) {
      case "COMPLETED":
        return "최적화 완료";
      case "FAILED":
        return "최적화 실패";
      case "RUNNING":
        return "최적화 진행 중...";
      case "PENDING":
        return "대기 중...";
      default:
        return "상태 확인 중...";
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case "COMPLETED":
        return "bg-green-500";
      case "FAILED":
        return "bg-red-500";
      case "RUNNING":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const progress = status?.progress ?? 0;
  const estimatedTime = status?.estimatedTimeRemaining;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  if (!status) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-white">{getStatusText()}</h3>
            {status.currentStep && (
              <p className="text-sm text-gray-400">{status.currentStep}</p>
            )}
          </div>
        </div>

        {status.status === "RUNNING" && onCancel && (
          <button
            onClick={onCancel}
            disabled={cancelLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            취소
          </button>
        )}
      </div>

      {/* 프로그레스 바 */}
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm mt-2">
        <span className="text-gray-400">진행률</span>
        <span className="text-white font-medium">{progress}%</span>
      </div>

      {/* 예상 시간 */}
      {status.status === "RUNNING" && estimatedTime !== undefined && (
        <p className="text-sm text-gray-400 mt-3">
          예상 남은 시간: {formatTime(estimatedTime)}
        </p>
      )}

      {/* 에러 메시지 */}
      {status.status === "FAILED" && status.errorMessage && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{status.errorMessage}</p>
        </div>
      )}

      {/* 완료 결과 미리보기 */}
      {status.status === "COMPLETED" && status.result && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400 font-medium mb-2">
            최적화 결과
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">예상 수익률 개선</p>
              <p className="text-white font-medium">
                +{status.result.improvement.profitRate.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">예상 승률 개선</p>
              <p className="text-white font-medium">
                +{status.result.improvement.winRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizationProgress;
