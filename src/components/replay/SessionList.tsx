import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  RefreshCw,
  AlertTriangle,
  Play,
  FileText,
} from "lucide-react";
import { replayApi, type SessionInfo } from "../../api/replayApi";
import { formatNumber, formatDateTime } from "../../utils/formatUtils";

interface SessionListProps {
  strategy: string;
  onSelectSession?: (sessionId: string) => void;
  onSimulateSession?: (sessionId: string) => void;
}

const STRATEGIES = [
  { value: "VolumeConfirmedBreakoutStrategy", label: "돌파 전략" },
  { value: "impulse", label: "임펄스 전략" },
  { value: "momentum", label: "모멘텀 전략" },
];

export const SessionList: React.FC<SessionListProps> = ({
  strategy: initialStrategy,
  onSelectSession,
  onSimulateSession,
}) => {
  const [strategy, setStrategy] = useState(initialStrategy);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await replayApi.getSessions(strategy);
      setSessions(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("세션 조회 실패"));
    } finally {
      setLoading(false);
    }
  }, [strategy]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // 세션 시간 계산
  const getSessionDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMinutes = Math.floor((endTime - startTime) / 60000);

    if (diffMinutes < 60) {
      return `${diffMinutes}분`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}시간 ${minutes}분`;
  };

  if (loading) {
    return (
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-content-secondary animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12 text-red-400">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          <span className="text-sm sm:text-base">{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content">
                실행 세션 목록
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary">
                {sessions.length}개 세션
              </p>
            </div>
          </div>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        {/* 전략 필터 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STRATEGIES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStrategy(s.value)}
              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                strategy === s.value
                  ? "bg-blue-600 text-white"
                  : "bg-surface-tertiary text-content-secondary hover:text-content"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 세션 목록 */}
      {sessions.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="bg-surface-tertiary/50 rounded-lg p-3 sm:p-4 hover:bg-surface-tertiary transition-colors"
            >
              {/* 세션 ID 및 시간 */}
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs sm:text-sm text-content truncate">
                    {session.sessionId}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-content-secondary">
                    <Clock className="w-3 h-3" />
                    <span>
                      {getSessionDuration(session.startTime, session.endTime)}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                  {formatNumber(session.logCount)}개 로그
                </span>
              </div>

              {/* 시간 정보 */}
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                <div>
                  <p className="text-content-secondary">시작</p>
                  <p className="text-content">{formatDateTime(session.startTime)}</p>
                </div>
                <div>
                  <p className="text-content-secondary">종료</p>
                  <p className="text-content">{formatDateTime(session.endTime)}</p>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectSession?.(session.sessionId)}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-secondary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>로그 보기</span>
                </button>
                <button
                  onClick={() => onSimulateSession?.(session.sessionId)}
                  className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-xs sm:text-sm"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>시뮬레이션</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 text-content-secondary">
          <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">세션이 없습니다</p>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2">
            전략이 실행되면 세션이 기록됩니다
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionList;
