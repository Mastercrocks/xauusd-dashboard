export interface MarketData {
  price: number;
  rsi: number;
  ma50: number;
  ma200: number;
  atr: number;
  support: number;
  resistance: number;
  timestamp: string;
}

export interface MacroData {
  dxyDirection: 'up' | 'down' | 'neutral';
  bondYieldDirection: 'up' | 'down' | 'neutral';
  inflationTrend: 'rising' | 'falling' | 'stable';
  fedOutlook: 'hawkish' | 'dovish' | 'neutral';
}

export interface SentimentData {
  newsSentiment: 'bullish' | 'bearish' | 'neutral';
  riskSentiment: 'risk-on' | 'risk-off';
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface AnalysisResult {
  marketBias: 'Bullish' | 'Bearish' | 'Neutral';
  confidenceScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reasons: string[];
  tradeIdea: 'Buy' | 'Sell' | 'Wait';
  entryZone: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: string;
}

export interface TimeframeAnalysis {
  timeframe: '1H' | '4H' | 'Daily';
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  strength: number;
}

export type TradingPair = 'XAUUSD' | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'AUDUSD' | 'BTCUSD' | 'NZDUSD' | 'USDCAD';

export interface PairConfig {
  symbol: TradingPair;
  name: string;
  currentPrice: number;
  description: string;
  color: string;
  volatilityFactor: number; // Multiplier for ATR and stops
}
