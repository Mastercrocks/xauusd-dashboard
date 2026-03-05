import { PairConfig, TradingPair } from '../types';

export const TRADING_PAIRS: Record<TradingPair, PairConfig> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold vs US Dollar',
    currentPrice: 2450.00,
    description: 'Precious Metal - Safe Haven Asset',
    color: '#FFD700',
    volatilityFactor: 1.5, // Higher volatility
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro vs US Dollar',
    currentPrice: 1.0850,
    description: 'Major Currency Pair - Most Liquid',
    color: '#1E90FF',
    volatilityFactor: 1.0,
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound vs US Dollar',
    currentPrice: 1.2750,
    description: 'Major Currency Pair',
    color: '#FF6347',
    volatilityFactor: 1.1,
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'US Dollar vs Japanese Yen',
    currentPrice: 150.50,
    description: 'Major Currency Pair - Risk Sentiment',
    color: '#FF69B4',
    volatilityFactor: 0.9,
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    name: 'Australian Dollar vs US Dollar',
    currentPrice: 0.6750,
    description: 'Commodity Currency - Risk Sensitive',
    color: '#00CED1',
    volatilityFactor: 1.0,
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin vs US Dollar',
    currentPrice: 60000.00,
    description: 'Cryptocurrency - High Volatility',
    color: '#F7931A',
    volatilityFactor: 2.0,
  },
  NZDUSD: {
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar vs US Dollar',
    currentPrice: 0.6100,
    description: 'Commodity Currency',
    color: '#228B22',
    volatilityFactor: 1.0,
  },
  USDCAD: {
    symbol: 'USDCAD',
    name: 'US Dollar vs Canadian Dollar',
    currentPrice: 1.3650,
    description: 'Major Currency Pair - Oil Sensitive',
    color: '#FF4500',
    volatilityFactor: 0.95,
  },
};

export const PAIR_LIST: TradingPair[] = Object.keys(TRADING_PAIRS) as TradingPair[];

export const getPairConfig = (symbol: TradingPair): PairConfig => {
  return TRADING_PAIRS[symbol] || TRADING_PAIRS.XAUUSD;
};

export const getPairDisplayName = (symbol: TradingPair): string => {
  return `${TRADING_PAIRS[symbol].name} (${symbol})`;
};
