import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  FileText,
  Play,
  TrendingDown,
  Settings,
} from "lucide-react";
import { ReplayDashboard } from "./ReplayDashboard";
import { SessionList } from "./SessionList";
import { LogViewer } from "./LogViewer";
import { SimulationPanel } from "./SimulationPanel";
import { LossAnalysis } from "./LossAnalysis";
import { AdminPanel } from "./AdminPanel";

type ReplayTab = "dashboard" | "sessions" | "logs" | "simulation" | "analysis" | "admin";

interface TabParams {
  strategy?: string;
  market?: string;
  sessionId?: string;
  days?: string;
  from?: string;
  to?: string;
}

const TABS = [
  { id: "dashboard" as const, label: "대시보드", icon: BarChart3 },
  { id: "sessions" as const, label: "세션", icon: Calendar },
  { id: "logs" as const, label: "로그", icon: FileText },
  { id: "simulation" as const, label: "시뮬", icon: Play },
  { id: "analysis" as const, label: "분석", icon: TrendingDown },
  { id: "admin" as const, label: "관리", icon: Settings },
];

export const ReplayContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReplayTab>("dashboard");
  const [tabParams, setTabParams] = useState<TabParams>({});

  const handleNavigate = (tab: string, params?: Record<string, string>) => {
    setActiveTab(tab as ReplayTab);
    if (params) {
      setTabParams(params);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setTabParams({ ...tabParams, sessionId });
    setActiveTab("logs");
  };

  const handleSimulateSession = (sessionId: string) => {
    setTabParams({ ...tabParams, sessionId });
    setActiveTab("simulation");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ReplayDashboard onNavigate={handleNavigate} />;
      case "sessions":
        return (
          <SessionList
            strategy={tabParams.strategy || "VolumeConfirmedBreakoutStrategy"}
            onSelectSession={handleSelectSession}
            onSimulateSession={handleSimulateSession}
          />
        );
      case "logs":
        return (
          <LogViewer
            market={tabParams.market}
            sessionId={tabParams.sessionId}
            strategy={tabParams.strategy}
            from={tabParams.from}
            to={tabParams.to}
          />
        );
      case "simulation":
        return (
          <SimulationPanel
            initialStrategy={tabParams.strategy}
            initialMarket={tabParams.market}
            sessionId={tabParams.sessionId}
          />
        );
      case "analysis":
        return (
          <LossAnalysis
            initialStrategy={tabParams.strategy}
            initialDays={tabParams.days ? parseInt(tabParams.days) : 7}
          />
        );
      case "admin":
        return <AdminPanel />;
      default:
        return <ReplayDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setTabParams({});
              }}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary hover:text-content"
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {renderContent()}
    </div>
  );
};

// Export all components
export { ReplayDashboard } from "./ReplayDashboard";
export { SessionList } from "./SessionList";
export { LogViewer } from "./LogViewer";
export { SimulationPanel } from "./SimulationPanel";
export { LossAnalysis } from "./LossAnalysis";
export { AdminPanel } from "./AdminPanel";

export default ReplayContainer;
