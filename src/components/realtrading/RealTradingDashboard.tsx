import React, { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Zap, Play, Activity } from "lucide-react";
import { useRealTrading } from "../../hooks/useRealTrading";
import { tradeHistory } from "../../api/upbitApi";
import { EngineControlPanel } from "./EngineControlPanel";
import { PositionGrid } from "./PositionGrid";
import { QuickStats } from "./QuickStats";
import { ExitReasonStats } from "./ExitReasonStats";
import { LiveSurgeDashboard, ReplayAnalysisPanel, AllMarketsReplay } from "../surge";
import type { TradeProfitSummary, TradeProfitRecord } from "../../types";

type ViewTab = "positions" | "surge" | "replay" | "all-replay";

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
  const [activeView, setActiveView] = useState<ViewTab>("positions");
  const [selectedMarket, setSelectedMarket] = useState<string>("KRW-BTC");

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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 청산 사유 통계 계산
  const exitReasonStats = (Array.isArray(records) ? records : [])
    .filter((r) => r.status === "MATCHED")
    .reduce((acc, r) => {
      const reason = r.sellStrategy || "UNKNOWN";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const totalExitTrades = (Array.isArray(records) ? records : []).filter(
    (r) => r.status === "MATCHED"
  ).length;

  // 평균 보유 시간 계산
  const positionsList = Array.isArray(positions) ? positions : [];
  const avgHoldingTime =
    positionsList.length > 0
      ? positionsList.reduce((sum, p) => sum + (p.holdingMinutes || 0), 0) /
        positionsList.length
      : 0;

  // 오늘 거래 수 계산
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = (Array.isArray(records) ? records : []).filter(
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

  // 급등 마켓 선택 시 리플레이로 이동
  const handleSurgeMarketSelect = (market: string) => {
    setSelectedMarket(market);
    setActiveView("replay");
  };

  const viewTabs = [
    { id: "positions" as ViewTab, label: "포지션", shortLabel: "POS", icon: null, color: "purple" },
    { id: "surge" as ViewTab, label: "급등 감지", shortLabel: "급등", icon: Zap, color: "yellow" },
    { id: "replay" as ViewTab, label: "리플레이", shortLabel: "RPL", icon: Play, color: "blue" },
    { id: "all-replay" as ViewTab, label: "전체 리플레이", shortLabel: "ALL", icon: Activity, color: "indigo" },
  ];

  const getButtonClass = (tabId: ViewTab, color: string) => {
    const isActive = activeView === tabId;
    const colorMap: Record<string, string> = {
      purple: "bg-purple-600",
      yellow: "bg-yellow-600",
      blue: "bg-blue-600",
      indigo: "bg-indigo-600",
    };
    return isActive
      ? `${colorMap[color]} text-white`
      : "text-content-secondary hover:text-content hover:bg-surface-hover";
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-surface min-h-screen">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-content">실시간 트레이딩</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-surface-tertiary text-content-secondary rounded-lg hover:bg-surface-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        {/* 뷰 탭 - Mobile Optimized */}
        <div className="flex gap-1 bg-surface-secondary rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${getButtonClass(tab.id, tab.color)}`}
              >
                {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 에러 표시 */}
      {positionsError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">
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

      {/* 메인 컨텐츠 - 포지션 뷰 */}
      {activeView === "positions" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 포지션 그리드 */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <PositionGrid
              positions={positionsList}
              loading={positionsLoading}
              error={positionsError}
              onExitPosition={exitPosition}
              onExitAll={exitAllPositions}
              exitLoading={exitPositionLoading}
              exitAllLoading={exitAllLoading}
            />
          </div>

          {/* 사이드바 통계 - Mobile First */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
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
      )}

      {/* 급등 감지 뷰 */}
      {activeView === "surge" && (
        <LiveSurgeDashboard onMarketSelect={handleSurgeMarketSelect} />
      )}

      {/* 리플레이 뷰 */}
      {activeView === "replay" && (
        <ReplayAnalysisPanel initialMarket={selectedMarket} />
      )}

      {/* 전체 마켓 리플레이 뷰 */}
      {activeView === "all-replay" && <AllMarketsReplay />}
    </div>
  );
};

export default RealTradingDashboard;
