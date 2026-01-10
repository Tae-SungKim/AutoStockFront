import React, { useState, useEffect } from "react";
import { rebalanceService } from "../api/upbitApi";
import type {
  RebalanceStatus,
  RebalancePlan,
  RebalanceTarget,
  RebalanceExecuteResult,
} from "../types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Play, CheckCircle, AlertCircle } from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const Rebalance: React.FC = () => {
  const [targets, setTargets] = useState<RebalanceTarget[]>([
    { market: "KRW-BTC", targetPercent: 50 },
    { market: "KRW-ETH", targetPercent: 30 },
    { market: "KRW-XRP", targetPercent: 20 },
  ]);
  const [status, setStatus] = useState<RebalanceStatus | null>(null);
  const [plan, setPlan] = useState<RebalancePlan | null>(null);
  const [executeResult, setExecuteResult] =
    useState<RebalanceExecuteResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const result = await rebalanceService.getStatus(targets);
      setStatus(result);
    } catch (error) {
      console.error("Failed to fetch status", error);
      setMessage("상태 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      setLoading(true);
      const result = await rebalanceService.getPlan(targets);
      setPlan(result);
      setExecuteResult(null);
      setMessage(result.message);
    } catch (error) {
      console.error("Failed to generate plan", error);
      setMessage("계획 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const executeRebalance = async () => {
    if (!plan || !plan.executable) return;
    try {
      setLoading(true);
      const result = await rebalanceService.execute(targets);
      setExecuteResult(result);
      setMessage(result.message);
      fetchStatus(); // Refresh status after execution
    } catch (error) {
      console.error("Failed to execute rebalance", error);
      setMessage("리밸런싱 실행 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (
    index: number,
    field: keyof RebalanceTarget,
    value: string | number
  ) => {
    const newTargets = [...targets];
    if (field === "targetPercent") {
      newTargets[index].targetPercent = Number(value);
    } else {
      newTargets[index].market = String(value);
    }
    setTargets(newTargets);
  };

  const addTarget = () => {
    setTargets([...targets, { market: "", targetPercent: 0 }]);
  };

  const removeTarget = (index: number) => {
    const newTargets = targets.filter((_, i) => i !== index);
    setTargets(newTargets);
  };

  const generateEqualAllocation = async () => {
    const markets = targets.map((t) => t.market).filter((m) => m);
    if (markets.length === 0) return;
    try {
      const result = await rebalanceService.getEqualAllocation(markets, 10); // Reserve 10% KRW
      setTargets(result);
    } catch (error) {
      console.error("Failed to generate equal allocation", error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const chartData = status?.allocations.map((a) => ({
    name: a.currency,
    value: a.evaluationAmount,
  }));

  if (status && status.krwBalance > 0) {
    chartData?.push({ name: "KRW", value: status.krwBalance });
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">포트폴리오 리밸런싱</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status & Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">현재 포트폴리오 구성</h2>
          {status ? (
            <div className="flex flex-col items-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        (value || 0).toLocaleString() + " KRW"
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full mt-4">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">자산</th>
                      <th className="p-2 text-right">비중</th>
                      <th className="p-2 text-right">평가금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.allocations.map((a) => (
                      <tr key={a.market} className="border-t">
                        <td className="p-2">{a.currency}</td>
                        <td className="p-2 text-right">
                          {a.currentPercent.toFixed(2)}%
                        </td>
                        <td className="p-2 text-right">
                          {a.evaluationAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-gray-50 font-bold">
                      <td className="p-2">KRW</td>
                      <td className="p-2 text-right">
                        {status.krwPercent.toFixed(2)}%
                      </td>
                      <td className="p-2 text-right">
                        {status.krwBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              데이터 로딩 중...
            </div>
          )}
        </div>

        {/* Target Settings */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">목표 비중 설정</h2>
          <div className="space-y-3">
            {targets.map((target, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="마켓 (예: KRW-BTC)"
                  className="flex-1 p-2 border rounded"
                  value={target.market}
                  onChange={(e) =>
                    handleTargetChange(index, "market", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="비중 (%)"
                  className="w-24 p-2 border rounded"
                  value={target.targetPercent}
                  onChange={(e) =>
                    handleTargetChange(index, "targetPercent", e.target.value)
                  }
                />
                <button
                  onClick={() => removeTarget(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button
                onClick={addTarget}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                + 추가
              </button>
              <button
                onClick={generateEqualAllocation}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200"
              >
                균등 배분
              </button>
            </div>
            <div className="pt-4 border-t mt-4">
              <p className="text-sm text-gray-500 mb-2">
                총 비중 합계:{" "}
                {targets.reduce((sum, t) => sum + t.targetPercent, 0)}%
              </p>
              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 disabled:bg-blue-300 flex justify-center items-center gap-2"
              >
                <RefreshCw size={18} /> 리밸런싱 계획 생성
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rebalancing Plan & Execution */}
      {plan && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">리밸런싱 계획</h2>

          {message && (
            <div
              className={`p-3 mb-4 rounded ${
                plan.executable
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">마켓</th>
                  <th className="p-3 text-center">주문 유형</th>
                  <th className="p-3 text-right">수량</th>
                  <th className="p-3 text-right">금액</th>
                  <th className="p-3 text-center">우선순위</th>
                </tr>
              </thead>
              <tbody>
                {plan.actions.map((action, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3 font-medium">{action.market}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          action.actionType === "BUY"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {action.actionType === "BUY" ? "매수" : "매도"}
                      </span>
                    </td>
                    <td className="p-3 text-right">{action.volume}</td>
                    <td className="p-3 text-right">
                      {action.amount.toLocaleString()} KRW
                    </td>
                    <td className="p-3 text-center">{action.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={executeRebalance}
              disabled={!plan.executable || loading}
              className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 disabled:bg-gray-300 flex items-center gap-2 font-bold"
            >
              <Play size={18} /> 리밸런싱 실행
            </button>
          </div>
        </div>
      )}

      {/* Execution Result */}
      {executeResult && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {executeResult.success ? (
              <CheckCircle className="text-green-500" />
            ) : (
              <AlertCircle className="text-red-500" />
            )}
            실행 결과
          </h2>
          <p className="mb-4">{executeResult.message}</p>
          <div className="bg-gray-50 p-4 rounded">
            <p>성공: {executeResult.executedCount}건</p>
            <p>실패: {executeResult.failedCount}건</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rebalance;
