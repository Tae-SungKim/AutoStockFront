import React, { useState, useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useRealTrading } from "../../hooks/useRealTrading";
import { tradeHistory } from "../../api/upbitApi";
import { EngineControlPanel } from "./EngineControlPanel";
import { PositionGrid } from "./PositionGrid";
import { QuickStats } from "./QuickStats";
import { ExitReasonStats } from "./ExitReasonStats";
import type { TradeProfitSummary, TradeProfitRecord } from "../../types";

export const RealTradingDashboard: React.FC = () => {
  const {
    engineStatus,
    engineLoading,
    positions,
    positionsLoading,
    positionsError,
    totalProfit,
    avgProfitRate,
    positionCount,
    startEngine,
    startEngineLoading,
    stopEngine,
    stopEngineLoading,
    exitPosition,
    exitPositionLoading,
    exitAllPositions,
    exitAllLoading,
    refetchStatus,
    refetchPositions,
  } = useRealTrading();

  const [summary, setSummary] = useState<TradeProfitSummary | null>(null);
  const [records, setRecords] = useState<TradeProfitRecord[]>([]);

  // 거래 내역 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, recordsData] = await Promise.all([
          tradeHistory.getSummary(),
          tradeHistory.getProfit(),
        ]);
        setSummary(summaryData);
        setRecords(recordsData);
      } catch (error) {
        console.error("Failed to fetch trade history:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 청산 사유 통계 계산
  const exitReasonStats = records
    .filter((r) => r.status === "MATCHED")
    .reduce((acc, r) => {
      // 매도 전략에서 청산 사유 추출 (예: STOP_LOSS_FIXED, TAKE_PROFIT 등)
      const reason = r.sellStrategy || "UNKNOWN";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const totalExitTrades = records.filter((r) => r.status === "MATCHED").length;

  // 평균 보유 시간 계산
  const avgHoldingTime =
    positions.length > 0
      ? positions.reduce((sum, p) => sum + p.holdingMinutes, 0) / positions.length
      : 0;

  // 오늘 거래 수 계산
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = records.filter(
    (r) => r.buyDate === today || r.sellDate === today
  ).length;

  const handleRefresh = () => {
    refetchStatus();
    refetchPositions();
  };

  // 승률 계산
  const winRate = summary
    ? parseFloat(summary.winRate?.replace("%", "") || "0")
    : 0;

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">실시간 트레이딩</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 에러 표시 */}
      {positionsError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">
            포지션 조회 오류: {positionsError.message}
          </p>
        </div>
      )}

      {/* 엔진 컨트롤 */}
      <EngineControlPanel
        status={engineStatus}
        loading={engineLoading}
        onStart={startEngine}
        onStop={stopEngine}
        startLoading={startEngineLoading}
        stopLoading={stopEngineLoading}
      />

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 포지션 그리드 */}
        <div className="lg:col-span-3">
          <PositionGrid
            positions={positions}
            loading={positionsLoading}
            error={positionsError}
            onExitPosition={exitPosition}
            onExitAll={exitAllPositions}
            exitLoading={exitPositionLoading}
            exitAllLoading={exitAllLoading}
          />
        </div>

        {/* 사이드바 통계 */}
        <div className="space-y-6">
          <QuickStats
            totalProfit={totalProfit}
            avgProfitRate={avgProfitRate}
            positionCount={positionCount}
            winRate={winRate}
            todayTrades={todayTrades}
            avgHoldingTime={avgHoldingTime}
          />

          <ExitReasonStats
            stats={exitReasonStats}
            totalTrades={totalExitTrades}
          />
        </div>
      </div>
    </div>
  );
};

export default RealTradingDashboard;
