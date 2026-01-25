import React from "react";
import { ArrowRight, Check, TrendingUp, TrendingDown } from "lucide-react";

interface ParamComparisonTableProps {
  currentParams: Record<string, any>;
  optimizedParams: Record<string, number>;
  onApply?: () => void;
  applyLoading?: boolean;
}

const paramLabels: Record<string, string> = {
  bollingerPeriod: "볼린저 기간",
  bollingerMultiplier: "볼린저 배수",
  rsiPeriod: "RSI 기간",
  rsiBuyThreshold: "RSI 매수 임계",
  rsiSellThreshold: "RSI 매도 임계",
  volumeIncreaseRate: "거래량 증가율",
  stopLossRate: "손절률",
  takeProfitRate: "익절률",
  trailingStopRate: "트레일링 스탑",
  zScoreThreshold: "Z-Score 임계",
  volumeMultiplier: "거래량 배수",
  densityThreshold: "밀도 임계",
  minHoldMinutes: "최소 보유 시간",
};

export const ParamComparisonTable: React.FC<ParamComparisonTableProps> = ({
  currentParams,
  optimizedParams,
  onApply,
  applyLoading = false,
}) => {
  const allParams = new Set([
    ...Object.keys(currentParams),
    ...Object.keys(optimizedParams),
  ]);

  const paramChanges = Array.from(allParams)
    .map((key) => {
      const current = currentParams[key];
      const optimized = optimizedParams[key];
      const hasChange =
        current !== undefined &&
        optimized !== undefined &&
        current !== optimized;

      return {
        key,
        label: paramLabels[key] || key,
        current,
        optimized,
        hasChange,
        changeAmount:
          typeof current === "number" && typeof optimized === "number"
            ? optimized - current
            : null,
      };
    })
    .filter((p) => p.current !== undefined || p.optimized !== undefined);

  const changedParams = paramChanges.filter((p) => p.hasChange);

  const formatValue = (value: any) => {
    if (value === undefined || value === null) return "-";
    if (typeof value === "number") {
      return value.toFixed(4).replace(/\.?0+$/, "");
    }
    return String(value);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">파라미터 비교</h2>
        {changedParams.length > 0 && (
          <span className="text-sm text-purple-400">
            {changedParams.length}개 변경됨
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">
                파라미터
              </th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                현재값
              </th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium w-12">

              </th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                최적값
              </th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">
                변화
              </th>
            </tr>
          </thead>
          <tbody>
            {paramChanges.map(
              ({ key, label, current, optimized, hasChange, changeAmount }) => (
                <tr
                  key={key}
                  className={`border-b border-gray-700/50 ${
                    hasChange ? "bg-purple-500/5" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <span
                      className={hasChange ? "text-white" : "text-gray-400"}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400">
                    {formatValue(current)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {hasChange && (
                      <ArrowRight className="w-4 h-4 text-purple-400 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={
                        hasChange ? "text-purple-400 font-medium" : "text-gray-400"
                      }
                    >
                      {formatValue(optimized)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {hasChange && changeAmount !== null && (
                      <span
                        className={`flex items-center justify-end gap-1 ${
                          changeAmount > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {changeAmount > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {changeAmount > 0 ? "+" : ""}
                        {changeAmount.toFixed(4).replace(/\.?0+$/, "")}
                      </span>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {changedParams.length > 0 && onApply && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onApply}
            disabled={applyLoading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {applyLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            최적화 값 적용
          </button>
        </div>
      )}

      {changedParams.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          변경된 파라미터가 없습니다
        </div>
      )}
    </div>
  );
};

export default ParamComparisonTable;
