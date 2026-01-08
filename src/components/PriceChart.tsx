import { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import { BarChart3, RefreshCw } from "lucide-react";
import { upbitApi } from "../api/upbitApi";
import type { Candle, Ticker } from "../types";

interface PriceChartProps {
  market: string;
}

type TimeFrame = "1m" | "5m" | "15m" | "1h" | "1d";

export function PriceChart({ market }: PriceChartProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("15m");
  const [loading, setLoading] = useState(true);

  const timeFrameConfig: Record<
    TimeFrame,
    { unit?: number; isDay: boolean; label: string }
  > = {
    "1m": { unit: 1, isDay: false, label: "1분" },
    "5m": { unit: 5, isDay: false, label: "5분" },
    "15m": { unit: 15, isDay: false, label: "15분" },
    "1h": { unit: 60, isDay: false, label: "1시간" },
    "1d": { isDay: true, label: "1일" },
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = timeFrameConfig[timeFrame];

      const [candleData, tickerData] = await Promise.all([
        config.isDay
          ? upbitApi.getDayCandles(market, 50)
          : upbitApi.getMinuteCandles(config.unit!, market, 50),
        upbitApi.getTicker(market),
      ]);

      setCandles(candleData.reverse());
      setTicker(tickerData[0]);
    } catch (err) {
      console.error("차트 데이터 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    //const interval = setInterval(fetchData, 10000);
    //return () => clearInterval(interval);
  }, [market, timeFrame]);

  const chartData = candles.map((candle) => ({
    time: new Date(candle.candleDateTimeKst).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    price: candle.tradePrice,
    high: candle.highPrice,
    low: candle.lowPrice,
    open: candle.openingPrice,
    volume: candle.candleAccTradeVolume,
  }));

  const formatPrice = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(0) + "K";
    return value.toFixed(0);
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("ko-KR").format(num);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">{market} 차트</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-700 rounded-lg p-1">
            {(Object.keys(timeFrameConfig) as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={
                  "px-3 py-1 rounded text-sm transition-colors " +
                  (timeFrame === tf
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white")
                }
              >
                {timeFrameConfig[tf].label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw
              className={
                "w-4 h-4 text-gray-400 " + (loading ? "animate-spin" : "")
              }
            />
          </button>
        </div>
      </div>

      {ticker && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">현재가</p>
            <p
              className={
                "text-lg font-bold " +
                (ticker.change === "RISE"
                  ? "text-green-400"
                  : ticker.change === "FALL"
                  ? "text-red-400"
                  : "text-white")
              }
            >
              ₩{formatNumber(ticker.tradePrice)}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">전일대비</p>
            <p
              className={
                "text-lg font-bold " +
                (ticker.signedChangeRate >= 0
                  ? "text-green-400"
                  : "text-red-400")
              }
            >
              {ticker.signedChangeRate >= 0 ? "+" : ""}
              {(ticker.signedChangeRate * 100).toFixed(2)}%
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">고가</p>
            <p className="text-lg font-bold text-green-400">
              ₩{formatNumber(ticker.highPrice)}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">저가</p>
            <p className="text-lg font-bold text-red-400">
              ₩{formatNumber(ticker.lowPrice)}
            </p>
          </div>
        </div>
      )}

      <div className="h-80">
        {loading && candles.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#374151" }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                axisLine={{ stroke: "#374151" }}
                tickFormatter={formatPrice}
                domain={["dataMin - 1%", "dataMax + 1%"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={(value: number | undefined) =>
                  value !== undefined
                    ? ["₩" + formatNumber(value), "가격"]
                    : ["-", "가격"]
                }
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                fill="url(#priceGradient)"
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
