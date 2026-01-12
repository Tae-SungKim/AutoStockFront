import type { ExitReason } from "../types";

/**
 * 종료 사유 한글 라벨 매핑
 */
export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  STOP_LOSS_FIXED: "고정 손절 (-N%)",
  STOP_LOSS_ATR: "ATR 손절",
  TRAILING_STOP: "트레일링 스탑",
  TAKE_PROFIT: "목표가 익절",
  SIGNAL_INVALID: "시그널 역전",
  FAKE_REBOUND: "가짜 반등 감지",
  VOLUME_DROP: "거래량 급감",
  OVERHEATED: "과열 감지",
  TIMEOUT: "보유 시간 초과",
};

/**
 * 종료 사유별 색상 매핑
 * 손실 사유: 붉은색 계열
 * 수익 사유: 초록/파란색 계열
 */
export const EXIT_REASON_COLORS: Record<ExitReason, string> = {
  // 손실 관련 (붉은색 계열)
  STOP_LOSS_FIXED: "#ef4444", // red-500
  STOP_LOSS_ATR: "#dc2626", // red-600
  FAKE_REBOUND: "#f87171", // red-400
  VOLUME_DROP: "#fca5a5", // red-300
  OVERHEATED: "#fb923c", // orange-400
  SIGNAL_INVALID: "#f97316", // orange-500
  TIMEOUT: "#fdba74", // orange-300

  // 수익 관련 (초록/파란색 계열)
  TAKE_PROFIT: "#22c55e", // green-500
  TRAILING_STOP: "#3b82f6", // blue-500
};

/**
 * 종료 사유가 손실 사유인지 확인
 */
export const isLossReason = (reason: ExitReason): boolean => {
  return [
    "STOP_LOSS_FIXED",
    "STOP_LOSS_ATR",
    "FAKE_REBOUND",
    "VOLUME_DROP",
    "OVERHEATED",
    "SIGNAL_INVALID",
    "TIMEOUT",
  ].includes(reason);
};

/**
 * 종료 사유가 수익 사유인지 확인
 */
export const isProfitReason = (reason: ExitReason): boolean => {
  return ["TAKE_PROFIT", "TRAILING_STOP"].includes(reason);
};

/**
 * 종료 사유 통계를 차트 데이터로 변환
 */
export const convertExitStatsToChartData = (
  stats: Record<string, number> | undefined
): Array<{ name: string; value: number; color: string; reason: ExitReason }> => {
  if (!stats) return [];

  return Object.entries(stats)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      name: EXIT_REASON_LABELS[reason as ExitReason] || reason,
      value: count,
      color: EXIT_REASON_COLORS[reason as ExitReason] || "#6b7280",
      reason: reason as ExitReason,
    }))
    .sort((a, b) => b.value - a.value); // 내림차순 정렬
};

/**
 * 종료 사유 통계 요약 정보 생성
 */
export const getExitReasonSummary = (stats: Record<string, number> | undefined) => {
  if (!stats) {
    return {
      totalExits: 0,
      lossExits: 0,
      profitExits: 0,
      lossRate: 0,
      profitRate: 0,
      mostCommonReason: null as ExitReason | null,
      mostCommonReasonCount: 0,
    };
  }

  const entries = Object.entries(stats) as [ExitReason, number][];
  const totalExits = entries.reduce((sum, [_, count]) => sum + count, 0);

  const lossExits = entries
    .filter(([reason]) => isLossReason(reason))
    .reduce((sum, [_, count]) => sum + count, 0);

  const profitExits = entries
    .filter(([reason]) => isProfitReason(reason))
    .reduce((sum, [_, count]) => sum + count, 0);

  const sortedByCount = entries.sort((a, b) => b[1] - a[1]);
  const [mostCommonReason, mostCommonReasonCount] = sortedByCount[0] || [null, 0];

  return {
    totalExits,
    lossExits,
    profitExits,
    lossRate: totalExits > 0 ? (lossExits / totalExits) * 100 : 0,
    profitRate: totalExits > 0 ? (profitExits / totalExits) * 100 : 0,
    mostCommonReason,
    mostCommonReasonCount,
  };
};
