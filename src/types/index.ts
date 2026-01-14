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

// Exit Reason Types
export type ExitReason =
  | "STOP_LOSS_FIXED"
  | "STOP_LOSS_ATR"
  | "TRAILING_STOP"
  | "TAKE_PROFIT"
  | "SIGNAL_INVALID"
  | "FAKE_REBOUND"
  | "VOLUME_DROP"
  | "OVERHEATED"
  | "TIMEOUT";

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
  exitReason?: ExitReason; // 매도 시 종료 사유
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
  exitReasonStats?: Record<ExitReason, number>; // 종료 사유별 통계
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
  totalExitReasonStats?: Record<ExitReason, number>; // 멀티 코인 전체 종료 사유 통계
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
  market: string;
}
export interface DailyProfitResponse {
  date: string;
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
  fee: number;
  status: "MATCHED" | "HOLDING";
  netProfit: number;
  profitRate: string; // "1.23%" 형식
  markets: DailyProfitRecord[];
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

// Alerts Types
export interface MarketAlert {
  market: string;
  alertType: "SURGE" | "PLUNGE" | "VOLUME_SURGE";
  currentPrice: number;
  changeRate: number;
  volumeChangeRate: number;
  previousPrice: number;
  detectedAt: string;
  description: string;
}

export interface MarketScanResult {
  totalMarkets: number;
  surgingMarkets: number;
  plungingMarkets: number;
  normalMarkets: number;
  avgChangeRate: number;
  marketCondition: "BULL" | "BEAR" | "NEUTRAL";
  alerts: MarketAlert[];
  analyzedAt: string;
}

export interface TopGainerLoser {
  market: string;
  alertType: "TOP_GAINER" | "TOP_LOSER";
  currentPrice: number;
  changeRate: number;
  detectedAt: string;
  description: string;
}

// Dashboard Types
export interface AssetStatus {
  currency: string;
  market: string;
  balance: number;
  avgBuyPrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitLoss: number;
  profitLossRate: number;
}

export interface MarketStatus {
  totalMarkets: number;
  surgingMarkets: number;
  plungingMarkets: number;
  marketCondition: "BULL" | "BEAR" | "NEUTRAL";
}

export interface RecentTrade {
  id: number;
  market: string;
  tradeType: "BUY" | "SELL";
  price: number;
  volume: number;
  amount: number;
  createdAt: string;
}

export interface ProfitChartData {
  date: string;
  profitLoss: number;
  cumulativeProfit: number;
  tradeCount: number;
}

export interface DashboardData {
  totalAsset: number;
  krwBalance: number;
  coinEvaluation: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  assets: AssetStatus[];
  todayTradeCount: number;
  totalTradeCount: number;
  todayProfitLoss: number;
  winRate: number;
  marketStatus: MarketStatus | null;
  recentTrades: RecentTrade[];
  profitChart: ProfitChartData[];
  updatedAt: string;
}

export interface DashboardResponse {
  data: DashboardData;
  success: boolean;
  apiKeyRequired: boolean;
}

export interface DashboardSummary {
  totalAsset: number;
  krwBalance: number;
  coinEvaluation: number;
  coinCount: number;
  updatedAt: string;
}

// Rebalancing Types
export interface RebalanceTarget {
  market: string;
  targetPercent: number;
}

export interface RebalanceAllocation {
  market: string;
  currency: string;
  balance: number;
  currentPrice: number;
  evaluationAmount: number;
  currentPercent: number;
  targetPercent: number;
  deviation: number;
  action: "BUY" | "SELL" | "HOLD";
  actionAmount: number;
}

export interface RebalanceStatus {
  totalAsset: number;
  krwBalance: number;
  krwPercent: number;
  allocations: RebalanceAllocation[];
}

export interface RebalanceAction {
  market: string;
  actionType: "BUY" | "SELL";
  amount: number;
  volume: number;
  priority: number;
}

export interface RebalancePlan {
  currentStatus: RebalanceStatus;
  actions: RebalanceAction[];
  totalBuyAmount: number;
  totalSellAmount: number;
  executable: boolean;
  message: string;
}

export interface RebalanceOrderResult {
  uuid: string;
  side: "bid" | "ask";
  market: string;
  state: string;
  executedVolume: string;
}

export interface RebalanceExecuteResult {
  success: boolean;
  message: string;
  executedCount: number;
  failedCount: number;
  orders: RebalanceOrderResult[];
}

export interface EqualAllocationResult {
  market: string;
  targetPercent: number;
}

// Backtest Visualization Types
export interface BacktestTradeMarker {
  timestamp: string;
  type: "BUY" | "SELL";
  price: number;
  profitRate: number;
  strategy: string;
}

export interface BacktestTradeAnalysis {
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  winCount: number;
  loseCount: number;
  winRate: number;
  avgProfitPerTrade: number;
  avgWinProfit: number;
  avgLossProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  tradesByHour: {
    label: string;
    count: number;
    winRate: number;
    avgProfit: number;
  }[];
  tradesByDayOfWeek: {
    label: string;
    count: number;
    winRate: number;
    avgProfit: number;
  }[];
}

export interface BacktestProfitChart {
  labels: string[];
  profitRates: number[];
  totalAssets: number[];
  benchmarkRates: number[];
}

export interface BacktestVisualizationResult {
  backtestResult: BacktestResult;
  profitChart: BacktestProfitChart;
  tradeAnalysis: BacktestTradeAnalysis;
  tradeMarkers: BacktestTradeMarker[];
}

export interface StrategyCompareResult {
  strategies: string[];
  profitRates: number[];
  winRates: number[];
  tradeCounts: number[];
  sharpeRatios: number[];
}

export interface CoinHeatmapResult {
  markets: string[];
  profitRates: number[];
  winRates: number[];
  tradeCounts: number[];
  bestMarket: string;
  worstMarket: string;
}

// Strategy Parameter Types
export interface StrategyParamDefinition {
  key: string;
  name: string;
  description: string;
  type: "INTEGER" | "DOUBLE" | "STRING" | "BOOLEAN";
  defaultValue: string;
  minValue?: number;
  maxValue?: number;
}

export interface StrategyParamDetail extends StrategyParamDefinition {
  value: string;
  isCustom: boolean;
}

export interface StrategyParamUpdateResult {
  success: boolean;
  message: string;
  parameter?: {
    key: string;
    value: string;
    type: string;
  };
  updatedParams?: string[];
}

export interface StrategyParamSummary {
  [strategyName: string]: {
    totalParams: number;
    customParams: number;
    usingDefaults: boolean;
  };
}

// Strategy Optimizer Types
export interface OptimizerStats {
  totalMarkets: number;
  totalCandles: number;
  markets: {
    market: string;
    candleCount: number;
    startDate: string;
    endDate: string;
  }[];
}

export interface OptimizedParams {
  bollingerPeriod: number;
  bollingerMultiplier: number;
  rsiPeriod: number;
  rsiBuyThreshold: number;
  rsiSellThreshold: number;
  volumeIncreaseRate: number;
  stopLossRate: number;
  takeProfitRate: number;
  trailingStopRate: number;
}

export interface OptimizeResult {
  success: boolean;
  message: string;
  expectedWinRate: number;
  expectedProfitRate: number;
  totalSignals: number;
  params: OptimizedParams;
}

export interface CurrentParams {
  market: string;
  success: boolean;
  dataDrivenParams: {
    bollingerPeriod: number;
    bollingerMultiplier: number;
    rsiPeriod: number;
    rsiBuyThreshold: number;
    rsiSellThreshold: number;
    volumeIncreaseRate: number;
    stopLossRate: number;
    takeProfitRate: number;
    expectedWinRate: number;
    expectedProfitRate: number;
  };
  strategyParams: {
    [strategyName: string]: {
      [paramKey: string]: number | string;
    };
  };
}

export interface ApplyParamsResponse {
  success: boolean;
  message: string;
}

// Async Simulation Types
export type SimulationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface SimulationTask {
  taskId: string;
  status: SimulationStatus;
  estimatedSeconds: number;
  checkStatusUrl?: string;
}

export interface SimulationTaskStatus {
  taskId: string;
  status: SimulationStatus;
  progress: number; // 0-100
  currentStep: string;
  elapsedSeconds: number;
  estimatedSeconds: number;
  errorMessage?: string;
}

export interface SimulationResult {
  status: "COMPLETED" | "FAILED";
  result?: OptimizeResult;
  errorMessage?: string;
}
