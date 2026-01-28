import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Zap,
  AlertTriangle,
  Activity,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { impulseReplayApi, type LiveSurgeData } from "../../api/realTradingApi";
import { SurgeMarketCard } from "./SurgeMarketCard";
import { formatTime } from "../../utils/formatUtils";

interface LiveSurgeDashboardProps {
  onMarketSelect?: (market: string) => void;
}

type FilterType = "all" | "strong" | "valid";

export const LiveSurgeDashboard: React.FC<LiveSurgeDashboardProps> = ({
  onMarketSelect,
}) => {
  const [data, setData] = useState<LiveSurgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await impulseReplayApi.getLiveSurgeMarkets();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch surge markets"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  const filteredMarkets = (data?.surgeMarkets ?? []).filter((market) => {
    if (searchTerm && !market.market.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    switch (filter) {
      case "strong":
        return market.signalStrength === "STRONG";
      case "valid":
        return market.isValid;
      default:
        return true;
    }
  });

  const surgeMarkets = data?.surgeMarkets ?? [];
  const strongCount = surgeMarkets.filter((m) => m.signalStrength === "STRONG").length;
  const validCount = surgeMarkets.filter((m) => m.isValid).length;

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
          <span className="text-sm sm:text-base">급등 마켓 조회 실패: {error.message}</span>
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
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-content">실시간 급등 감지</h2>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-content-secondary">
                <Clock className="w-3 h-3" />
                <span>
                  {data?.lastUpdated ? formatTime(data.lastUpdated) : "-"}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{data?.totalScanned ?? 0}개 마켓 스캔</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="hidden sm:flex items-center gap-2 text-sm text-content-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-tertiary border-line"
              />
              자동
            </label>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* 통계 요약 - Mobile: 2x2 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-surface-tertiary/50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-content-secondary">감지됨</p>
          <p className="text-xl sm:text-2xl font-bold text-content">{data?.surgeCount ?? 0}</p>
        </div>
        <div className="bg-surface-tertiary/50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-content-secondary">강력</p>
          <p className="text-xl sm:text-2xl font-bold text-green-400">{strongCount}</p>
        </div>
        <div className="bg-surface-tertiary/50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-content-secondary">유효</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-400">{validCount}</p>
        </div>
        <div className="bg-surface-tertiary/50 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-content-secondary">무효</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-400">
            {(data?.surgeCount ?? 0) - validCount}
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Filter className="w-4 h-4 text-content-secondary flex-shrink-0" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-surface-tertiary text-content-secondary hover:text-content"
              }`}
            >
              전체 ({data?.surgeCount ?? 0})
            </button>
            <button
              onClick={() => setFilter("strong")}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                filter === "strong"
                  ? "bg-green-600 text-white"
                  : "bg-surface-tertiary text-content-secondary hover:text-content"
              }`}
            >
              강력 ({strongCount})
            </button>
            <button
              onClick={() => setFilter("valid")}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap ${
                filter === "valid"
                  ? "bg-blue-600 text-white"
                  : "bg-surface-tertiary text-content-secondary hover:text-content"
              }`}
            >
              유효 ({validCount})
            </button>
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

      {/* 급등 마켓 그리드 */}
      {filteredMarkets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredMarkets.map((market) => (
            <SurgeMarketCard
              key={market.market}
              market={market}
              onSelect={onMarketSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 text-content-secondary">
          <Activity className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">감지된 급등 마켓이 없습니다</p>
          <p className="text-xs sm:text-sm mt-1 sm:mt-2">시장 상황에 따라 급등 시그널이 발생합니다</p>
        </div>
      )}
    </div>
  );
};

export default LiveSurgeDashboard;
