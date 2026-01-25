import React, { useState, useEffect } from "react";
import { Zap, Play, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import {
  useAsyncOptimization,
  useTimeSlotPerformance,
  useParamComparison,
} from "../../hooks/useOptimizer";
import { strategyService } from "../../api/upbitApi";
import { TimeSlotHeatmap } from "./TimeSlotHeatmap";
import { OptimizationProgress } from "./OptimizationProgress";
import { ParamComparisonTable } from "./ParamComparisonTable";
import type { AvailableStrategy } from "../../types";

export const OptimizerPage: React.FC = () => {
  const [strategies, setStrategies] = useState<AvailableStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [fetchingStrategies, setFetchingStrategies] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 훅 사용
  const optimizer = useAsyncOptimization();
  const timeSlots = useTimeSlotPerformance(selectedStrategy);
  const params = useParamComparison(selectedStrategy);

  // 전략 목록 조회
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setFetchingStrategies(true);
        const data = await strategyService.getAvailableStrategies();
        setStrategies(data);
        if (data.length > 0 && !selectedStrategy) {
          setSelectedStrategy(data[0].className);
        }
      } catch (error) {
        console.error("Failed to fetch strategies:", error);
      } finally {
        setFetchingStrategies(false);
      }
    };

    fetchStrategies();
  }, []);

  // 최적화 시작
  const handleStartOptimization = async () => {
    if (!selectedStrategy) return;

    setMessage(null);
    try {
      await optimizer.startOptimization({
        strategy: selectedStrategy,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "최적화 시작에 실패했습니다.",
      });
    }
  };

  // 최적화 취소
  const handleCancelOptimization = async () => {
    try {
      await optimizer.cancelOptimization();
      setMessage({
        type: "success",
        text: "최적화가 취소되었습니다.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "취소에 실패했습니다.",
      });
    }
  };

  // 파라미터 적용
  const handleApplyParams = async () => {
    if (!optimizer.status?.result?.optimizedParams) return;

    setApplyLoading(true);
    try {
      const result = await params.applyParams(
        optimizer.status.result.optimizedParams
      );
      if (result.success) {
        setMessage({
          type: "success",
          text: "파라미터가 적용되었습니다.",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "적용에 실패했습니다.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "파라미터 적용에 실패했습니다.",
      });
    } finally {
      setApplyLoading(false);
    }
  };

  // 새로고침
  const handleRefresh = () => {
    timeSlots.refetch();
    params.refetch();
  };

  if (fetchingStrategies) {
    return (
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">전략 최적화</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* 전략 선택 및 최적화 시작 */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">
              최적화할 전략
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              disabled={optimizer.polling}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              {strategies.map((s) => (
                <option key={s.className} value={s.className}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStartOptimization}
            disabled={
              optimizer.loading || optimizer.polling || !selectedStrategy
            }
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {optimizer.loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            최적화 시작
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          전략의 파라미터를 데이터 기반으로 자동 최적화합니다. 최적화에는 수
          분이 소요될 수 있습니다.
        </p>
      </div>

      {/* 최적화 진행 상태 */}
      {(optimizer.status || optimizer.polling) && (
        <OptimizationProgress
          status={optimizer.status}
          onCancel={handleCancelOptimization}
        />
      )}

      {/* 시간대별 성과 히트맵 */}
      {timeSlots.data && (
        <TimeSlotHeatmap data={timeSlots.data.slots} editable={false} />
      )}

      {/* 파라미터 비교 테이블 */}
      {optimizer.isCompleted &&
        optimizer.status?.result?.optimizedParams &&
        params.currentParams && (
          <ParamComparisonTable
            currentParams={params.currentParams}
            optimizedParams={optimizer.status.result.optimizedParams}
            onApply={handleApplyParams}
            applyLoading={applyLoading}
          />
        )}

      {/* 초기 상태 */}
      {!optimizer.status && !optimizer.polling && !timeSlots.loading && (
        <div className="bg-gray-800 rounded-xl p-12">
          <div className="text-center text-gray-400">
            <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">전략을 선택하고 최적화를 시작하세요</p>
            <p className="text-sm mt-2 text-gray-500">
              데이터 분석을 통해 최적의 파라미터를 찾아드립���다
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizerPage;
