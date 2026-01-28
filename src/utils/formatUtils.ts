/**
 * Number formatting utilities with Korean locale support
 */

interface FormatNumberOptions {
  decimals?: number;
  compact?: boolean;
  locale?: "ko" | "en";
}

/**
 * Format number with Korean locale
 */
export const formatNumber = (
  num: number | null | undefined,
  options: FormatNumberOptions = {}
): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";

  const { decimals = 0, compact = false, locale = "ko" } = options;

  if (compact) {
    return formatCompact(num, locale);
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format number with abbreviations for large values
 * Korean: 억 (100M), 만 (10K)
 * English: B (Billion), M (Million), K (Thousand)
 */
export const formatCompact = (
  num: number | null | undefined,
  locale: "ko" | "en" = "ko"
): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (locale === "ko") {
    if (absNum >= 100_000_000) {
      return `${sign}${(absNum / 100_000_000).toFixed(1)}억`;
    }
    if (absNum >= 10_000) {
      return `${sign}${(absNum / 10_000).toFixed(1)}만`;
    }
  } else {
    if (absNum >= 1_000_000_000) {
      return `${sign}${(absNum / 1_000_000_000).toFixed(1)}B`;
    }
    if (absNum >= 1_000_000) {
      return `${sign}${(absNum / 1_000_000).toFixed(1)}M`;
    }
    if (absNum >= 1_000) {
      return `${sign}${(absNum / 1_000).toFixed(1)}K`;
    }
  }

  return formatNumber(num, { decimals: 0 });
};

/**
 * Format currency with Won symbol
 */
export const formatWon = (
  num: number | null | undefined,
  options: Omit<FormatNumberOptions, "locale"> = {}
): string => {
  const formatted = formatNumber(num, { ...options, locale: "ko" });
  return formatted === "-" ? formatted : `₩${formatted}`;
};

/**
 * Format currency with compact notation for Won
 */
export const formatWonCompact = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return `₩${formatCompact(num, "ko")}`;
};

/**
 * Format percentage
 */
export const formatPercent = (
  num: number | null | undefined,
  decimals: number = 2,
  showSign: boolean = false
): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  const sign = showSign && num > 0 ? "+" : "";
  return `${sign}${formatNumber(num, { decimals })}%`;
};

/**
 * Format holding time in Korean
 */
export const formatHoldingTime = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
};

/**
 * Format date/time in Korean locale
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleString("ko-KR");
};

export const formatTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Format volume with Korean abbreviations (조, 억, 만)
 */
export const formatVolume = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1_000_000_000_000) {
    return `${sign}${(absNum / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (absNum >= 100_000_000) {
    return `${sign}${(absNum / 100_000_000).toFixed(1)}억`;
  }
  if (absNum >= 10_000) {
    return `${sign}${(absNum / 10_000).toFixed(0)}만`;
  }

  return formatNumber(num, { decimals: 0 });
};
