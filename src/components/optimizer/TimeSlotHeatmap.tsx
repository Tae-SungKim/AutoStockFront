import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import type { TimeSlotData } from "../../api/realTradingApi";

interface TimeSlotHeatmapProps {
  data: TimeSlotData[];
  onToggleSlot?: (hour: number) => void;
  editable?: boolean;
}

export const TimeSlotHeatmap: React.FC<TimeSlotHeatmapProps> = ({
  data,
  onToggleSlot,
  editable = false,
}) => {
  const getHeatColor = (profitRate: number, isActive: boolean) => {
    if (!isActive) return "bg-gray-700 opacity-50";
    if (profitRate >= 5) return "bg-green-500";
    if (profitRate >= 3) return "bg-green-400";
    if (profitRate >= 1) return "bg-green-300/50";
    if (profitRate >= 0) return "bg-gray-500";
    if (profitRate >= -1) return "bg-red-300/50";
    if (profitRate >= -3) return "bg-red-400";
    return "bg-red-500";
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}시`;
  };

  // 시간대 데이터가 없으면 기본 24시간 생성
  const slots: TimeSlotData[] =
    data.length > 0
      ? data
      : Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          profitRate: 0,
          tradeCount: 0,
          winRate: 0,
          isActive: true,
        }));

  // 최고/최저 성과 시간대
  const activeSlots = slots.filter((s) => s.isActive);
  const bestSlot = activeSlots.reduce(
    (best, slot) => (slot.profitRate > best.profitRate ? slot : best),
    activeSlots[0] || slots[0]
  );
  const worstSlot = activeSlots.reduce(
    (worst, slot) => (slot.profitRate < worst.profitRate ? slot : worst),
    activeSlots[0] || slots[0]
  );

  // 비활성화 추천 시간대 (수익률 -2% 이하)
  const recommendDisable = slots.filter(
    (s) => s.isActive && s.profitRate < -2 && s.tradeCount >= 3
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">시간대별 성과</h2>
      </div>

      {/* 히트맵 그리드 */}
      <div className="grid grid-cols-6 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.hour}
            onClick={() => editable && onToggleSlot?.(slot.hour)}
            disabled={!editable}
            className={`relative p-3 rounded-lg transition-all ${getHeatColor(
              slot.profitRate,
              slot.isActive
            )} ${
              editable
                ? "hover:ring-2 hover:ring-white/30 cursor-pointer"
                : "cursor-default"
            } ${slot.hour === bestSlot.hour ? "ring-2 ring-green-400" : ""} ${
              slot.hour === worstSlot.hour && slot.profitRate < 0
                ? "ring-2 ring-red-400"
                : ""
            }`}
          >
            <div className="text-center">
              <p className="text-xs font-medium text-white/80">
                {formatHour(slot.hour)}
              </p>
              <p
                className={`text-lg font-bold ${
                  slot.isActive ? "text-white" : "text-gray-500"
                }`}
              >
                {slot.profitRate >= 0 ? "+" : ""}
                {slot.profitRate.toFixed(1)}%
              </p>
              <p className="text-xs text-white/60">{slot.tradeCount}건</p>
            </div>

            {!slot.isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <span className="text-xs text-gray-400">비활성</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-gray-400">+5% 이상</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-300/50" />
          <span className="text-gray-400">+1~3%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-500" />
          <span className="text-gray-400">0% 부근</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span className="text-gray-400">-1~-3%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-gray-400">-5% 이하</span>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-green-500/10 rounded-lg p-3">
          <p className="text-green-400 font-medium">최고 성과 시간대</p>
          <p className="text-white">
            {formatHour(bestSlot.hour)} (+{bestSlot.profitRate.toFixed(1)}%)
          </p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3">
          <p className="text-red-400 font-medium">최저 성과 시간대</p>
          <p className="text-white">
            {formatHour(worstSlot.hour)} ({worstSlot.profitRate.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* 비활성화 추천 */}
      {recommendDisable.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">비활성화 추천</span>
          </div>
          <p className="text-xs text-yellow-300/70 mt-1">
            수익률이 낮은 시간대:{" "}
            {recommendDisable.map((s) => formatHour(s.hour)).join(", ")}
          </p>
        </div>
      )}

      {editable && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          시간대를 클릭하여 활성화/비활성화를 전환할 수 있습니다
        </p>
      )}
    </div>
  );
};

export default TimeSlotHeatmap;
