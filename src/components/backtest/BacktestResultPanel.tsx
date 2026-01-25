import React from "react";
import {
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import type { BacktestResult } from "../../types";

interface BacktestResultPanelProps {
  result: BacktestResult;
}

const exitReasonLabels: Record<string, string> = {
  STOP_LOSS_FIXED: "고정 손절",
  STOP_LOSS_ATR: "ATR 손절",
  TRAILING_STOP: "트레일링 스탑",
  TAKE_PROFIT: "익절",
  SIGNAL_INVALID: "시그널 무효",
  FAKE_REBOUND: "가짜 반등",
  VOLUME_DROP: "거래량 감소",
  OVERHEATED: "과열",
  TIMEOUT: "타임아웃",
};

const exitReasonColors: Record<string, string> = {
  TAKE_PROFIT: "bg-green-500",
  TRAILING_STOP: "bg-blue-500",
  STOP_LOSS_FIXED: "bg-red-500",
  STOP_LOSS_ATR: "bg-red-400",
  SIGNAL_INVALID: "bg-purple-500",
  FAKE_REBOUND: "bg-yellow-500",
  VOLUME_DROP: "bg-orange-500",
  OVERHEATED: "bg-pink-500",
  TIMEOUT: "bg-gray-500",
};

export const BacktestResultPanel: React.FC<BacktestResultPanelProps> = ({
  result,
}) => {
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const isProfit = result.totalProfitRate >= 0;

  // 수익 곡선 데이터 생성
  const equityCurve = result.tradeHistory.map((trade, index) => ({
    index,
    date: trade.timestamp.split("T")[0],
    return: trade.profitRate,
    balance: trade.balance,
    totalAsset: trade.totalAsset,
  }));

  // 청산 사유 통계
  const exitReasonData = Object.entries(result.exitReasonStats || {}).map(
    ([reason, count]) => ({
      reason,
      count: count as number,
      percentage: ((count as number) / result.sellCount) * 100,
      label: exitReasonLabels[reason] || reason,
      color: exitReasonColors[reason] || "bg-gray-500",
    })
  );

  // FAKE 관련 비율 계산
  const fakeCount =
    (result.exitReasonStats?.FAKE_REBOUND || 0) +
    (result.exitReasonStats?.SIGNAL_INVALID || 0);
  const fakeRate = result.sellCount > 0 ? (fakeCount / result.sellCount) * 100 : 0;

  // 최대 낙폭 계산 (간단 버전)
  const maxDrawdown = result.maxLossRate;

  // Sharpe Ratio 추정 (단순화)
  const avgReturn =
    result.tradeHistory.length > 0
      ? result.tradeHistory.reduce((sum, t) => sum + t.profitRate, 0) /
        result.tradeHistory.length
      : 0;
  const variance =
    result.tradeHistory.length > 1
      ? result.tradeHistory.reduce(
          (sum, t) => sum + Math.pow(t.profitRate - avgReturn, 2),
          0
        ) /
        (result.tradeHistory.length - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">백테스트 결과</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{result.market}</span>
          <span>•</span>
          <span>{result.strategy}</span>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">총 수익률</p>
          <p
            className={`text-2xl font-bold ${
              isProfit ? "text-red-400" : "text-blue-400"
            }`}
          >
            {isProfit ? "+" : ""}
            {formatNumber(result.totalProfitRate)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Buy&Hold: {formatNumber(result.buyAndHoldRate)}%
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">승률</p>
          <p className="text-2xl font-bold text-white">
            {formatNumber(result.winRate)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {result.winCount}승 / {result.loseCount}패
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">MDD</p>
          <p className="text-2xl font-bold text-blue-400">
            {formatNumber(maxDrawdown)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">최대 낙폭</p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">샤프 비율</p>
          <p className="text-2xl font-bold text-white">
            {formatNumber(sharpeRatio)}
          </p>
          <p className="text-xs text-gray-500 mt-1">위험 조정 수익률</p>
        </div>
      </div>

      {/* 자산 곡선 */}
      {equityCurve.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-4">자산 곡선</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isProfit ? "#f87171" : "#60a5fa"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isProfit ? "#f87171" : "#60a5fa"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="index"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "#374151" }}
                  tickLine={false}
                  tickFormatter={(v) => `₩${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                  formatter={(value) => [
                    typeof value === "number" ? `₩${formatNumber(value)}` : "N/A",
                    "자산",
                  ]}
                />
                <ReferenceLine
                  y={result.initialBalance}
                  stroke="#6b7280"
                  strokeDasharray="3 3"
                />
                <Area
                  type="monotone"
                  dataKey="totalAsset"
                  stroke={isProfit ? "#f87171" : "#60a5fa"}
                  fill="url(#colorAsset)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 청산 사유 분포 */}
      {exitReasonData.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-4">
            청산 사유 분포
          </h3>
          <div className="space-y-2">
            {exitReasonData
              .sort((a, b) => b.count - a.count)
              .map(({ reason, count, percentage, label, color }) => (
                <div key={reason} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-400 truncate">
                    {label}
                  </span>
                  <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
                    <div
                      className={`h-full ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-24 text-sm text-white text-right">
                    {count}건 ({formatNumber(percentage, 1)}%)
                  </span>
                </div>
              ))}
          </div>

          {/* FAKE/INVALID 경고 */}
          {fakeRate > 10 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  가짜 시그널 비율: {formatNumber(fakeRate, 1)}% - 진입 필터 강화 검토
                  필요
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 거래 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">총 거래</p>
          <p className="text-xl font-bold text-white">{result.totalTrades}건</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">매수</p>
          <p className="text-xl font-bold text-green-400">{result.buyCount}건</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">매도</p>
          <p className="text-xl font-bold text-red-400">{result.sellCount}건</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">최종 자산</p>
          <p className="text-xl font-bold text-white">
            ₩{formatNumber(result.finalTotalAsset)}
          </p>
        </div>
      </div>

      {/* 기간 정보 */}
      <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
        <p>
          {result.startDate} ~ {result.endDate} ({result.totalDays}일)
        </p>
        <p className="mt-1">
          초기 자본: ₩{formatNumber(result.initialBalance)} → 최종: ₩
          {formatNumber(result.finalTotalAsset)}
        </p>
      </div>
    </div>
  );
};

export default BacktestResultPanel;
