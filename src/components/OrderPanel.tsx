import { useState, useEffect } from "react";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { upbitApi } from "../api/upbitApi";
import type { Ticker } from "../types";

interface OrderPanelProps {
  market: string;
}

type OrderType = "market" | "limit";
type OrderSide = "buy" | "sell";

export function OrderPanel({ market }: OrderPanelProps) {
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [krwBalance, setKrwBalance] = useState(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const currency = market.replace("KRW-", "");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tickerData, accounts] = await Promise.all([
          upbitApi.getTicker(market),
          upbitApi.getAccounts(),
        ]);
        setTicker(tickerData[0]);
        const krwAccount = accounts.find((acc) => acc.currency === "KRW");
        const coinAccount = accounts.find((acc) => acc.currency === currency);
        setKrwBalance(parseFloat(krwAccount?.balance || "0"));
        setCoinBalance(parseFloat(coinAccount?.balance || "0"));
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
      }
    };
    fetchData();
    //const interval = setInterval(fetchData, 5000);
    //return () => clearInterval(interval);
  }, [market, currency]);

  const handleOrder = async () => {
    if (!amount) {
      setMessage({ type: "error", text: "수량을 입력해주세요." });
      return;
    }
    if (orderType === "limit" && !price) {
      setMessage({ type: "error", text: "가격을 입력해주세요." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (orderType === "market") {
        if (orderSide === "buy") {
          await upbitApi.buyMarketOrder(market, parseFloat(amount));
          setMessage({
            type: "success",
            text: "시장가 매수 주문이 완료되었습니다.",
          });
        } else {
          await upbitApi.sellMarketOrder(market, parseFloat(amount));
          setMessage({
            type: "success",
            text: "시장가 매도 주문이 완료되었습니다.",
          });
        }
      } else {
        if (orderSide === "buy") {
          await upbitApi.buyLimitOrder(
            market,
            parseFloat(amount),
            parseFloat(price)
          );
          setMessage({
            type: "success",
            text: "지정가 매수 주문이 완료되었습니다.",
          });
        } else {
          await upbitApi.sellLimitOrder(
            market,
            parseFloat(amount),
            parseFloat(price)
          );
          setMessage({
            type: "success",
            text: "지정가 매도 주문이 완료되었습니다.",
          });
        }
      }
      setAmount("");
      setPrice("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "주문 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePercentage = (percent: number) => {
    if (orderSide === "buy") {
      setAmount(((krwBalance * percent) / 100).toFixed(0));
    } else {
      setAmount(((coinBalance * percent) / 100).toFixed(8));
    }
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("ko-KR").format(num);

  const estimatedTotal = () => {
    if (!amount) return 0;
    if (orderType === "market" && orderSide === "buy")
      return parseFloat(amount);
    if (orderType === "market" && orderSide === "sell" && ticker)
      return parseFloat(amount) * ticker.tradePrice;
    if (orderType === "limit" && price)
      return parseFloat(amount) * parseFloat(price);
    return 0;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-white">주문</h2>
      </div>

      <div className="flex bg-gray-700 rounded-lg p-1 mb-4">
        <button
          onClick={() => setOrderType("market")}
          className={
            "flex-1 py-2 rounded text-sm font-medium transition-colors " +
            (orderType === "market"
              ? "bg-gray-600 text-white"
              : "text-gray-400")
          }
        >
          시장가
        </button>
        <button
          onClick={() => setOrderType("limit")}
          className={
            "flex-1 py-2 rounded text-sm font-medium transition-colors " +
            (orderType === "limit" ? "bg-gray-600 text-white" : "text-gray-400")
          }
        >
          지정가
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setOrderSide("buy")}
          className={
            "flex-1 py-3 rounded-lg font-medium transition-colors " +
            (orderSide === "buy"
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600")
          }
        >
          매수
        </button>
        <button
          onClick={() => setOrderSide("sell")}
          className={
            "flex-1 py-3 rounded-lg font-medium transition-colors " +
            (orderSide === "sell"
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600")
          }
        >
          매도
        </button>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">주문 가능</span>
          <span className="text-white font-medium">
            {orderSide === "buy"
              ? "₩ " + formatNumber(krwBalance)
              : coinBalance.toFixed(8) + " " + currency}
          </span>
        </div>
      </div>

      {orderType === "limit" && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">주문 가격</label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={
                ticker
                  ? "현재가: " + formatNumber(ticker.tradePrice)
                  : "가격 입력"
              }
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => ticker && setPrice(ticker.tradePrice.toString())}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-600 text-xs text-gray-300 rounded hover:bg-gray-500"
            >
              현재가
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          {orderType === "market" && orderSide === "buy"
            ? "주문 총액 (KRW)"
            : "수량 (" + currency + ")"}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={
            orderType === "market" && orderSide === "buy"
              ? "주문 금액 입력"
              : "수량 입력"
          }
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 mb-4">
        {[10, 25, 50, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => handlePercentage(percent)}
            className="flex-1 py-2 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors"
          >
            {percent}%
          </button>
        ))}
      </div>

      <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {orderSide === "buy" ? "예상 매수 금액" : "예상 매도 금액"}
          </span>
          <span className="text-white font-medium">
            ₩ {formatNumber(estimatedTotal())}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={
            "flex items-center gap-2 p-3 rounded-lg mb-4 " +
            (message.type === "success"
              ? "bg-green-500/10 border border-green-500/50"
              : "bg-red-500/10 border border-red-500/50")
          }
        >
          <AlertCircle
            className={
              "w-4 h-4 " +
              (message.type === "success" ? "text-green-400" : "text-red-400")
            }
          />
          <p
            className={
              "text-sm " +
              (message.type === "success" ? "text-green-400" : "text-red-400")
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <button
        onClick={handleOrder}
        disabled={loading}
        className={
          "w-full py-4 rounded-lg font-bold text-white transition-colors disabled:cursor-not-allowed " +
          (orderSide === "buy"
            ? "bg-green-600 hover:bg-green-700 disabled:bg-green-800"
            : "bg-red-600 hover:bg-red-700 disabled:bg-red-800")
        }
      >
        {loading
          ? "처리중..."
          : orderSide === "buy"
          ? currency + " 매수"
          : currency + " 매도"}
      </button>
    </div>
  );
}
