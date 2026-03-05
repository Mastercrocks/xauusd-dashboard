import axios from 'axios';
import { NewsItem } from '../types';

const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

export class NewsService {
  static async getLatestNews(pair: string = 'forex'): Promise<NewsItem[]> {
    try {
      if (!ALPHA_VANTAGE_KEY) {
        return this.getMockNews();
      }

      const response = await axios.get(ALPHA_VANTAGE_URL, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: pair === 'XAUUSD' ? 'commodity' : 'forex',
          apikey: ALPHA_VANTAGE_KEY,
        },
      });

      const feed = response.data.feed;
      if (!feed) return this.getMockNews();

      return feed.slice(0, 5).map((item: any) => ({
        title: item.title,
        summary: item.summary,
        url: item.url,
        source: item.source,
        timestamp: item.time_published,
      }));
    } catch (error) {
      console.error('Error fetching news:', error);
      return this.getMockNews();
    }
  }

  private static getMockNews(): NewsItem[] {
    return [
      {
        title: 'Market Update: Economic Indicators Show Strength',
        summary: 'Latest economic data suggests positive momentum in global markets.',
        url: '#',
        source: 'Mock News',
        timestamp: new Date().toISOString(),
      },
      {
        title: 'Currency Fluctuations Impact Trading',
        summary: 'Recent volatility in forex pairs affects trading strategies.',
        url: '#',
        source: 'Mock News',
        timestamp: new Date().toISOString(),
      },
    ];
  }
}