import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  Database,
  Trash2,
  Power,
  HardDrive,
  Clock,
  FileText,
  CheckCircle,
} from "lucide-react";
import { replayApi, type MemoryLogInfo } from "../../api/replayApi";
import { formatNumber, formatDateTime } from "../../utils/formatUtils";

export const AdminPanel: React.FC = () => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryLogInfo | null>(null);
  const [dbLogging, setDbLogging] = useState(true);
  const [daysToKeep, setDaysToKeep] = useState(30);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMemoryInfo = useCallback(async () => {
    setLoading(true);
    try {
      const result = await replayApi.getMemoryLogs();
      setMemoryInfo(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("메모리 로그 조회 실패"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemoryInfo();
  }, [fetchMemoryInfo]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClearMemory = async () => {
    if (!confirm("메모리 로그를 모두 삭제하시겠습니까?")) return;

    setActionLoading("clear-memory");
    try {
      await replayApi.clearMemoryLogs();
      await fetchMemoryInfo();
      showSuccess("메모리 로그가 삭제되었습니다");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("메모리 로그 삭제 실패"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDbLogging = async () => {
    setActionLoading("toggle-db");
    try {
      const newValue = !dbLogging;
      await replayApi.setDbLogging(newValue);
      setDbLogging(newValue);
      showSuccess(`DB 로깅이 ${newValue ? "활성화" : "비활성화"}되었습니다`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("DB 로깅 설정 실패"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanup = async () => {
    if (!confirm(`${daysToKeep}일 이전의 로그를 삭제하시겠습니까?`)) return;

    setActionLoading("cleanup");
    try {
      const result = await replayApi.cleanupLogs(daysToKeep);
      showSuccess(`${formatNumber(result.deleted)}개의 로그가 삭제되었습니다`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("로그 정리 실패"));
    } finally {
      setActionLoading(null);
    }
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 성공 메시지 */}
      {successMessage && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content">
                시스템 관리
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary">
                로그 및 데이터 관리
              </p>
            </div>
          </div>
          <button
            onClick={fetchMemoryInfo}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>

      {/* 메모리 로그 현황 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-content">
              메모리 로그 현황
            </h3>
          </div>
          <button
            onClick={handleClearMemory}
            disabled={actionLoading === "clear-memory"}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 text-xs sm:text-sm"
          >
            {actionLoading === "clear-memory" ? (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span>메모리 비우기</span>
          </button>
        </div>

        {memoryInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-surface-tertiary/50 rounded-lg p-3">
                <p className="text-xs text-content-secondary mb-1">세션 ID</p>
                <p className="font-mono text-xs sm:text-sm text-content truncate">
                  {memoryInfo.sessionId || "-"}
                </p>
              </div>
              <div className="bg-surface-tertiary/50 rounded-lg p-3">
                <p className="text-xs text-content-secondary mb-1">로그 수</p>
                <p className="text-lg sm:text-xl font-bold text-content">
                  {formatNumber(memoryInfo.logCount)}
                </p>
              </div>
            </div>

            {/* 최근 로그 미리보기 */}
            {memoryInfo.logs && memoryInfo.logs.length > 0 && (
              <div>
                <p className="text-sm text-content-secondary mb-2">최근 로그</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {memoryInfo.logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 bg-surface-tertiary/50 rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            log.action === "ENTRY" || log.action === "BUY"
                              ? "bg-green-500/20 text-green-400"
                              : log.action === "EXIT"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-content">{log.market}</span>
                      </div>
                      <span className="text-content-secondary">
                        {formatDateTime(log.logTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-content-secondary">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">메모리 로그가 없습니다</p>
          </div>
        )}
      </div>

      {/* DB 로깅 설정 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-content">
                  DB 로깅
                </h3>
                <p className="text-xs text-content-secondary">
                  로그를 데이터베이스에 저장
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleDbLogging}
            disabled={actionLoading === "toggle-db"}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              dbLogging
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-surface-tertiary text-content-secondary hover:bg-surface-hover"
            }`}
          >
            {actionLoading === "toggle-db" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span className="text-sm">{dbLogging ? "활성" : "비활성"}</span>
          </button>
        </div>
      </div>

      {/* 로그 정리 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h3 className="text-base sm:text-lg font-bold text-content">
            오래된 로그 정리
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs text-content-secondary mb-1">
              보관 기간 (일)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={daysToKeep}
                onChange={(e) => setDaysToKeep(Number(e.target.value))}
                min={1}
                max={365}
                className="flex-1 px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-red-500"
              />
              <span className="flex items-center text-content-secondary text-sm">
                일 이전 삭제
              </span>
            </div>
          </div>
          <button
            onClick={handleCleanup}
            disabled={actionLoading === "cleanup"}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm"
          >
            {actionLoading === "cleanup" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>로그 정리</span>
          </button>
        </div>

        <p className="mt-3 text-xs text-content-secondary">
          <Clock className="w-3 h-3 inline mr-1" />
          {daysToKeep}일 이전의 모든 로그가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
