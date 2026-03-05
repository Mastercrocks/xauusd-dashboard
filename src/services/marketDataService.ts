import axios from 'axios';
import { MarketData, TimeframeAnalysis, TradingPair } from '../types';
import { getPairConfig } from '../config/pairsConfig';

const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

export class MarketDataService {
  private static cache = new Map<string, { data: MarketData; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getMarketData(pair: TradingPair = 'XAUUSD'): Promise<MarketData> {
    const cacheKey = `marketData_${pair}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      if (!ALPHA_VANTAGE_KEY) {
        return this.getMockMarketData(pair);
      }

      // Fetch real data from Alpha Vantage
      const realData = await this.fetchRealTimeData(pair);
      if (realData && realData.price) {
        this.cache.set(cacheKey, { data: realData, timestamp: Date.now() });
        return realData;
      }

      // Fallback to mock if real data fails
      const mockData = this.getMockMarketData(pair);
      this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return mockData;
    } catch (error) {
      console.error('Error fetching market data:', error);
      const mockData = this.getMockMarketData(pair);
      this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return mockData;
    }
  }

  static async getTimeframeAnalysis(): Promise<TimeframeAnalysis[]> {
    return [
      {
        timeframe: '1H',
        trend: 'Bullish',
        strength: 65,
      },
      {
        timeframe: '4H',
        trend: 'Bullish',
        strength: 72,
      },
      {
        timeframe: 'Daily',
        trend: 'Neutral',
        strength: 55,
      },
    ];
  }

  private static getMockMarketData(pair: TradingPair): MarketData {
    const pairConfig = getPairConfig(pair);
    const basePrice = pairConfig.currentPrice;
    const volatility = pairConfig.volatilityFactor;
    const randomVariation = (Math.random() - 0.5) * 20 * volatility;

    return {
      price: basePrice + randomVariation,
      rsi: 45 + Math.floor(Math.random() * 20),
      ma50: basePrice - (15 * volatility),
      ma200: basePrice - (35 * volatility),
      atr: 25.5 * volatility,
      support: basePrice - (50 * volatility),
      resistance: basePrice + (75 * volatility),
      timestamp: new Date().toISOString(),
    };
  }

  // Helper method to fetch actual data from Alpha Vantage
  static async fetchRealTimeData(symbol: string): Promise<MarketData | null> {
    try {
      const response = await axios.get(ALPHA_VANTAGE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_KEY,
        },
      });

      const data = response.data['Global Quote'];
      if (!data) return null;

      const price = parseFloat(data['05. price']);
      // const change = parseFloat(data['09. change']); // Not used
      // const changePercent = parseFloat(data['10. change percent'].replace('%', '')); // Not used

      // Calculate mock-like values since Alpha Vantage doesn't provide RSI/MA
      const pairConfig = getPairConfig(symbol as TradingPair);
      const volatility = pairConfig ? pairConfig.volatilityFactor : 1.0;

      return {
        price: price,
        rsi: 50 + (Math.random() - 0.5) * 20, // Mock RSI
        ma50: price - (15 * volatility),
        ma200: price - (35 * volatility),
        atr: 25.5 * volatility,
        support: price - (50 * volatility),
        resistance: price + (75 * volatility),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      return null;
    }
  }
}
