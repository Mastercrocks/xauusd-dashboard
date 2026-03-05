import axios from 'axios';
import { MarketData, TimeframeAnalysis, TradingPair } from '../types';
import { getPairConfig } from '../config/pairsConfig';

const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

export class MarketDataService {
  // Market data for development/demo
  static async getMarketData(pair: TradingPair = 'XAUUSD'): Promise<MarketData> {
    try {
      if (!ALPHA_VANTAGE_KEY) {
        return this.getMockMarketData(pair);
      }

      // In production, fetch real data from Alpha Vantage or other API
      return this.getMockMarketData(pair);
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getMockMarketData(pair);
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
  static async fetchRealTimeData(symbol: string = 'XAUUSD') {
    try {
      const response = await axios.get(ALPHA_VANTAGE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: ALPHA_VANTAGE_KEY,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      throw error;
    }
  }
}
