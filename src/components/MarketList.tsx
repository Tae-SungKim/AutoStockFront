import { useState, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { upbitApi } from "../api/upbitApi";
import type { Market, Ticker } from "../types";

interface MarketListProps {
  selectedMarket: string;
  onSelectMarket: (market: string) => void;
  onMarketList?: (markets: MarketWithTicker[]) => void;
}

interface MarketWithTicker extends Market {
  ticker?: Ticker;
}

export function MarketList({
  selectedMarket,
  onSelectMarket,
  onMarketList,
}: MarketListProps) {
  const [markets, setMarkets] = useState<MarketWithTicker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const marketData = await upbitApi.getMarkets();
      const krwMarkets = marketData.filter((m) => m.market.startsWith("KRW-"));
      const marketIds = krwMarkets.map((m) => m.market).join(",");
      const tickers = await upbitApi.getTicker(marketIds);

      const tickerMap = new Map<string, Ticker>();
      tickers.forEach((ticker) => tickerMap.set(ticker.market, ticker));

      const marketsWithTicker = krwMarkets.map((market) => ({
        ...market,
        ticker: tickerMap.get(market.market),
      }));

      marketsWithTicker.sort(
        (a, b) =>
          (b.ticker?.accTradePrice24h || 0) - (a.ticker?.accTradePrice24h || 0)
      );
      setMarkets(marketsWithTicker);
      if (onMarketList) {
        onMarketList(marketsWithTicker);
      }
    } catch (err) {
      console.error("마켓 목록 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    //const interval = setInterval(fetchMarkets, 5000);
    //return () => clearInterval(interval);
  }, []);

  const filteredMarkets = markets.filter(
    (market) =>
      market.koreanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.market.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("ko-KR").format(num);

  const formatVolume = (num: number) => {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1) + "조";
    if (num >= 100000000) return (num / 100000000).toFixed(1) + "억";
    if (num >= 10000) return (num / 10000).toFixed(0) + "만";
    return formatNumber(num);
  };

  const getChangeIcon = (change?: string) => {
    if (change === "RISE")
      return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (change === "FALL")
      return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getChangeColor = (change?: string) => {
    if (change === "RISE") return "text-green-400";
    if (change === "FALL") return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="bg-surface-secondary rounded-xl p-4 sm:p-6 flex flex-col max-h-[50vh] sm:max-h-none sm:h-full">
      <h2 className="text-base sm:text-lg font-semibold text-content mb-3 sm:mb-4">마켓 목록</h2>

      <div className="relative mb-3 sm:mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-secondary" />
        <input
          type="text"
          placeholder="코인 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-tertiary text-content pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {loading && markets.length === 0 ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-surface-tertiary h-14 sm:h-16 rounded-lg"
              ></div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMarkets.map((market) => (
              <button
                key={market.market}
                onClick={() => onSelectMarket(market.market)}
                className={
                  "w-full p-2 sm:p-3 rounded-lg flex items-center justify-between transition-colors " +
                  (selectedMarket === market.market
                    ? "bg-blue-600/20 border border-blue-500/50"
                    : "hover:bg-surface-tertiary")
                }
              >
                <div className="text-left">
                  <p className="font-medium text-content text-sm sm:text-base">{market.koreanName}</p>
                  <p className="text-xs text-content-secondary">{market.market}</p>
                </div>
                <div className="text-right">
                  {market.ticker && (
                    <>
                      <p
                        className={
                          "font-medium text-sm sm:text-base " + getChangeColor(market.ticker.change)
                        }
                      >
                        ₩{formatNumber(market.ticker.tradePrice)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {getChangeIcon(market.ticker.change)}
                        <p
                          className={
                            "text-xs " + getChangeColor(market.ticker.change)
                          }
                        >
                          {market.ticker.signedChangeRate >= 0 ? "+" : ""}
                          {(market.ticker.signedChangeRate * 100).toFixed(2)}%
                        </p>
                      </div>
                      <p className="text-xs text-content-muted hidden sm:block">
                        {formatVolume(market.ticker.accTradePrice24h)}
                      </p>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
