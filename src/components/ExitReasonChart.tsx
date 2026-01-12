import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import type { ExitReason } from "../types";
import {
  convertExitStatsToChartData,
  getExitReasonSummary,
  EXIT_REASON_LABELS,
  isLossReason,
} from "../utils/exitReasonUtils";

interface ExitReasonChartProps {
  exitReasonStats?: Record<string, number>;
  onReasonClick?: (reason: ExitReason | null) => void;
  selectedReason?: ExitReason | null;
}

export function ExitReasonChart({
  exitReasonStats,
  onReasonClick,
  selectedReason,
}: ExitReasonChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = convertExitStatsToChartData(exitReasonStats);
  const summary = getExitReasonSummary(exitReasonStats);

  if (!exitReasonStats || chartData.length === 0) {
    return (
      <div className="bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          종료 사유 분석
        </h3>
        <div className="text-center py-8 text-gray-500">
          종료 사유 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const handlePieClick = (data: any, index: number) => {
    if (onReasonClick) {
      // 같은 항목 클릭 시 필터 해제
      if (selectedReason === data.reason) {
        onReasonClick(null);
      } else {
        onReasonClick(data.reason);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / summary.totalExits) * 100).toFixed(1);
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-1">{data.name}</p>
          <p className="text-gray-300 text-sm">
            {data.value}회 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-6">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-purple-400" />
        종료 사유 분석
        {selectedReason && (
          <span className="text-sm text-gray-400">
            (필터: {EXIT_REASON_LABELS[selectedReason]})
          </span>
        )}
      </h3>

      {/* 통계 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">총 종료</p>
          <p className="text-white text-xl font-bold">{summary.totalExits}</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <p className="text-red-400 text-xs">손절 종료</p>
          </div>
          <p className="text-red-400 text-xl font-bold">{summary.lossExits}</p>
          <p className="text-red-300 text-xs mt-1">
            {summary.lossRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <p className="text-green-400 text-xs">익절 종료</p>
          </div>
          <p className="text-green-400 text-xl font-bold">{summary.profitExits}</p>
          <p className="text-green-300 text-xs mt-1">
            {summary.profitRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 도넛 차트 */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onClick={handlePieClick}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={
                    selectedReason
                      ? selectedReason === entry.reason
                        ? 1
                        : 0.3
                      : activeIndex === index
                      ? 0.8
                      : 1
                  }
                  style={{ cursor: onReasonClick ? "pointer" : "default" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {payload?.map((entry: any, index: number) => (
                    <button
                      key={`legend-${index}`}
                      onClick={() => {
                        const data = chartData[index];
                        if (data && onReasonClick) {
                          handlePieClick(data, index);
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-opacity ${
                        onReasonClick ? "hover:opacity-80 cursor-pointer" : ""
                      } ${
                        selectedReason && selectedReason !== chartData[index].reason
                          ? "opacity-40"
                          : ""
                      }`}
                      style={{
                        backgroundColor: `${entry.color}20`,
                        border: `1px solid ${entry.color}`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span style={{ color: entry.color }}>{entry.value}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-gray-400 text-xs">가장 많은 사유</p>
          {summary.mostCommonReason && (
            <>
              <p className="text-white text-sm font-medium mt-1">
                {EXIT_REASON_LABELS[summary.mostCommonReason]}
              </p>
              <p className="text-gray-300 text-xs">
                {summary.mostCommonReasonCount}회
              </p>
            </>
          )}
        </div>
      </div>

      {/* 상세 목록 */}
      <div className="mt-6 space-y-2">
        <h4 className="text-gray-400 text-xs font-medium mb-2">상세 내역</h4>
        {chartData.map((item, index) => {
          const percentage = ((item.value / summary.totalExits) * 100).toFixed(1);
          const isLoss = isLossReason(item.reason);
          const isSelected = selectedReason === item.reason;

          return (
            <button
              key={index}
              onClick={() => onReasonClick && handlePieClick(item, index)}
              className={`w-full flex items-center justify-between p-2 rounded transition-all ${
                onReasonClick ? "hover:bg-gray-600/30 cursor-pointer" : ""
              } ${isSelected ? "bg-gray-600/50 ring-1 ring-gray-500" : ""} ${
                selectedReason && !isSelected ? "opacity-40" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {isLoss ? (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                )}
                <span className="text-white text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm">{item.value}회</span>
                <span className="text-gray-400 text-xs w-12 text-right">
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {onReasonClick && (
        <p className="text-gray-500 text-xs mt-4 text-center">
          💡 차트나 항목을 클릭하여 해당 사유로 종료된 거래만 필터링할 수
          있습니다.
        </p>
      )}
    </div>
  );
}
