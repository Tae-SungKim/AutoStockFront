import { useState, useEffect, useMemo } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  Target,
  Calendar,
} from "lucide-react";
import { tradeHistory, upbitApi } from "../api/upbitApi";
import type {
  TradeProfitRecord,
  TradeProfitSummary,
  DailyProfitRecord,
  Ticker,
} from "../types";

type TabType = "summary" | "history" | "daily";

export function TradeHistory() {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [summary, setSummary] = useState<TradeProfitSummary | null>(null);
  const [records, setRecords] = useState<TradeProfitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>(
    {}
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [dailyRecords, setDailyRecords] = useState<DailyProfitRecord[]>([]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = selectedMarket
        ? await tradeHistory.getSummaryByMarket(selectedMarket)
        : await tradeHistory.getSummary();
      setSummary(data);
    } catch (err) {
      setError("손익 요약을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = selectedMarket
        ? await tradeHistory.getProfitByMarket(selectedMarket)
        : await tradeHistory.getProfit();
      setRecords(data);

      // 보유중인 마켓들의 현재 시세 조회
      const holdingMarkets = data
        .filter((r) => r.status === "HOLDING")
        .map((r) => r.market);
      const uniqueMarkets = [...new Set(holdingMarkets)];

      if (uniqueMarkets.length > 0) {
        const tickers = await upbitApi.getTicker(uniqueMarkets.join(","));
        const priceMap: Record<string, number> = {};
        tickers.forEach((ticker: Ticker) => {
          priceMap[ticker.market] = ticker.tradePrice;
        });
        setCurrentPrices(priceMap);
      }
    } catch (err) {
      setError("매매 내역을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyProfit = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await upbitApi.getDailyProfit(
        startDate || undefined,
        endDate || undefined
      );
      setDailyRecords(data);
    } catch (err) {
      setError("일자별 수익률을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 마켓 목록 추출
  const markets = useMemo(() => {
    return [...new Set(records.map((r) => r.market))];
  }, [records]);

  // 날짜 필터링 및 최신순 정렬
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate = record.buyDate;
      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
      return true;
    });
  }, [records, startDate, endDate]);

  // 최신순 정렬
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const dateA = new Date(`${a.buyDate}T${a.buyTime}`);
      const dateB = new Date(`${b.buyDate}T${b.buyTime}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredRecords]);

  // 날짜 필터링된 요약 계산
  const filteredSummary = useMemo(() => {
    if (!startDate && !endDate) return summary;
    if (filteredRecords.length === 0) return null;

    const matched = filteredRecords.filter((r) => r.status === "MATCHED");
    const holding = filteredRecords.filter((r) => r.status === "HOLDING");
    const wins = matched.filter((r) => (r.netProfit ?? 0) > 0);
    const losses = matched.filter((r) => (r.netProfit ?? 0) < 0);
    const totalNetProfit = matched.reduce(
      (sum, r) => sum + (r.netProfit ?? 0),
      0
    );
    const totalFee = filteredRecords.reduce(
      (sum, r) => sum + (r.totalFee ?? 0),
      0
    );
    const winRate =
      matched.length > 0
        ? ((wins.length / matched.length) * 100).toFixed(2) + "%"
        : "0%";

    return {
      holdingTrades: holding.length,
      matchedTrades: matched.length,
      winCount: wins.length,
      loseCount: losses.length,
      totalFee,
      totalNetProfit,
      winRate,
    } as TradeProfitSummary;
  }, [summary, filteredRecords, startDate, endDate]);

  useEffect(() => {
    // 항상 records를 불러와서 날짜 필터링에 사용
    fetchRecords();
    if (activeTab === "summary") {
      fetchSummary();
    } else if (activeTab === "daily") {
      fetchDailyProfit();
    }
  }, [activeTab, selectedMarket]);

  // 날짜 변경 시 일자별 수익률 다시 불러오기
  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyProfit();
    }
  }, [startDate, endDate]);

  const formatNumber = (num: number | null, decimals: number = 0) => {
    if (num === null) return "-";
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatDateTime = (date: string, time: string) => {
    return `${date} ${time.substring(0, 5)}`;
  };

  const formatShortDateTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSummary = () => {
    const displaySummary = startDate || endDate ? filteredSummary : summary;
    if (!displaySummary) return null;

    // API 응답 필드에 맞게 처리
    const holdingTrades = displaySummary.holdingTrades ?? 0;
    const matchedTrades = displaySummary.matchedTrades ?? 0;
    const totalTrades = holdingTrades + matchedTrades;
    const winCount = displaySummary.winCount ?? 0;
    const loseCount = displaySummary.loseCount ?? 0;
    const totalFee = displaySummary.totalFee ?? 0;
    const totalNetProfit = displaySummary.totalNetProfit ?? 0;

    // winRate는 "100.00%" 형식의 문자열이므로 파싱
    let winRateNum = 0;
    if (displaySummary.winRate) {
      const parsed = parseFloat(displaySummary.winRate.replace("%", ""));
      if (!isNaN(parsed)) {
        winRateNum = parsed;
      }
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">총 거래</p>
            <p className="text-xl font-bold text-white">
              {formatNumber(totalTrades)}회
            </p>
            <p className="text-xs text-gray-500 mt-1">
              보유 {holdingTrades} / 매도 {matchedTrades}
            </p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">승률</p>
            <p
              className={
                "text-xl font-bold " +
                (winRateNum >= 50 ? "text-green-400" : "text-red-400")
              }
            >
              {displaySummary.winRate ?? "0%"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              승 {winCount} / 패 {loseCount}
            </p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">순이익</p>
            <div className="flex items-center gap-1">
              {totalNetProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <p
                className={
                  "text-xl font-bold " +
                  (totalNetProfit >= 0 ? "text-green-400" : "text-red-400")
                }
              >
                ₩{formatNumber(totalNetProfit)}
              </p>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">총 수수료</p>
            <p className="text-xl font-bold text-white">
              ₩{formatNumber(totalFee)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDailyProfit = () => {
    if (dailyRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          일자별 수익률 데이터가 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* 기간 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">조회 기간</p>
            <p className="text-lg font-bold text-white">
              {dailyRecords.length}일
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">총 매수</p>
            <p className="text-lg font-bold text-red-400">
              {formatNumber(
                (dailyRecords || [])
                  .map((it) => it.buyCount)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0)
              )}
              회
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ₩
              {formatNumber(
                (dailyRecords || [])
                  .map((it) => it.buyAmount)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0)
              )}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">총 매도</p>
            <p className="text-lg font-bold text-blue-400">
              {formatNumber(
                (dailyRecords || [])
                  .map((it) => it.sellCount)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0)
              )}
              회
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ₩
              {formatNumber(
                (dailyRecords || [])
                  .map((it) => it.sellAmount)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0)
              )}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">기간 총 손익</p>
            <p
              className={
                "text-lg font-bold " +
                ((dailyRecords || [])
                  .map((it) => it.netProfit)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0) >= 0
                  ? "text-red-400"
                  : "text-blue-400")
              }
            >
              {formatNumber(
                (dailyRecords || [])
                  .map((it) => it.netProfit)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0)
              )}
            </p>
            <p className="text-xs text-yellow-400 mt-1">
              수수료: -₩
              {formatNumber(
                (dailyRecords || [])
                  .map((it) => it.fee)
                  .reduce((a, b) => {
                    return a + b;
                  }, 0)
              )}
            </p>
          </div>
        </div>

        {/* 일자별 목록 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  날짜
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  매수/매도
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  매입금액
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  매도금액
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  수수료
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  순이익
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  수익률
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  마켓
                </th>
              </tr>
            </thead>
            <tbody>
              {/*dailyRecords.markets.map((record) => {
                // profitRate는 "1.23%" 형식의 문자열이므로 파싱
                const profitRateNum = parseFloat(
                  record.profitRate?.replace("%", "") ?? "0"
                );

                return (
                  <tr
                    key={record.date}
                    className="border-b border-gray-700 hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {record.date}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-400">{record.buyCount}</span>
                      <span className="text-gray-500"> / </span>
                      <span className="text-blue-400">{record.sellCount}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      ₩{formatNumber(record.buyAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-400">
                      ₩{formatNumber(record.sellAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-yellow-400">
                      -₩{formatNumber(record.fee)}
                    </td>
                    <td
                      className={
                        "py-3 px-4 text-right font-medium " +
                        (record.netProfit >= 0
                          ? "text-red-400"
                          : "text-blue-400")
                      }
                    >
                      {record.netProfit >= 0 ? "+" : ""}₩
                      {formatNumber(record.netProfit)}
                    </td>
                    <td
                      className={
                        "py-3 px-4 text-right font-medium " +
                        (profitRateNum >= 0 ? "text-red-400" : "text-blue-400")
                      }
                    >
                      {profitRateNum >= 0 ? "+" : ""}
                      {record.profitRate}
                    </td>
                    <td className="py-3 px-4 text-left text-gray-300 text-xs">
                      {record.market}
                    </td>
                  </tr>
                );
              })*/}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (sortedRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          매매 내역이 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {sortedRecords.map((record) => (
          <div
            key={record.buyOrderUuid}
            className="bg-gray-700/50 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-gray-700/70 transition-colors"
              onClick={() =>
                setExpandedRecord(
                  expandedRecord === record.buyOrderUuid
                    ? null
                    : record.buyOrderUuid
                )
              }
            >
              {/* 메인 라인: 마켓명, 상태, 매수->매도 요�� */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{record.market}</p>
                      <span
                        className={
                          "px-2 py-0.5 rounded text-xs font-medium " +
                          (record.status === "HOLDING"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400")
                        }
                      >
                        {record.status === "HOLDING" ? "보유중" : "매도완료"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatShortDateTime(record.buyDate, record.buyTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    {/* 보유중일 때: 매수가 -> 목표가 -> 현재가 */}
                    {record.status === "HOLDING" && (
                      <>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            ₩{formatNumber(record.buyPrice)}
                          </p>
                          <p className="text-xs text-gray-500">매수가</p>
                        </div>
                        {record.targetPrice !== null && (
                          <>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                            <div className="text-right">
                              <p className="text-purple-400 font-medium">
                                ₩{formatNumber(record.targetPrice)}
                              </p>
                              <p className="text-xs text-gray-500">목표가</p>
                            </div>
                          </>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <div className="text-right">
                          {currentPrices[record.market] ? (
                            <>
                              <p
                                className={
                                  "font-medium " +
                                  (currentPrices[record.market] >
                                  record.buyPrice
                                    ? "text-red-400"
                                    : currentPrices[record.market] <
                                      record.buyPrice
                                    ? "text-blue-400"
                                    : "text-white")
                                }
                              >
                                ₩{formatNumber(currentPrices[record.market])}
                              </p>
                              <p className="text-xs text-gray-500">현재가</p>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-yellow-400 inline" />
                              <p className="text-xs text-gray-500">로딩중</p>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {/* 매도 완료시: 매입금액 -> 매도금액 -> 수수료 -> 순이익(수익률) */}
                    {record.status === "MATCHED" && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-red-400 font-medium">
                            ₩{formatNumber(record.buyAmount ?? 0)}
                          </p>
                          <p className="text-xs text-gray-500">매입</p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <div className="text-right">
                          <p className="text-blue-400 font-medium">
                            ₩{formatNumber(record.sellAmount ?? 0)}
                          </p>
                          <p className="text-xs text-gray-500">매도</p>
                        </div>
                        <div className="text-right border-l border-gray-600 pl-3">
                          <p className="text-yellow-400 text-sm">
                            -₩{formatNumber(record.totalFee ?? 0)}
                          </p>
                          <p className="text-xs text-gray-500">수수료</p>
                        </div>
                        <div className="text-right border-l border-gray-600 pl-3 min-w-[90px]">
                          <p
                            className={
                              "font-bold " +
                              ((record.netProfit ?? 0) > 0
                                ? "text-red-400"
                                : (record.netProfit ?? 0) < 0
                                ? "text-blue-400"
                                : "text-white")
                            }
                          >
                            {(record.netProfit ?? 0) > 0 ? "+" : ""}₩
                            {formatNumber(record.netProfit ?? 0)}
                          </p>
                          <p
                            className={
                              "text-xs font-medium " +
                              ((record.profitRate ?? 0) > 0
                                ? "text-red-400"
                                : (record.profitRate ?? 0) < 0
                                ? "text-blue-400"
                                : "text-gray-500")
                            }
                          >
                            {(record.profitRate ?? 0) > 0 ? "+" : ""}
                            {formatNumber(record.profitRate ?? 0, 2)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {expandedRecord === record.buyOrderUuid ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* 확장된 상세 정보 */}
            {expandedRecord === record.buyOrderUuid && (
              <div className="px-4 pb-4 border-t border-gray-600 pt-3 space-y-4">
                {/* 매수 상세 */}
                <div className="bg-green-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                      매수
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(record.buyDate, record.buyTime)}
                    </span>
                    <span className="text-xs text-blue-400">
                      {record.buyStrategy}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">체결가</p>
                      <p className="text-white">
                        ₩{formatNumber(record.buyPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">수량</p>
                      <p className="text-white">
                        {formatNumber(record.buyVolume, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">거래금액</p>
                      <p className="text-white">
                        ₩{formatNumber(record.buyAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">수수료</p>
                      <p className="text-white">
                        ₩{formatNumber(record.buyFee)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 목표가 및 현재 시세 (보유중일 때) */}
                {record.status === "HOLDING" && (
                  <div className="bg-purple-500/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">
                        목표가 / 현재 시세
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">목표가</p>
                        <p className="text-purple-400 font-medium">
                          ₩{formatNumber(record.targetPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">현재가</p>
                        {currentPrices[record.market] ? (
                          <p
                            className={
                              "font-medium " +
                              (currentPrices[record.market] > record.buyPrice
                                ? "text-red-400"
                                : currentPrices[record.market] < record.buyPrice
                                ? "text-blue-400"
                                : "text-white")
                            }
                          >
                            ₩{formatNumber(currentPrices[record.market])}
                          </p>
                        ) : (
                          <p className="text-gray-500">로딩중...</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400">현재 수익률</p>
                        {currentPrices[record.market] ? (
                          <p
                            className={
                              "font-medium " +
                              (currentPrices[record.market] > record.buyPrice
                                ? "text-red-400"
                                : currentPrices[record.market] < record.buyPrice
                                ? "text-blue-400"
                                : "text-white")
                            }
                          >
                            {currentPrices[record.market] > record.buyPrice
                              ? "+"
                              : currentPrices[record.market] < record.buyPrice
                              ? ""
                              : ""}
                            {formatNumber(
                              ((currentPrices[record.market] -
                                record.buyPrice) /
                                record.buyPrice) *
                                100,
                              2
                            )}
                            %
                          </p>
                        ) : (
                          <p className="text-gray-500">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400">목표 도달률</p>
                        {currentPrices[record.market] &&
                        record.targetPrice !== null ? (
                          <p className="text-purple-400 font-medium">
                            {formatNumber(
                              ((currentPrices[record.market] -
                                record.buyPrice) /
                                (record.targetPrice - record.buyPrice)) *
                                100,
                              1
                            )}
                            %
                          </p>
                        ) : (
                          <p className="text-gray-500">-</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 매도 상세 */}
                {record.sellPrice !== null &&
                record.sellDate !== null &&
                record.sellTime !== null ? (
                  <div className="bg-red-500/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                        매도
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(record.sellDate, record.sellTime)}
                      </span>
                      {record.sellStrategy && (
                        <span className="text-xs text-blue-400">
                          {record.sellStrategy}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">체결가</p>
                        <p className="text-white">
                          ₩{formatNumber(record.sellPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">수량</p>
                        <p className="text-white">
                          {formatNumber(record.sellVolume, 8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">거래금액</p>
                        <p className="text-white">
                          ₩{formatNumber(record.sellAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">수수료</p>
                        <p className="text-white">
                          ₩{formatNumber(record.sellFee)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  record.status !== "HOLDING" && (
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-yellow-400 inline mr-2" />
                      <span className="text-yellow-400">
                        매도 대기중 (보유 {record.holdingDays}일)
                      </span>
                    </div>
                  )
                )}

                {/* 총 손익 요약 */}
                {record.status === "MATCHED" && record.netProfit !== null && (
                  <div className="bg-gray-600/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-400">총 손익</span>
                        <p className="text-xs text-gray-500">
                          총 수수료: ₩{formatNumber(record.totalFee)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={
                            "font-bold text-lg " +
                            (record.netProfit >= 0
                              ? "text-green-400"
                              : "text-red-400")
                          }
                        >
                          {record.netProfit >= 0 ? "+" : ""}₩
                          {formatNumber(record.netProfit)}
                        </p>
                        {record.profitRate !== null && (
                          <p
                            className={
                              "text-sm " +
                              (record.profitRate >= 0
                                ? "text-green-400"
                                : "text-red-400")
                            }
                          >
                            {record.profitRate >= 0 ? "+" : ""}
                            {formatNumber(record.profitRate, 2)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">매매 손익</h2>
        </div>
        <button
          onClick={() => {
            if (activeTab === "summary") fetchSummary();
            else if (activeTab === "history") fetchRecords();
            else if (activeTab === "daily") fetchDailyProfit();
          }}
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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("summary")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors " +
            (activeTab === "summary"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          손익 요약
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors " +
            (activeTab === "history"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          매매 내역
        </button>
        <button
          onClick={() => setActiveTab("daily")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors " +
            (activeTab === "daily"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          일자별 수익률
        </button>
      </div>

      {/* 필터 영역 */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* 마켓 선택 */}
        {markets.length > 0 && (
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">전체 마켓</option>
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        )}

        {/* 날짜 검색 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            placeholder="시작일"
          />
          <span className="text-gray-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
            placeholder="종료일"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg text-sm transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-700 rounded-lg"></div>
          <div className="h-24 bg-gray-700 rounded-lg"></div>
        </div>
      ) : activeTab === "summary" ? (
        renderSummary()
      ) : activeTab === "history" ? (
        renderHistory()
      ) : (
        renderDailyProfit()
      )}
    </div>
  );
}
