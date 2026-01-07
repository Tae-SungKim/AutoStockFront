import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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

type AuthPage = "login" | "register";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState("KRW-BTC");
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Header onSettingsClick={() => setShowSettings(!showSettings)} />

      <main className="container mx-auto px-4 py-6">
        {showSettings ? (
          <UserSettings />
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* 왼쪽 사이드바 - 마켓 목록 */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-2">
              <div className="h-[calc(100vh-140px)] sticky top-6">
                <MarketList
                  selectedMarket={selectedMarket}
                  onSelectMarket={setSelectedMarket}
                />
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="col-span-12 lg:col-span-9 xl:col-span-10">
              <div className="grid grid-cols-12 gap-6">
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
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
