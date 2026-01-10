import React, { useState, useEffect } from "react";
import { alertService } from "../api/upbitApi";
import type { MarketScanResult, TopGainerLoser, MarketAlert } from "../types";
import { AlertTriangle, TrendingUp, TrendingDown, Search } from "lucide-react";

const Alerts: React.FC = () => {
  const [scanResult, setScanResult] = useState<MarketScanResult | null>(null);
  const [topGainers, setTopGainers] = useState<TopGainerLoser[]>([]);
  const [topLosers, setTopLosers] = useState<TopGainerLoser[]>([]);
  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([]);
  const [searchMarket, setSearchMarket] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchScanData = async () => {
    try {
      setLoading(true);
      const result = await alertService.scanMarket(50);
      setScanResult(result);
    } catch (error) {
      console.error("Failed to scan market", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopMovers = async () => {
    try {
      const gainers = await alertService.getTopGainers(10);
      const losers = await alertService.getTopLosers(10);
      setTopGainers(gainers);
      setTopLosers(losers);
    } catch (error) {
      console.error("Failed to fetch top movers", error);
    }
  };

  const handleSearch = async () => {
    if (!searchMarket) return;
    try {
      const alerts = await alertService.getMarketAlert(
        searchMarket.toUpperCase()
      );
      setMarketAlerts(alerts);
    } catch (error) {
      console.error("Failed to fetch market alert", error);
    }
  };

  useEffect(() => {
    fetchScanData();
    fetchTopMovers();
    const interval = setInterval(() => {
      fetchScanData();
      fetchTopMovers();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">
        급등/급락 감지 시스템
      </h1>

      {/* Market Scan Summary */}
      {scanResult && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ActivityIcon condition={scanResult.marketCondition} />
            시장 전체 스캔 ({scanResult.analyzedAt})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">분석 마켓</p>
              <p className="text-xl font-bold">{scanResult.totalMarkets}</p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="text-sm text-red-500">급등 마켓</p>
              <p className="text-xl font-bold text-red-600">
                {scanResult.surgingMarkets}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-500">급락 마켓</p>
              <p className="text-xl font-bold text-blue-600">
                {scanResult.plungingMarkets}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">평균 변화율</p>
              <p
                className={`text-xl font-bold ${
                  scanResult.avgChangeRate >= 0
                    ? "text-red-500"
                    : "text-blue-500"
                }`}
              >
                {scanResult.avgChangeRate > 0 ? "+" : ""}
                {scanResult.avgChangeRate.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Alerts List */}
          {scanResult.alerts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">감지된 알림</h3>
              <div className="space-y-2">
                {scanResult.alerts.map((alert, idx) => (
                  <AlertItem key={idx} alert={alert} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-red-500 flex items-center gap-2">
            <TrendingUp /> 급등 코인 TOP 10
          </h2>
          <div className="space-y-2">
            {topGainers.map((coin, idx) => (
              <MoverItem key={idx} item={coin} type="gainer" />
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-blue-500 flex items-center gap-2">
            <TrendingDown /> 급락 코인 TOP 10
          </h2>
          <div className="space-y-2">
            {topLosers.map((coin, idx) => (
              <MoverItem key={idx} item={coin} type="loser" />
            ))}
          </div>
        </div>
      </div>

      {/* Individual Market Search */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">개별 마켓 조회</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="마켓 코드 (예: KRW-BTC)"
            className="flex-1 p-2 border rounded"
            value={searchMarket}
            onChange={(e) => setSearchMarket(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Search size={18} /> 조회
          </button>
        </div>

        {marketAlerts.length > 0 ? (
          <div className="space-y-2">
            {marketAlerts.map((alert, idx) => (
              <AlertItem key={idx} alert={alert} />
            ))}
          </div>
        ) : (
          searchMarket && (
            <p className="text-gray-500">감지된 알림이 없습니다.</p>
          )
        )}
      </div>
    </div>
  );
};

const ActivityIcon = ({ condition }: { condition: string }) => {
  if (condition === "BULL") return <TrendingUp className="text-red-500" />;
  if (condition === "BEAR") return <TrendingDown className="text-blue-500" />;
  return <AlertTriangle className="text-gray-500" />;
};

const AlertItem = ({ alert }: { alert: MarketAlert }) => (
  <div className="flex justify-between items-center p-3 bg-gray-50 rounded border-l-4 border-yellow-400">
    <div>
      <span className="font-bold mr-2">{alert.market}</span>
      <span className="text-sm text-gray-600">{alert.description}</span>
    </div>
    <div className="text-right">
      <div className="font-bold">{alert.currentPrice.toLocaleString()} KRW</div>
      <div
        className={`text-sm ${
          alert.changeRate >= 0 ? "text-red-500" : "text-blue-500"
        }`}
      >
        {alert.changeRate > 0 ? "+" : ""}
        {alert.changeRate.toFixed(2)}%
      </div>
    </div>
  </div>
);

const MoverItem = ({
  item,
  type,
}: {
  item: TopGainerLoser;
  type: "gainer" | "loser";
}) => (
  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
    <div className="flex items-center gap-2">
      <span className="font-medium w-20">{item.market}</span>
      <span className="text-xs text-gray-500">{item.description}</span>
    </div>
    <div className="text-right">
      <span className="font-bold block">
        {item.currentPrice.toLocaleString()}
      </span>
      <span
        className={`text-sm ${
          type === "gainer" ? "text-red-500" : "text-blue-500"
        }`}
      >
        {item.changeRate > 0 ? "+" : ""}
        {item.changeRate.toFixed(2)}%
      </span>
    </div>
  </div>
);

export default Alerts;
