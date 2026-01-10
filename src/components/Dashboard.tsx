import React, { useEffect, useState } from "react";
import { dashboardService } from "../api/upbitApi";
import type { DashboardData } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowUp, ArrowDown, Activity, DollarSign, Wallet } from "lucide-react";

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getDashboardData();
      setData(result);
      setError(null);
    } catch (err) {
      setError("대시보드 데이터를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  if (error && !data) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
        <span className="text-sm text-gray-500">
          업데이트: {new Date(data.updatedAt).toLocaleString()}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 자산</p>
              <p className="text-xl font-bold">
                {data.totalAsset.toLocaleString()} KRW
              </p>
            </div>
            <Wallet className="text-blue-500" size={24} />
          </div>
          <div className="mt-2 text-sm">
            <span
              className={
                data.totalProfitLoss >= 0 ? "text-red-500" : "text-blue-500"
              }
            >
              {data.totalProfitLoss > 0 ? "+" : ""}
              {data.totalProfitLoss.toLocaleString()} (
              {data.totalProfitLossRate.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">보유 KRW</p>
              <p className="text-xl font-bold">
                {data.krwBalance.toLocaleString()} KRW
              </p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">코인 평가금</p>
              <p className="text-xl font-bold">
                {data.coinEvaluation.toLocaleString()} KRW
              </p>
            </div>
            <Activity className="text-purple-500" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">시장 상태</p>
              <p
                className={`text-xl font-bold ${
                  data.marketStatus.marketCondition === "BULL"
                    ? "text-red-500"
                    : data.marketStatus.marketCondition === "BEAR"
                    ? "text-blue-500"
                    : "text-gray-500"
                }`}
              >
                {data.marketStatus.marketCondition}
              </p>
            </div>
            {data.marketStatus.marketCondition === "BULL" ? (
              <ArrowUp className="text-red-500" size={24} />
            ) : data.marketStatus.marketCondition === "BEAR" ? (
              <ArrowDown className="text-blue-500" size={24} />
            ) : (
              <Activity className="text-gray-500" size={24} />
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            급등 {data.marketStatus.surgingMarkets} / 급락{" "}
            {data.marketStatus.plungingMarkets}
          </div>
        </div>
      </div>

      {/* Charts & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Chart */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">수익 추이</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.profitChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#8884d8"
                  name="누적 수익"
                />
                <Line
                  type="monotone"
                  dataKey="profitLoss"
                  stroke="#82ca9d"
                  name="일별 수익"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">최근 거래</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recentTrades.length === 0 ? (
              <p className="text-gray-500 text-center py-4">거래 내역 없음</p>
            ) : (
              data.recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{trade.market}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(trade.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        trade.tradeType === "BUY"
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}
                    >
                      {trade.tradeType === "BUY" ? "매수" : "매도"}
                    </p>
                    <p className="text-xs">
                      {trade.price.toLocaleString()} KRW
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">보유 자산</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  코인
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  보유수량
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매수평균가
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재가
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평가금액
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수익률
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.assets.map((asset) => (
                <tr key={asset.market}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {asset.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {asset.balance.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {asset.avgBuyPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {asset.currentPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {asset.evaluationAmount.toLocaleString()}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                      asset.profitLossRate >= 0
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  >
                    {asset.profitLossRate > 0 ? "+" : ""}
                    {asset.profitLossRate.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
