import React from "react";
import { Power, Loader2, Activity, Clock } from "lucide-react";
import type { EngineStatus } from "../../api/realTradingApi";

interface EngineControlPanelProps {
  status: EngineStatus | null;
  loading: boolean;
  onStart: () => Promise<unknown>;
  onStop: () => Promise<unknown>;
  startLoading: boolean;
  stopLoading: boolean;
}

export const EngineControlPanel: React.FC<EngineControlPanelProps> = ({
  status,
  loading,
  onStart,
  onStop,
  startLoading,
  stopLoading,
}) => {
  const isRunning = status?.running ?? false;
  const isActioning = startLoading || stopLoading;

  const handleToggle = async () => {
    if (isRunning) {
      if (confirm("엔진을 정지하시겠습니까? 신규 진입이 중단됩니다.")) {
        await onStop();
      }
    } else {
      await onStart();
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
        <div className="h-20 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isRunning ? "bg-green-500/20" : "bg-gray-700"
            }`}
          >
            {isActioning ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <Activity
                className={`w-8 h-8 ${
                  isRunning ? "text-green-400" : "text-gray-500"
                }`}
              />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">트레이딩 엔진</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium ${
                  isRunning
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? "bg-green-400 animate-pulse" : "bg-gray-500"
                  }`}
                />
                {isRunning ? "실행 중" : "정지됨"}
              </span>
              {status?.currentStrategy && (
                <span className="text-sm text-blue-400">
                  {status.currentStrategy}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isRunning && (
            <>
              <div className="text-right">
                <p className="text-sm text-gray-400">활성 마켓</p>
                <p className="text-lg font-bold text-white">
                  {status?.activeMarkets ?? 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">포지션</p>
                <p className="text-lg font-bold text-white">
                  {status?.totalPositions ?? 0}
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleToggle}
            disabled={isActioning}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-green-500 text-white hover:bg-green-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isActioning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Power className="w-5 h-5" />
            )}
            {isRunning ? "정지" : "시작"}
          </button>
        </div>
      </div>

      {status?.startedAt && isRunning && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>시작: {new Date(status.startedAt).toLocaleString("ko-KR")}</span>
          </div>
          {status.uptime && (
            <span>가동 시간: {formatUptime(status.uptime)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default EngineControlPanel;
