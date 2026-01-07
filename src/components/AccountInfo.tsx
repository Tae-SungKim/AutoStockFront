import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { upbitApi } from "../api/upbitApi";
import type { Account, Ticker } from "../types";

interface AccountWithPrice extends Account {
  currentPrice?: number;
  totalValue?: number;
  profitRate?: number;
}

export function AccountInfo() {
  const [accounts, setAccounts] = useState<AccountWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountData = await upbitApi.getAccounts();
      const accountsWithBalance = accountData
        .filter(
          (acc) => parseFloat(acc.balance) > 0 || parseFloat(acc.locked) > 0
        )
        .filter((acc) => parseInt(acc.avgBuyPrice) > 0)
        .filter((acc) => acc.currency !== "KMD"); // 평균매수가가 음수인 경우 필터링})
      const coinAccounts = accountsWithBalance.filter(
        (acc) => acc.currency !== "KRW"
      );

      if (coinAccounts.length > 0) {
        const markets = coinAccounts
          .map((acc) => "KRW-" + acc.currency)
          .join(",");
        const tickers = await upbitApi.getTicker(markets);
        const tickerMap = new Map<string, Ticker>();
        tickers.forEach((ticker) => {
          const currency = ticker.market.replace("KRW-", "");
          tickerMap.set(currency, ticker);
        });

        const enrichedAccounts = accountsWithBalance.map((acc) => {
          if (acc.currency === "KRW") {
            return {
              ...acc,
              currentPrice: 1,
              totalValue: parseFloat(acc.balance),
              profitRate: 0,
            };
          }
          const ticker = tickerMap.get(acc.currency);
          if (ticker) {
            const avgPrice = parseFloat(acc.avgBuyPrice);
            const currentPrice = ticker.tradePrice;
            const balance = parseFloat(acc.balance);
            const totalValue = balance * currentPrice;
            const profitRate =
              avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
            return { ...acc, currentPrice, totalValue, profitRate };
          }
          return acc;
        });
        setAccounts(enrichedAccounts);
      } else {
        setAccounts(accountsWithBalance);
      }
      setError(null);
    } catch (err) {
      setError("계좌 정보를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalAsset = accounts.reduce(
    (sum, acc) => sum + (acc.totalValue || 0),
    0
  );
  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">보유 자산</h2>
        </div>
        <button
          onClick={fetchAccounts}
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 mb-6">
        <p className="text-blue-100 text-sm mb-1">총 보유자산</p>
        <p className="text-2xl font-bold text-white">
          ₩ {formatNumber(totalAsset)}
        </p>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.currency}
            className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-white">{account.currency}</p>
              <p className="text-sm text-gray-400">
                {formatNumber(
                  parseFloat(account.balance),
                  account.currency === "KRW" ? 0 : 8
                )}
              </p>
            </div>
            <div className="text-right">
              {account.totalValue !== undefined && (
                <p className="font-medium text-white">
                  ₩ {formatNumber(account.totalValue)}
                </p>
              )}
              {account.profitRate !== undefined &&
                account.currency !== "KRW" && (
                  <div className="flex items-center gap-1 justify-end">
                    {account.profitRate >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <p
                      className={
                        "text-sm " +
                        (account.profitRate >= 0
                          ? "text-green-400"
                          : "text-red-400")
                      }
                    >
                      {account.profitRate >= 0 ? "+" : ""}
                      {formatNumber(account.profitRate, 2)}%
                    </p>
                  </div>
                )}
            </div>
          </div>
        ))}
        {accounts.length === 0 && !error && (
          <p className="text-gray-400 text-center py-4">
            보유 자산이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
