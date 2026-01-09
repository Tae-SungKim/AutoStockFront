export interface Account {
  currency: string;
  balance: string;
  locked: string;
  avgBuyPrice: string;
  avg_buy_price_modified: boolean;
  unit_currency: string;
}

export interface Market {
  market: string;
  koreanName: string;
  englishName: string;
  marketWarning: string;
}

export interface Ticker {
  market: string;
  tradeDate: string;
  tradeTime: string;
  tradeTimestamp: number;
  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  tradePrice: number;
  prevClosingPrice: number;
  change: "RISE" | "EVEN" | "FALL";
  changePrice: number;
  changeRate: number;
  signedChangePrice: number;
  signedChangeRate: number;
  tradeVolume: number;
  accTradePrice: number;
  accTradePrice24h: number;
  accTradeVolume: number;
  accTradeVolume24h: number;
  highest52WeekPrice: number;
  highest52WeekDate: string;
  lowest52WeekPrice: number;
  lowest52WeekDate: string;
  timestamp: number;
}

export interface Candle {
  market: string;
  candleDateTimeUtc: string;
  candleDateTimeKst: string;
  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  tradePrice: number;
  timestamp: number;
  candleAccTradePrice: number;
  candleAccTradeVolume: number;
  unit?: number;
}

export interface OrderResponse {
  uuid: string;
  side: "bid" | "ask";
  ordType: "limit" | "price" | "market";
  price: string;
  state: string;
  market: string;
  createdAt: string;
  volume: string;
  remainingVolume: string;
  reservedFee: string;
  remainingFee: string;
  paidFee: string;
  locked: string;
  executedVolume: string;
  tradesCount: number;
}

export interface TradingStatus {
  accounts: Account[];
}

export interface TradeHistoryItem {
  timestamp: string;
  type: "BUY" | "SELL";
  price: number;
  volume: number;
  amount: number;
  balance: number;
  coinBalance: number;
  totalAsset: number;
  profitRate: number;
  strategy: string;
}

export interface BacktestResult {
  market: string;
  strategy: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  initialBalance: number;
  finalBalance: number;
  finalCoinBalance: number;
  finalCoinValue: number;
  finalTotalAsset: number;
  totalProfitRate: number;
  maxProfitRate: number;
  maxLossRate: number;
  buyAndHoldRate: number;
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  winCount: number;
  loseCount: number;
  winRate: number;
  tradeHistory: TradeHistoryItem[];
}

export interface StrategySummary {
  strategy: string;
  totalProfitRate: number;
  totalTrades: number;
  winRate: number;
  maxLossRate: number;
  buyAndHoldRate: number;
}

export interface BacktestCompareSummary {
  market: string;
  period: string;
  initialBalance: number;
  bestStrategy: string;
  bestProfitRate: number;
  strategies: StrategySummary[];
}

export interface MultiMarketStrategyResult {
  strategy: string;
  totalProfitRate: number;
  averageProfitRate: number;
  averageWinRate: number;
  profitableMarkets: number;
  losingMarkets: number;
  bestMarket: string;
  worstMarket: string;
}

export interface MultiMarketCompareResult {
  markets: string[];
  initialBalancePerMarket: number;
  bestStrategy: string;
  bestTotalProfitRate: number;
  strategyResults: MultiMarketStrategyResult[];
}

export interface SimulationResult {
  strategy: string;
  totalMarkets: number;
  initialBalancePerMarket: number;
  totalInitialBalance: number;
  totalFinalAsset: number;
  totalProfitRate: number;
  averageProfitRate: number;
  averageWinRate: number;
  profitableMarkets: number;
  losingMarkets: number;
  bestMarket: string;
  bestMarketProfitRate: number;
  worstMarket: string;
  worstMarketProfitRate: number;
  marketResults: BacktestResult[];
  profitRateByMarket: Record<string, number>;
}

export interface TradeProfitRecord {
  market: string;
  status: "HOLDING" | "MATCHED";
  buyOrderUuid: string;
  buyStrategy: string;
  buyDate: string;
  buyTime: string;
  buyPrice: number;
  buyVolume: number;
  buyAmount: number;
  buyFee: number;
  targetPrice: number | null;
  sellOrderUuid: string | null;
  sellStrategy: string | null;
  sellDate: string | null;
  sellTime: string | null;
  sellPrice: number | null;
  sellVolume: number | null;
  sellAmount: number | null;
  sellFee: number | null;
  holdingDays: number;
  grossProfit: number | null;
  netProfit: number | null;
  profitRate: number | null;
  totalFee: number;
}

export interface TradeOrderRecord {
  id: number;
  market: string;
  side: "BUY" | "SELL";
  price: number;
  volume: number;
  amount: number;
  fee: number;
  createdAt: string;
}

export interface TradePairRecord {
  id: number;
  market: string;
  buy: TradeOrderRecord;
  sell?: TradeOrderRecord;
  status: "HOLDING" | "MATCHED";
  profit?: number;
  profitRate?: number;
}

export interface TradeProfitSummary {
  market?: string;
  winCount: number;
  loseCount: number;
  totalFee: number;
  winRate: string; // API returns string like "100.00%"
  matchedTrades: number;
  totalNetProfit: number;
  holdingTrades: number;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  upbitAccessKey?: string;
  upbitSecretKey?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  email: string;
  autoTradingEnabled: boolean;
  message: string;
}

export interface UserInfo {
  username: string;
  email: string;
  autoTradingEnabled: boolean;
  hasUpbitKeys: boolean;
  createdAt: string;
}

export interface AutoTradingRequest {
  enabled: boolean;
}

export interface AutoTradingResponse {
  autoTradingEnabled: boolean;
  message: string;
}

export interface UpbitKeysRequest {
  accessKey: string;
  secretKey: string;
}

export interface UpbitKeysResponse {
  message: string;
  hasUpbitKeys: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DailyProfitRecord {
  date: string;
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
  fee: number;
  status: "MATCHED" | "HOLDING";
  netProfit: number;
  profitRate: string; // "1.23%" 형식
  markets: string[];
}

// Strategy Types
export interface AvailableStrategy {
  name: string;
  className: string;
  description?: string;
  type?: "BUY" | "SELL";
}

export interface UserStrategy {
  strategyName: string;
  name: string;
  className: string;
  enabled: boolean;
  priority: number;
  description?: string;
}

export interface UserStrategiesResponse {
  strategies: UserStrategy[];
}

export interface StrategyToggleRequest {
  strategyName: string;
  enabled: boolean;
}

export interface StrategySetRequest {
  strategies: string[];
}

export interface StrategyResponse {
  message: string;
  strategies?: UserStrategy[];
}
