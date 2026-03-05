import axios from 'axios';
import { NewsItem } from '../types';

const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

export class NewsService {
  private static cache = new Map<string, { data: NewsItem[]; timestamp: number }>();
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static async getLatestNews(pair: string = 'forex'): Promise<NewsItem[]> {
    const cacheKey = `news_${pair}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

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

      const newsData = feed.slice(0, 5).map((item: any) => ({
        title: item.title,
        summary: item.summary,
        url: item.url,
        source: item.source,
        timestamp: item.time_published,
      }));

      this.cache.set(cacheKey, { data: newsData, timestamp: Date.now() });
      return newsData;
    } catch (error) {
      console.error('Error fetching news:', error);
      const mockData = this.getMockNews();
      this.cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return mockData;
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