/**
 * Trading Rules and Configuration
 * 
 * This file contains the core trading rules and configuration
 * used by the AI analysis system
 */

export const TRADING_RULES = {
  // DXY (US Dollar Index) Impact on Gold
  DXY: {
    rising: 'BEARISH', // Strong dollar = lower gold demand
    falling: 'BULLISH', // Weak dollar = higher gold demand
    neutral: 'NEUTRAL',
  },

  // Bond Yields Impact on Gold
  BOND_YIELDS: {
    rising: 'BEARISH', // Higher yields reduce gold appeal
    falling: 'BULLISH', // Lower yields increase gold appeal
    neutral: 'NEUTRAL',
  },

  // Inflation Expectations
  INFLATION: {
    rising: 'BULLISH', // Gold is inflation hedge
    falling: 'BEARISH', // Deflation reduces gold demand
    stable: 'NEUTRAL',
  },

  // Federal Reserve Policy
  FED_OUTLOOK: {
    hawkish: 'BEARISH', // Tightening = higher USD, lower gold
    dovish: 'BULLISH', // Easing = lower USD, higher gold
    neutral: 'NEUTRAL',
  },

  // Moving Averages
  MOVING_AVERAGES: {
    priceAboveMA200: 'BULLISH', // Above 200MA = uptrend
    priceBelowMA200: 'BEARISH', // Below 200MA = downtrend
    goldenCross: 'BULLISH', // MA50 > MA200
    deathCross: 'BEARISH', // MA50 < MA200
  },

  // RSI (Relative Strength Index)
  RSI: {
    overbought: 70, // RSI > 70
    oversold: 30, // RSI < 30
    neutral_high: 60, // Moderately strong
    neutral_low: 40, // Moderately weak
  },

  // Risk Sentiment
  RISK_SENTIMENT: {
    riskOn: 'BEARISH', // Risk-on = investors avoid safe havens
    riskOff: 'BULLISH', // Risk-off = flight to safety/gold
  },

  // Volume
  VOLUME: {
    increasing: 'CONFIRMATORY', // Supports current trend
    decreasing: 'WEAKENING', // Trend losing conviction
    stable: 'NEUTRAL',
  },
};

export const CONFIDENCE_WEIGHTS = {
  // How much each factor influences confidence score
  technicalIndicators: 0.35, // RSI, MA levels
  macroeconomic: 0.30, // DXY, yields, inflation, Fed
  sentiment: 0.20, // News, risk sentiment, volume
  convergence: 0.15, // Multiple timeframes agreeing
};

export const RISK_LEVELS = {
  LOW: {
    description: 'Low Risk Trade',
    criteria: 'Strong signal with favorable risk/reward',
    rrRatio: '1:2 or better',
    positionSize: '3-5% of account',
    stopLossDistance: 'Tight (10-15 pips)',
  },
  MEDIUM: {
    description: 'Medium Risk Trade',
    criteria: 'Moderate signal with balanced risk/reward',
    rrRatio: '1:1.5',
    positionSize: '2-3% of account',
    stopLossDistance: 'Moderate (20-30 pips)',
  },
  HIGH: {
    description: 'High Risk Trade',
    criteria: 'Weak signal or unfavorable risk/reward',
    rrRatio: '1:1 or worse',
    positionSize: '1% or less of account',
    stopLossDistance: 'Wide (30-50+ pips)',
  },
};

export const ENTRY_STRATEGIES = {
  PULLBACK_BUY: {
    description: 'Buy the dip in uptrend',
    condition: 'Bullish bias + Price pulls back to support',
    entry: 'At support level',
    stopLoss: 'Below support level',
    profitTarget: 'Recent resistance',
  },
  BREAKOUT_BUY: {
    description: 'Buy breakout above resistance',
    condition: 'Bullish bias + Price breaks above key level',
    entry: 'On breakout with confirmation',
    stopLoss: 'Below breakout level',
    profitTarget: 'Next resistance level',
  },
  MOMENTUM_BUY: {
    description: 'Buy strong momentum moves',
    condition: 'Bullish bias + Strong volume + RSI 40-70',
    entry: 'On break of recent high',
    stopLoss: 'Below trend line',
    profitTarget: 'Multiple of ATR',
  },
  PULLBACK_SELL: {
    description: 'Sell the bounce in downtrend',
    condition: 'Bearish bias + Price bounces to resistance',
    entry: 'At resistance level',
    stopLoss: 'Above resistance level',
    profitTarget: 'Recent support',
  },
};

export const EXIT_STRATEGIES = {
  PROFIT_TAKING: {
    level1: 0.5, // Take 50% at first target
    level2: 0.3, // Take 30% at second target
    level3: 0.2, // Let 20% run for max profit
  },
  STOP_LOSS_ADJUSTMENTS: {
    breakeven: 'Move stop to entry at 1:1 RR',
    trailing: 'Use 20-30 pips trailing stop after strong move',
    timeBasedExit: 'Close if no movement in 4 hours',
  },
  EARLY_EXIT_SIGNALS: {
    rsiReversal: 'Exit if RSI reverses from extreme',
    trendlineBroken: 'Exit if price breaks trend line',
    oppositeSignal: 'Exit if opposite signal is generated',
    newsEvent: 'Exit before major economic news',
  },
};

export const MARKET_CONDITIONS = {
  TRENDING: {
    description: 'Strong directional move',
    setup: 'Price clearly above/below MA200, RSI 40-70 or 20-60',
    strategy: 'Trade in direction of trend',
    probability: 'High',
  },
  RANGE_BOUND: {
    description: 'Price oscillating between support/resistance',
    setup: 'Price bouncing between clear levels, RSI 30-70',
    strategy: 'Buy support, sell resistance',
    probability: 'Medium',
  },
  REVERSAL: {
    description: 'Trend is changing direction',
    setup: 'Price breaks key level with volume, RSI extreme',
    strategy: 'Trade the new direction',
    probability: 'Medium',
  },
  BREAKOUT: {
    description: 'Price breaking out of consolidation',
    setup: 'Volume spike + price breaks key level',
    strategy: 'Trade in direction of breakout',
    probability: 'High if confirmed',
  },
  VOLATILE: {
    description: 'High volatility, low confidence',
    setup: 'ATR expanding, RSI extreme, choppy price action',
    strategy: 'Avoid trading or trade with smallest positions',
    probability: 'Low',
  },
};

export const TIME_FRAME_STRATEGY = {
  '1H': {
    name: 'One Hour',
    purpose: 'Short-term scalping and quick reversals',
    holdTime: '15 minutes to 2 hours',
    stopLossSize: '8-15 pips',
    profitTarget: '10-25 pips',
    volatility: 'High',
  },
  '4H': {
    name: 'Four Hours',
    purpose: 'Swing trading and day trading',
    holdTime: '4-24 hours',
    stopLossSize: '20-35 pips',
    profitTarget: '40-80 pips',
    volatility: 'Medium',
  },
  DAILY: {
    name: 'Daily',
    purpose: 'Position trading and long-term trends',
    holdTime: '1-5 days',
    stopLossSize: '40-100 pips',
    profitTarget: '100-300 pips',
    volatility: 'Low',
  },
};

export const POSITION_SIZING = {
  conservativeRiskPercent: 1, // Risk 1% per trade
  normalRiskPercent: 2, // Risk 2% per trade
  aggressiveRiskPercent: 3, // Risk 3% per trade

  calculatePosition: (accountSize: number, riskPercent: number, stopLossPips: number) => {
    const riskAmount = accountSize * (riskPercent / 100);
    const pipValue = 10; // For XAUUSD
    const lotSize = (riskAmount / (stopLossPips * pipValue)) * 100;
    return {
      riskAmount,
      lotSize,
      minimalLot: lotSize < 0.1 ? 0.1 : lotSize,
    };
  },
};

export const TRADE_MANAGEMENT = {
  maximumOpenTrades: 3, // Never have more than 3 open trades
  maximumRiskPerTrade: 0.02, // Max 2% risk per trade
  maximumDailyLoss: 0.05, // Stop trading if down 5% per day
  minimumRewardRatio: 1.5, // Trade only if R:R is 1:1.5 or better
  confirmationCandles: 2, // Wait 2 candles to confirm signal
};

export const GOLD_FUNDAMENTALS = {
  SAFE_HAVEN_ASSET: 'Gold rises when investors fear economic/political instability',
  USD_INVERSE: 'Gold typically moves inverse to USD strength',
  INFLATION_HEDGE: 'Gold preserves value during inflation',
  INTEREST_RATES: 'Higher rates increase opportunity cost of holding gold',
  GEOPOLITICAL_RISK: 'War, sanctions, political crisis increase gold demand',
  REAL_YIELDS: 'Negative real yields (inflation > rates) bullish for gold',
};

export default {
  TRADING_RULES,
  CONFIDENCE_WEIGHTS,
  RISK_LEVELS,
  ENTRY_STRATEGIES,
  EXIT_STRATEGIES,
  MARKET_CONDITIONS,
  TIME_FRAME_STRATEGY,
  POSITION_SIZING,
  TRADE_MANAGEMENT,
  GOLD_FUNDAMENTALS,
};
