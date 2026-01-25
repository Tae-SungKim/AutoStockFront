import React, { useState, useCallback } from "react";
import {
  Play,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
import { impulseReplayApi, type ReplayResult } from "../../api/realTradingApi";

type SortField = "market" | "totalSignals" | "validSignals" | "successRate";
type SortOrder = "asc" | "desc";

export const AllMarketsReplay: React.FC = () => {
  const [results, setResults] = useState<ReplayResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("successRate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterValid, setFilterValid] = useState(false);

  const runAllMarketsReplay = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    try {
      const data = await impulseReplayApi.runAllMarkets();
      // 배열 보장
      const resultList = Array.isArray(data) ? data : [];
      setResults(resultList);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("전체 마켓 리플레이 실패"));
    } finally {
      setLoading(false);
    }
  }, []);

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // 정렬 및 필터
  const filteredAndSortedResults = [...results]
    .filter((r) => {
      if (searchTerm && !r.market.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterValid && (r.validSignals ?? 0) === 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case "market":
          return sortOrder === "asc"
            ? a.market.localeCompare(b.market)
            : b.market.localeCompare(a.market);
        case "totalSignals":
          aVal = a.totalSignals ?? 0;
          bVal = b.totalSignals ?? 0;
          break;
        case "validSignals":
          aVal = a.validSignals ?? 0;
          bVal = b.validSignals ?? 0;
          break;
        case "successRate":
          aVal = a.summary?.successRate ?? 0;
          bVal = b.summary?.successRate ?? 0;
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

  // 전체 통계 계산
  const totalStats = {
    totalMarkets: results.length,
    marketsWithSignals: results.filter((r) => (r.totalSignals ?? 0) > 0).length,
    totalSignals: results.reduce((sum, r) => sum + (r.totalSignals ?? 0), 0),
    totalValidSignals: results.reduce((sum, r) => sum + (r.validSignals ?? 0), 0),
    avgSuccessRate:
      results.length > 0
        ? results.reduce((sum, r) => sum + (r.summary?.successRate ?? 0), 0) / results.length
        : 0,
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 inline" />
    ) : (
      <ChevronDown className="w-4 h-4 inline" />
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">전체 마켓 리플레이</h2>
            <p className="text-sm text-gray-400">모든 KRW 마켓 시그널 일괄 검증</p>
          </div>
        </div>

        <button
          onClick={runAllMarketsReplay}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {loading ? "실행 중..." : "전체 리플레이 실행"}
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error.message}</p>
        </div>
      )}

      {/* 로딩 진행 표시 */}
      {loading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">전체 마켓 리플레이 진행 중...</span>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 전체 통계 */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">검사 마켓</p>
            <p className="text-2xl font-bold text-white">{totalStats.totalMarkets}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">시그널 발생</p>
            <p className="text-2xl font-bold text-blue-400">{totalStats.marketsWithSignals}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">총 시그널</p>
            <p className="text-2xl font-bold text-white">{totalStats.totalSignals}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">유효 시그널</p>
            <p className="text-2xl font-bold text-green-400">{totalStats.totalValidSignals}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">평균 성공률</p>
            <p className="text-2xl font-bold text-purple-400">
              {formatNumber(totalStats.avgSuccessRate)}%
            </p>
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      {results.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={filterValid}
                onChange={(e) => setFilterValid(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              유효 시그널만
            </label>
          </div>
        </div>
      )}

      {/* 결과 테이블 */}
      {results.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/50 text-gray-400">
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => handleSort("market")}
                  >
                    마켓 <SortIcon field="market" />
                  </th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => handleSort("totalSignals")}
                  >
                    총 시그널 <SortIcon field="totalSignals" />
                  </th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => handleSort("validSignals")}
                  >
                    유효 <SortIcon field="validSignals" />
                  </th>
                  <th className="text-right py-3 px-4">무효</th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:text-white"
                    onClick={() => handleSort("successRate")}
                  >
                    성공률 <SortIcon field="successRate" />
                  </th>
                  <th className="text-right py-3 px-4">Z-Score</th>
                  <th className="text-right py-3 px-4">거래량</th>
                  <th className="text-center py-3 px-4">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedResults.map((result) => {
                  const isExpanded = expandedMarket === result.market;
                  const hasSignals = (result.totalSignals ?? 0) > 0;
                  const successRate = result.summary?.successRate ?? 0;

                  return (
                    <React.Fragment key={result.market}>
                      <tr
                        className={`border-b border-gray-700 hover:bg-gray-700/30 ${
                          !hasSignals ? "opacity-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-white">{result.market}</td>
                        <td className="py-3 px-4 text-right text-white">
                          {result.totalSignals ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right text-green-400">
                          {result.validSignals ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right text-red-400">
                          {result.invalidSignals ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              successRate >= 70
                                ? "text-green-400"
                                : successRate >= 50
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          >
                            {formatNumber(successRate)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-purple-400">
                          {formatNumber(result.summary?.avgZScore ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-400">
                          {formatNumber(result.summary?.avgVolume ?? 0)}x
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasSignals && (
                            <button
                              onClick={() =>
                                setExpandedMarket(isExpanded ? null : result.market)
                              }
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* 확장된 상세 정보 */}
                      {isExpanded && (
                        <tr className="bg-gray-700/20">
                          <td colSpan={8} className="py-4 px-4">
                            <div className="space-y-4">
                              {/* 시그널 목록 */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-400 mb-2">
                                  최근 시그널 (최대 10개)
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-500">
                                        <th className="text-left py-1">시간</th>
                                        <th className="text-right py-1">Z-Score</th>
                                        <th className="text-right py-1">거래량</th>
                                        <th className="text-right py-1">밀도</th>
                                        <th className="text-right py-1">가격변동</th>
                                        <th className="text-center py-1">상태</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(result.signals ?? []).slice(0, 10).map((signal, idx) => (
                                        <tr key={idx} className="border-t border-gray-700">
                                          <td className="py-2 text-gray-300">
                                            {new Date(signal.timestamp).toLocaleString("ko-KR")}
                                          </td>
                                          <td className="py-2 text-right text-purple-400">
                                            {formatNumber(signal.zScore)}
                                          </td>
                                          <td className="py-2 text-right text-blue-400">
                                            {formatNumber(signal.normalizedVolume)}x
                                          </td>
                                          <td className="py-2 text-right text-yellow-400">
                                            {formatNumber((signal.candleDensity ?? 0) * 100)}%
                                          </td>
                                          <td
                                            className={`py-2 text-right ${
                                              (signal.priceChange ?? 0) >= 0
                                                ? "text-red-400"
                                                : "text-blue-400"
                                            }`}
                                          >
                                            {(signal.priceChange ?? 0) >= 0 ? "+" : ""}
                                            {formatNumber(signal.priceChange ?? 0)}%
                                          </td>
                                          <td className="py-2 text-center">
                                            {signal.isValid ? (
                                              <CheckCircle className="w-4 h-4 text-green-400 inline" />
                                            ) : (
                                              <XCircle className="w-4 h-4 text-red-400 inline" />
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 결과 요약 */}
          <div className="p-4 bg-gray-700/30 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              표시: {filteredAndSortedResults.length}개 / 전체: {results.length}개 마켓
            </p>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>전체 리플레이 실행 버튼을 클릭하여 시작하세요</p>
          <p className="text-sm mt-2">모든 KRW 마켓의 시그널을 검증합니다</p>
        </div>
      )}
    </div>
  );
};

export default AllMarketsReplay;
