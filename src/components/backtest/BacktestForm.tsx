import React, { useState, useEffect } from "react";
import { Play, Loader2, Calendar, Settings } from "lucide-react";
import { backtest, strategyService } from "../../api/upbitApi";
import type { AvailableStrategy, BacktestResult } from "../../types";

interface BacktestFormProps {
  onResult: (result: BacktestResult) => void;
  onLoading: (loading: boolean) => void;
}

export const BacktestForm: React.FC<BacktestFormProps> = ({
  onResult,
  onLoading,
}) => {
  const [strategies, setStrategies] = useState<AvailableStrategy[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [params, setParams] = useState({
    strategy: "",
    market: "KRW-BTC",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    unit: 1,
  });

  // 전략 및 마켓 목록 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);
        const [strategiesData, marketsData] = await Promise.all([
          strategyService.getAvailableStrategies(),
          backtest.getMarkets(),
        ]);
        setStrategies(strategiesData);
        setMarkets(marketsData);

        // 기본 전략 설정
        if (strategiesData.length > 0 && !params.strategy) {
          setParams((p) => ({ ...p, strategy: strategiesData[0].className }));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.strategy || !params.market) return;

    setLoading(true);
    onLoading(true);

    try {
      const result = await backtest.runDbStrategy(
        params.strategy,
        params.market,
        params.unit,
        params.startDate,
        params.endDate
      );
      onResult(result);
    } catch (error) {
      console.error("Backtest failed:", error);
      alert("백테스트 실행에 실패했습니다.");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">백테스트 설정</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 전략 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">전략</label>
          <select
            value={params.strategy}
            onChange={(e) =>
              setParams((p) => ({ ...p, strategy: e.target.value }))
            }
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {strategies.map((s) => (
              <option key={s.className} value={s.className}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 마켓 선택 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">마켓</label>
          <select
            value={params.market}
            onChange={(e) =>
              setParams((p) => ({ ...p, market: e.target.value }))
            }
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* 시작일 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">시작일</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={params.startDate}
              onChange={(e) =>
                setParams((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 종료일 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">종료일</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={params.endDate}
              onChange={(e) =>
                setParams((p) => ({ ...p, endDate: e.target.value }))
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 캔들 단위 */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">캔들 단위</label>
          <select
            value={params.unit}
            onChange={(e) =>
              setParams((p) => ({ ...p, unit: Number(e.target.value) }))
            }
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>1분</option>
            <option value={3}>3분</option>
            <option value={5}>5분</option>
            <option value={15}>15분</option>
            <option value={30}>30분</option>
            <option value={60}>1시간</option>
            <option value={240}>4시간</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading || !params.strategy || !params.market}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          백테스트 실행
        </button>
      </div>
    </form>
  );
};

export default BacktestForm;
