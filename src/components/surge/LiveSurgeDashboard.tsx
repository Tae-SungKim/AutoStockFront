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
      const interval = setInterval(fetchData, 5000); // 5초마다 갱신
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  const filteredMarkets = (data?.surgeMarkets ?? []).filter((market) => {
    // 검색 필터
    if (searchTerm && !market.market.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // 타입 필터
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12 text-red-400">
          <AlertTriangle className="w-6 h-6 mr-2" />
          급등 마켓 조회 실패: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">실시간 급등 감지</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-3 h-3" />
              <span>
                {data?.lastUpdated ? formatTime(data.lastUpdated) : "-"} 업데이트
              </span>
              <span>•</span>
              <span>{data?.totalScanned ?? 0}개 마켓 스캔</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            />
            자동 새로고침
          </label>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">감지된 급등</p>
          <p className="text-2xl font-bold text-white">{data?.surgeCount ?? 0}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">강력 시그널</p>
          <p className="text-2xl font-bold text-green-400">{strongCount}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">유효 시그널</p>
          <p className="text-2xl font-bold text-blue-400">{validCount}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">무효 시그널</p>
          <p className="text-2xl font-bold text-yellow-400">
            {(data?.surgeCount ?? 0) - validCount}
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              전체 ({data?.surgeCount ?? 0})
            </button>
            <button
              onClick={() => setFilter("strong")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === "strong"
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              강력 ({strongCount})
            </button>
            <button
              onClick={() => setFilter("valid")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === "valid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              유효 ({validCount})
            </button>
          </div>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="마켓 검색..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* 급등 마켓 그리드 */}
      {filteredMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMarkets.map((market) => (
            <SurgeMarketCard
              key={market.market}
              market={market}
              onSelect={onMarketSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>감지된 급등 마켓이 없습니다</p>
          <p className="text-sm mt-2">시장 상황에 따라 급등 시그널이 발생합니다</p>
        </div>
      )}
    </div>
  );
};

export default LiveSurgeDashboard;
