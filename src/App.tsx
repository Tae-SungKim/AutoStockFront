import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { Header } from "./components/Header";
import { MarketList } from "./components/MarketList";
import { PriceChart } from "./components/PriceChart";
import { AccountInfo } from "./components/AccountInfo";
import { OrderPanel } from "./components/OrderPanel";
import { AutoTrading } from "./components/AutoTrading";
import { Backtest } from "./components/Backtest";
import { TradeHistory } from "./components/TradeHistory";
import { UserSettings } from "./components/UserSettings";
import Dashboard from "./components/Dashboard";
import Alerts from "./components/Alerts";
import Rebalance from "./components/Rebalance";
import StrategyParams from "./components/StrategyParams";
import StrategyOptimizer from "./components/StrategyOptimizer";
import { RealTradingDashboard } from "./components/realtrading";
import { ReplayContainer } from "./components/replay";
import {
  LayoutDashboard,
  LineChart,
  AlertTriangle,
  Scale,
  Settings,
  Zap,
  Activity,
  BarChart3,
} from "lucide-react";

type AuthPage = "login" | "register";
type TabType = "realtrading" | "trading" | "dashboard" | "alerts" | "rebalance" | "strategy-params" | "optimizer" | "replay";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState("KRW-BTC");
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("realtrading");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-content-secondary">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === "login") {
      return <LoginPage onSwitchToRegister={() => setAuthPage("register")} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthPage("login")} />;
  }

  const tabs = [
    { id: "realtrading" as TabType, label: "실거래", icon: Activity },
    { id: "trading" as TabType, label: "트레이딩", icon: LineChart },
    { id: "dashboard" as TabType, label: "대시보드", icon: LayoutDashboard },
    { id: "alerts" as TabType, label: "급등/급락", icon: AlertTriangle },
    { id: "rebalance" as TabType, label: "리밸런싱", icon: Scale },
    { id: "strategy-params" as TabType, label: "전략 설정", icon: Settings },
    { id: "optimizer" as TabType, label: "최적화", icon: Zap },
    { id: "replay" as TabType, label: "리플레이", icon: BarChart3 },
  ];

  const renderTabContent = () => {
    if (showSettings) {
      return <UserSettings />;
    }

    switch (activeTab) {
      case "realtrading":
        return <RealTradingDashboard />;
      case "dashboard":
        return <Dashboard />;
      case "alerts":
        return <Alerts />;
      case "rebalance":
        return <Rebalance />;
      case "strategy-params":
        return <StrategyParams />;
      case "optimizer":
        return <StrategyOptimizer />;
      case "replay":
        return (
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <ReplayContainer />
          </div>
        );
      case "trading":
      default:
        return (
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            {/* 왼쪽 사이드바 - 마켓 목록 */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-2">
              <div className="lg:h-[calc(100vh-200px)] lg:sticky lg:top-6">
                <MarketList
                  selectedMarket={selectedMarket}
                  onSelectMarket={setSelectedMarket}
                />
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="col-span-12 lg:col-span-9 xl:col-span-10">
              <div className="grid grid-cols-12 gap-4 sm:gap-6">
                {/* 차트 */}
                <div className="col-span-12 xl:col-span-8">
                  <PriceChart market={selectedMarket} />
                </div>

                {/* 계좌 정보 */}
                <div className="col-span-12 xl:col-span-4">
                  <AccountInfo />
                </div>

                {/* 주문 패널 */}
                <div className="col-span-12 md:col-span-6 xl:col-span-6">
                  <OrderPanel market={selectedMarket} />
                </div>

                {/* 자동매매 */}
                <div className="col-span-12 md:col-span-6 xl:col-span-6">
                  <AutoTrading />
                </div>

                {/* 백테스트 */}
                <div className="col-span-12">
                  <Backtest />
                </div>

                {/* 매매 손익 */}
                <div className="col-span-12">
                  <TradeHistory />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header onSettingsClick={() => setShowSettings(!showSettings)} />

      {/* Tab Navigation - Mobile Responsive */}
      {!showSettings && (
        <div className="bg-surface-secondary border-b border-line">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-purple-600 text-white"
                        : "text-content-secondary hover:text-content hover:bg-surface-hover"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className={activeTab === "trading" ? "container mx-auto px-2 sm:px-4 py-4 sm:py-6" : ""}>
        {renderTabContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
