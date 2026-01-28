import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Target,
  Percent,
  DollarSign,
} from "lucide-react";
import { replayApi, type ActionStats } from "../../api/replayApi";
import { formatNumber, formatPercent } from "../../utils/formatUtils";

interface ReplayDashboardProps {
  onNavigate?: (tab: string, params?: Record<string, string>) => void;
}

const STRATEGIES = [
  { value: "VolumeConfirmedBreakoutStrategy", label: "돌파 전략" },
  { value: "impulse", label: "임펄스 전략" },
  { value: "momentum", label: "모멘텀 전략" },
];

export const ReplayDashboard: React.FC<ReplayDashboardProps> = ({
  onNavigate,
}) => {
  const [strategy, setStrategy] = useState("VolumeConfirmedBreakoutStrategy");
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<ActionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const result = await replayApi.getStats(strategy, days);
      setStats(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("통계 조회 실패"));
    } finally {
      setLoading(false);
    }
  }, [strategy, days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 액션별 색상
  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
      case "ENTRY":
        return "bg-green-500";
      case "EXIT":
        return "bg-red-500";
      case "HOLD":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
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

  // 총 액션 수 계산
  const totalActions = stats
    ? Object.values(stats.actionCounts).reduce((sum, count) => sum + count, 0)
    : 0;

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
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 및 필터 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-content">
                  리플레이 대시보드
                </h2>
                <p className="text-xs sm:text-sm text-content-secondary">
                  전략 실행 로그 분석
                </p>
              </div>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>

          {/* 필터 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs text-content-secondary mb-1">
                전략
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 bg-surface-tertiary border border-line rounded-lg text-content text-sm focus:outline-none focus:border-purple-500"
              >
                {STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-content-secondary mb-1">
                기간
              </label>
              <div className="flex gap-1">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                      days === d
                        ? "bg-purple-600 text-white"
                        : "bg-surface-tertiary text-content-secondary hover:text-content"
                    }`}
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-surface-secondary rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm text-content-secondary">
              총 액션
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-content">
            {formatNumber(totalActions)}
          </p>
        </div>

        <div className="bg-surface-secondary rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-green-400" />
            <span className="text-xs sm:text-sm text-content-secondary">
              진입 횟수
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-400">
            {formatNumber(
              (stats?.actionCounts?.ENTRY ?? 0) + (stats?.actionCounts?.BUY ?? 0)
            )}
          </p>
        </div>

        <div className="bg-surface-secondary rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-red-400" />
            <span className="text-xs sm:text-sm text-content-secondary">
              청산 횟수
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-400">
            {formatNumber(stats?.actionCounts?.EXIT ?? 0)}
          </p>
        </div>

        <div className="bg-surface-secondary rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-yellow-400" />
            <span className="text-xs sm:text-sm text-content-secondary">
              홀드 횟수
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-400">
            {formatNumber(stats?.actionCounts?.HOLD ?? 0)}
          </p>
        </div>
      </div>

      {/* 액션 분포 및 TOP 마켓 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 액션 분포 */}
        <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-content mb-4">
            액션 분포
          </h3>
          {stats?.actionCounts && Object.keys(stats.actionCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.actionCounts).map(([action, count]) => {
                const percentage = totalActions > 0 ? (count / totalActions) * 100 : 0;
                const avgProfit = stats.actionAvgProfit?.[action] ?? 0;
                return (
                  <div key={action}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-content">{getActionLabel(action)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-content-secondary">
                          {count}회 ({formatPercent(percentage, 1)})
                        </span>
                        {avgProfit !== 0 && (
                          <span
                            className={`flex items-center gap-1 ${
                              avgProfit > 0 ? "text-red-400" : "text-blue-400"
                            }`}
                          >
                            {avgProfit > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {formatPercent(avgProfit, 2, true)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getActionColor(action)} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-content-secondary">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">데이터가 없습니다</p>
            </div>
          )}
        </div>

        {/* TOP 마켓 */}
        <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-content mb-4">
            TOP 10 마켓
          </h3>
          {stats?.topMarkets && stats.topMarkets.length > 0 ? (
            <div className="space-y-2">
              {stats.topMarkets.slice(0, 10).map((item, index) => (
                <div
                  key={item.market}
                  className="flex items-center justify-between p-2 bg-surface-tertiary/50 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"
                  onClick={() =>
                    onNavigate?.("logs", { market: item.market, strategy })
                  }
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-surface-secondary text-content-secondary"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-content font-medium text-sm sm:text-base">
                      {item.market}
                    </span>
                  </div>
                  <span className="text-content-secondary text-xs sm:text-sm">
                    {item.count}회
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-content-secondary">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="bg-surface-secondary rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-content mb-4">
          빠른 액션
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate?.("sessions", { strategy })}
            className="p-3 sm:p-4 bg-surface-tertiary rounded-lg hover:bg-surface-hover transition-colors text-left"
          >
            <Calendar className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-sm font-medium text-content">세션 목록</p>
            <p className="text-xs text-content-secondary">실행 세션 조회</p>
          </button>
          <button
            onClick={() => onNavigate?.("simulation", { strategy })}
            className="p-3 sm:p-4 bg-surface-tertiary rounded-lg hover:bg-surface-hover transition-colors text-left"
          >
            <Activity className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm font-medium text-content">시뮬레이션</p>
            <p className="text-xs text-content-secondary">수익 시뮬레이션</p>
          </button>
          <button
            onClick={() => onNavigate?.("analysis", { strategy, days: String(days) })}
            className="p-3 sm:p-4 bg-surface-tertiary rounded-lg hover:bg-surface-hover transition-colors text-left"
          >
            <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-sm font-medium text-content">손실 분석</p>
            <p className="text-xs text-content-secondary">패턴 분석</p>
          </button>
          <button
            onClick={() => onNavigate?.("admin")}
            className="p-3 sm:p-4 bg-surface-tertiary rounded-lg hover:bg-surface-hover transition-colors text-left"
          >
            <BarChart3 className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-sm font-medium text-content">시스템 관리</p>
            <p className="text-xs text-content-secondary">로그 관리</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplayDashboard;
