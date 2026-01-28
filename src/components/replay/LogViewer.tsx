import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Clock,
} from "lucide-react";
import { replayApi, type StrategyReplayLog } from "../../api/replayApi";
import { formatNumber, formatWonCompact, formatPercent, formatDateTime } from "../../utils/formatUtils";

interface LogViewerProps {
  market?: string;
  sessionId?: string;
  strategy?: string;
  from?: string;
  to?: string;
}

type ActionFilter = "all" | "BUY" | "ENTRY" | "EXIT" | "HOLD";

export const LogViewer: React.FC<LogViewerProps> = ({
  market,
  sessionId,
  strategy = "VolumeConfirmedBreakoutStrategy",
  from,
  to,
}) => {
  const [logs, setLogs] = useState<StrategyReplayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let result: StrategyReplayLog[];

      if (sessionId) {
        result = await replayApi.getLogsBySession(sessionId);
      } else if (market) {
        result = await replayApi.getLogsByMarket(market, 200);
      } else {
        result = await replayApi.getLogs({ strategy, market, from, to });
      }

      setLogs(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("로그 조회 실패"));
    } finally {
      setLoading(false);
    }
  }, [market, sessionId, strategy, from, to]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 필터링된 로그
  const filteredLogs = logs.filter((log) => {
    if (searchTerm && !log.market.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (actionFilter !== "all" && log.action !== actionFilter) {
      return false;
    }
    return true;
  });

  // 액션별 색상
  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
      case "ENTRY":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "EXIT":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "HOLD":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-content-muted border-gray-500/30";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "BUY":
        return "매수";
      case "ENTRY":
        return "진입";
      case "EXIT":
        return "청산";
      case "HOLD":
        return "홀드";
      default:
        return action;
    }
  };

  // 액션별 카운트
  const actionCounts = logs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content">
                로그 뷰어
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary">
                {market && `마켓: ${market} • `}
                {sessionId && `세션: ${sessionId.slice(0, 8)}... • `}
                {filteredLogs.length}개 로그
              </p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter className="w-4 h-4 text-content-secondary flex-shrink-0" />
            <div className="flex gap-1">
              <button
                onClick={() => setActionFilter("all")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                  actionFilter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-surface-tertiary text-content-secondary hover:text-content"
                }`}
              >
                전체 ({logs.length})
              </button>
              {(["ENTRY", "BUY", "EXIT", "HOLD"] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => setActionFilter(action)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                    actionFilter === action
                      ? action === "EXIT"
                        ? "bg-red-600 text-white"
                        : action === "HOLD"
                        ? "bg-yellow-600 text-white"
                        : "bg-green-600 text-white"
                      : "bg-surface-tertiary text-content-secondary hover:text-content"
                  }`}
                >
                  {getActionLabel(action)} ({actionCounts[action] || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="마켓 검색..."
              className="w-full pl-9 sm:pl-10 pr-4 py-1.5 sm:py-2 bg-surface-tertiary border border-line rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 로그 목록 */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-tertiary/50 rounded-lg overflow-hidden"
            >
              {/* 로그 헤더 */}
              <div
                className="p-3 sm:p-4 cursor-pointer hover:bg-surface-tertiary transition-colors"
                onClick={() =>
                  setExpandedLog(expandedLog === log.id ? null : log.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded border ${getActionColor(
                        log.action
                      )}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                    <div>
                      <p className="font-bold text-content text-sm sm:text-base">
                        {log.market}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-content-secondary">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(log.logTime)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-content">
                      {formatWonCompact(log.price)}
                    </p>
                    {log.profitRate !== undefined && log.profitRate !== null && (
                      <p
                        className={`text-xs sm:text-sm flex items-center justify-end gap-1 ${
                          log.profitRate >= 0 ? "text-red-400" : "text-blue-400"
                        }`}
                      >
                        {log.profitRate >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {formatPercent(log.profitRate, 2, true)}
                      </p>
                    )}
                  </div>
                </div>

                {/* 간략 지표 */}
                <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-4 text-xs">
                  {log.zScore !== undefined && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-400" />
                      <span className="text-content-secondary">Z:</span>
                      <span className="text-content">
                        {formatNumber(log.zScore, { decimals: 2 })}
                      </span>
                    </div>
                  )}
                  {log.volumeRatio !== undefined && (
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-blue-400" />
                      <span className="text-content-secondary">Vol:</span>
                      <span className="text-content">
                        {formatNumber(log.volumeRatio, { decimals: 1 })}x
                      </span>
                    </div>
                  )}
                  {log.rsi !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-content-secondary">RSI:</span>
                      <span className="text-content">
                        {formatNumber(log.rsi, { decimals: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 확장된 상세 정보 */}
              {expandedLog === log.id && (
                <div className="p-3 sm:p-4 bg-surface-secondary/50 border-t border-line">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                    {log.rsi !== undefined && (
                      <div>
                        <p className="text-content-secondary">RSI</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.rsi, { decimals: 2 })}
                        </p>
                      </div>
                    )}
                    {log.atr !== undefined && (
                      <div>
                        <p className="text-content-secondary">ATR</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.atr, { decimals: 4 })}
                        </p>
                      </div>
                    )}
                    {log.zScore !== undefined && (
                      <div>
                        <p className="text-content-secondary">Z-Score</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.zScore, { decimals: 3 })}
                        </p>
                      </div>
                    )}
                    {log.prevZScore !== undefined && (
                      <div>
                        <p className="text-content-secondary">이전 Z-Score</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.prevZScore, { decimals: 3 })}
                        </p>
                      </div>
                    )}
                    {log.volumeRatio !== undefined && (
                      <div>
                        <p className="text-content-secondary">거래량 비율</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.volumeRatio, { decimals: 2 })}x
                        </p>
                      </div>
                    )}
                    {log.density !== undefined && (
                      <div>
                        <p className="text-content-secondary">캔들 밀도</p>
                        <p className="text-content font-medium">
                          {formatPercent(log.density * 100, 1)}
                        </p>
                      </div>
                    )}
                    {log.volume !== undefined && (
                      <div>
                        <p className="text-content-secondary">거래량</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.volume, { decimals: 0 })}
                        </p>
                      </div>
                    )}
                    {log.avgVolume !== undefined && (
                      <div>
                        <p className="text-content-secondary">평균 거래량</p>
                        <p className="text-content font-medium">
                          {formatNumber(log.avgVolume, { decimals: 0 })}
                        </p>
                      </div>
                    )}
                  </div>

                  {log.reason && (
                    <div className="mt-3 pt-3 border-t border-line">
                      <p className="text-content-secondary text-xs sm:text-sm">
                        판단 사유
                      </p>
                      <p className="text-content text-sm mt-1">{log.reason}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-line">
                    <p className="text-xs text-content-muted">
                      전략: {log.strategyName} • 서버: {log.serverId} • 세션:{" "}
                      {log.sessionId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 text-content-secondary">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">로그가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
