import axios from 'axios';
import { MacroData, SentimentData } from '../types';

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const FINNHUB_URL = 'https://finnhub.io/api/v1';

export class MacroSentimentService {
  /**
   * Get macro economic data
   * In production, integrate with real economic data APIs
   */
  static async getMacroData(): Promise<MacroData> {
    try {
      if (!FINNHUB_KEY) {
        return this.getMockMacroData();
      }

      // In production, fetch real data
      return this.getMockMacroData();
    } catch (error) {
      console.error('Error fetching macro data:', error);
      return this.getMockMacroData();
    }
  }

  /**
   * Get market sentiment data
   */
  static async getSentimentData(): Promise<SentimentData> {
    try {
      if (!FINNHUB_KEY) {
        return this.getMockSentimentData();
      }

      // In production, fetch real sentiment data
      return this.getMockSentimentData();
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      return this.getMockSentimentData();
    }
  }

  /**
   * Fetch macro data from external API
   */
  static async fetchDXYData() {
    try {
      const response = await axios.get(`${FINNHUB_URL}/quote`, {
        params: {
          symbol: 'DXY',
          token: FINNHUB_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching DXY data:', error);
      throw error;
    }
  }

  /**
   * Fetch bond yield data
   */
  static async fetchBondYieldData() {
    try {
      const response = await axios.get(`${FINNHUB_URL}/quote`, {
        params: {
          symbol: 'US10Y',
          token: FINNHUB_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bond yield data:', error);
      throw error;
    }
  }

  /**
   * Fetch news sentiment for gold/XAUUSD
   */
  static async getNewsSentiment() {
    try {
      const response = await axios.get(`${FINNHUB_URL}/news`, {
        params: {
          category: 'general',
          minId: 0,
          token: FINNHUB_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news sentiment:', error);
      throw error;
    }
  }

  // Mock data for development
  private static getMockMacroData(): MacroData {
    const directions: Array<'up' | 'down' | 'neutral'> = ['up', 'down', 'neutral'];
    const inflationTrends: Array<'rising' | 'falling' | 'stable'> = ['rising', 'falling', 'stable'];
    const fedOutlooks: Array<'hawkish' | 'dovish' | 'neutral'> = ['hawkish', 'dovish', 'neutral'];

    return {
      dxyDirection: directions[Math.floor(Math.random() * directions.length)],
      bondYieldDirection: directions[Math.floor(Math.random() * directions.length)],
      inflationTrend: inflationTrends[Math.floor(Math.random() * inflationTrends.length)],
      fedOutlook: fedOutlooks[Math.floor(Math.random() * fedOutlooks.length)],
    };
  }

  private static getMockSentimentData(): SentimentData {
    const newsSentiments: Array<'bullish' | 'bearish' | 'neutral'> = ['bullish', 'bearish', 'neutral'];
    const riskSentiments: Array<'risk-on' | 'risk-off'> = ['risk-on', 'risk-off'];
    const volumeTrends: Array<'increasing' | 'decreasing' | 'stable'> = ['increasing', 'decreasing', 'stable'];

    return {
      newsSentiment: newsSentiments[Math.floor(Math.random() * newsSentiments.length)],
      riskSentiment: riskSentiments[Math.floor(Math.random() * riskSentiments.length)],
      volumeTrend: volumeTrends[Math.floor(Math.random() * volumeTrends.length)],
    };
  }
}
