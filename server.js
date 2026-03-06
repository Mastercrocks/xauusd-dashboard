import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const ALPHA_VANTAGE_KEY = process.env.VITE_ALPHA_VANTAGE_API_KEY;
const ALLOW_MOCK_FALLBACK = process.env.ALLOW_MOCK_FALLBACK === 'true';

const PAIR_BASE_PRICES = {
  XAUUSD: 2150,
  EURUSD: 1.08,
  GBPUSD: 1.27,
  USDJPY: 150.0,
  AUDUSD: 0.66,
  BTCUSD: 62000,
  NZDUSD: 0.61,
  USDCAD: 1.35,
};

const PAIR_LABELS = {
  XAUUSD: 'Gold Spot vs US Dollar',
  EURUSD: 'Euro vs US Dollar',
  GBPUSD: 'British Pound vs US Dollar',
  USDJPY: 'US Dollar vs Japanese Yen',
  AUDUSD: 'Australian Dollar vs US Dollar',
  BTCUSD: 'Bitcoin vs US Dollar',
  NZDUSD: 'New Zealand Dollar vs US Dollar',
  USDCAD: 'US Dollar vs Canadian Dollar',
};

const PAIR_YAHOO_SYMBOLS = {
  XAUUSD: 'XAUUSD=X',
  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'USDJPY=X',
  AUDUSD: 'AUDUSD=X',
  BTCUSD: 'BTC-USD',
  NZDUSD: 'NZDUSD=X',
  USDCAD: 'USDCAD=X',
};

const NEWS_QUERY_BY_PAIR = {
  XAUUSD: 'gold price OR XAUUSD OR treasury yields OR dollar index',
  EURUSD: 'EURUSD OR euro dollar OR ECB OR Federal Reserve',
  GBPUSD: 'GBPUSD OR pound dollar OR Bank of England OR Federal Reserve',
  USDJPY: 'USDJPY OR yen dollar OR Bank of Japan OR US yields',
  AUDUSD: 'AUDUSD OR Australian dollar OR RBA OR China economy',
  BTCUSD: 'bitcoin price OR BTCUSD OR crypto market OR ETF flows',
  NZDUSD: 'NZDUSD OR New Zealand dollar OR RBNZ OR risk sentiment',
  USDCAD: 'USDCAD OR Canadian dollar OR Bank of Canada OR oil prices',
};

const POSITIVE_NEWS_TERMS = [
  'rally',
  'surge',
  'gains',
  'dovish',
  'rate cut',
  'easing',
  'weaker dollar',
  'yield falls',
  'beats estimates',
  'safe-haven demand',
];

const NEGATIVE_NEWS_TERMS = [
  'selloff',
  'falls',
  'drop',
  'hawkish',
  'higher yields',
  'strong dollar',
  'tightening',
  'misses estimates',
  'rate hike',
  'risk-on equities',
];

const RISK_OFF_TERMS = [
  'war',
  'geopolitical',
  'recession',
  'uncertainty',
  'risk-off',
  'market stress',
  'banking stress',
  'conflict',
];

const RISK_ON_TERMS = [
  'risk-on',
  'stocks rally',
  'equity gains',
  'optimism',
  'soft landing',
  'strong earnings',
];

const LIVE_CONTEXT_CACHE = new Map();
const LIVE_CONTEXT_TTL_MS = 90 * 1000;

function withTimeout(ms = 8000) {
  return AbortSignal.timeout(ms);
}

app.use(express.static(path.join(process.cwd())));
app.use(express.json());

function getMockPriceForPair(pair) {
  const base = PAIR_BASE_PRICES[pair] || PAIR_BASE_PRICES.XAUUSD;
  const jitterPct = pair === 'BTCUSD' ? 0.01 : pair === 'XAUUSD' ? 0.003 : 0.0015;
  const price = base * (1 + (Math.random() - 0.5) * jitterPct * 2);
  return Number(price.toFixed(pair === 'BTCUSD' || pair === 'XAUUSD' ? 2 : 5));
}

async function fetchYahooQuote(pair) {
  const symbol = PAIR_YAHOO_SYMBOLS[pair] || PAIR_YAHOO_SYMBOLS.XAUUSD;
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const response = await fetch(url, {
    signal: withTimeout(5000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json,text/plain,*/*',
    },
  });
  if (!response.ok) {
    throw new Error(`Yahoo quote status ${response.status}`);
  }

  const data = await response.json();
  const quote = data?.quoteResponse?.result?.[0];
  const price = Number.parseFloat(quote?.regularMarketPrice);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Yahoo quote missing regularMarketPrice');
  }

  return {
    price,
    pair,
    source: 'yahoo',
    dayLow: Number.parseFloat(quote?.regularMarketDayLow),
    dayHigh: Number.parseFloat(quote?.regularMarketDayHigh),
    previousClose: Number.parseFloat(quote?.regularMarketPreviousClose),
    changePercent: Number.parseFloat(quote?.regularMarketChangePercent),
  };
}

async function fetchStooqQuote(pair) {
  const stooqSymbol = pair.toLowerCase();
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
  const response = await fetch(url, {
    signal: withTimeout(5000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!response.ok) {
    throw new Error(`Stooq status ${response.status}`);
  }

  const text = (await response.text()).trim();
  // Format: SYMBOL,DATE,TIME,OPEN,HIGH,LOW,CLOSE,VOLUME,
  const parts = text.split(',');
  const close = Number.parseFloat(parts[6]);
  const low = Number.parseFloat(parts[5]);
  const high = Number.parseFloat(parts[4]);

  if (!Number.isFinite(close) || close <= 0) {
    throw new Error('Stooq missing close price');
  }

  return {
    price: close,
    pair,
    source: 'stooq',
    dayLow: Number.isFinite(low) ? low : undefined,
    dayHigh: Number.isFinite(high) ? high : undefined,
  };
}

async function fetchExchangeRatePrice(pair) {
  const response = await fetch('https://open.er-api.com/v6/latest/USD', {
    signal: withTimeout(5000),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ExchangeRate status ${response.status}`);
  }

  const data = await response.json();
  const rates = data?.rates;
  if (!rates) {
    throw new Error('ExchangeRate response missing rates');
  }

  const base = pair.slice(0, 3);
  const quote = pair.slice(3, 6);
  const usdToBase = Number.parseFloat(rates[base]);
  const usdToQuote = Number.parseFloat(rates[quote]);

  if (!Number.isFinite(usdToQuote) || usdToQuote <= 0) {
    throw new Error(`ExchangeRate missing quote ${quote}`);
  }

  let price;
  if (base === 'USD') {
    price = usdToQuote;
  } else if (quote === 'USD') {
    if (!Number.isFinite(usdToBase) || usdToBase <= 0) {
      throw new Error(`ExchangeRate missing base ${base}`);
    }
    price = 1 / usdToBase;
  } else {
    if (!Number.isFinite(usdToBase) || usdToBase <= 0) {
      throw new Error(`ExchangeRate missing base ${base}`);
    }
    price = usdToQuote / usdToBase;
  }

  return {
    price,
    pair,
    source: 'open.er-api',
  };
}

async function fetchCoingeckoBtcUsd() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
    signal: withTimeout(5000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`CoinGecko status ${response.status}`);
  }

  const data = await response.json();
  const price = Number.parseFloat(data?.bitcoin?.usd);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('CoinGecko missing BTC price');
  }

  return {
    price,
    pair: 'BTCUSD',
    source: 'coingecko',
  };
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseStooqLine(csvLine) {
  const parts = csvLine.trim().split(',');
  if (parts.length < 7) {
    throw new Error('Invalid Stooq format');
  }

  const open = Number.parseFloat(parts[3]);
  const high = Number.parseFloat(parts[4]);
  const low = Number.parseFloat(parts[5]);
  const close = Number.parseFloat(parts[6]);

  if (!Number.isFinite(close) || close <= 0) {
    throw new Error('Stooq close price unavailable');
  }

  return {
    open,
    high,
    low,
    close,
  };
}

async function fetchStooqSymbol(symbol) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const response = await fetch(url, {
    signal: withTimeout(5000),
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!response.ok) {
    throw new Error(`Stooq status ${response.status}`);
  }

  const line = (await response.text()).trim();
  return parseStooqLine(line);
}

async function fetchFredSeries(seriesId, takeLast = 3) {
  const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`, {
    signal: withTimeout(7000),
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) {
    throw new Error(`FRED ${seriesId} status ${response.status}`);
  }

  const csv = await response.text();
  const lines = csv.split(/\r?\n/).slice(1);
  const values = [];

  for (const line of lines) {
    if (!line) continue;
    const [date, raw] = line.split(',');
    const value = Number.parseFloat(raw);
    if (Number.isFinite(value)) {
      values.push({ date, value });
    }
  }

  if (values.length < 2) {
    throw new Error(`FRED ${seriesId} has insufficient data`);
  }

  return values.slice(-takeLast);
}

function classifyDirection(current, previous, pctThreshold = 0.2) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 'Flat';
  }

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (pct > pctThreshold) {
    return 'Rising';
  }
  if (pct < -pctThreshold) {
    return 'Falling';
  }
  return 'Flat';
}

function classifySignalFromDirection(direction, bullishOnRising = false) {
  if (direction === 'Rising') {
    return bullishOnRising ? 'Bullish' : 'Bearish';
  }
  if (direction === 'Falling') {
    return bullishOnRising ? 'Bearish' : 'Bullish';
  }
  return 'Neutral';
}

function extractRssItems(xml, limit = 8) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = regex.exec(xml)) && items.length < limit) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
    const rawTitle = titleMatch?.[1] || titleMatch?.[2] || '';
    if (!rawTitle) continue;

    const cleanTitle = decodeHtmlEntities(rawTitle)
      .replace(/\s+-\s+[^-]+$/, '')
      .trim();

    if (!cleanTitle) continue;

    items.push({
      title: cleanTitle,
      publishedAt: pubDateMatch?.[1] || '',
    });
  }

  return items;
}

function summarizeNewsAndSentiment(headlines, pair) {
  if (!headlines.length) {
    return {
      sentiment: { news: 'No recent verified headlines found', risk_mode: 'Mixed', signal: 'Neutral' },
      headlineSummary: [],
      sentimentLabel: 'Mixed',
      sentimentScore: 0,
    };
  }

  const joined = headlines.map((h) => h.title.toLowerCase()).join(' | ');
  let score = 0;

  for (const term of POSITIVE_NEWS_TERMS) {
    if (joined.includes(term)) score += 1;
  }
  for (const term of NEGATIVE_NEWS_TERMS) {
    if (joined.includes(term)) score -= 1;
  }

  const sentimentLabel = score >= 2 ? 'Bullish' : score <= -2 ? 'Bearish' : 'Mixed';
  const hasRiskOff = RISK_OFF_TERMS.some((term) => joined.includes(term));
  const hasRiskOn = RISK_ON_TERMS.some((term) => joined.includes(term));
  const riskMode = hasRiskOff ? 'Risk-Off' : hasRiskOn ? 'Risk-On' : 'Mixed';

  let signal = 'Neutral';
  if (pair === 'XAUUSD') {
    signal = sentimentLabel === 'Bullish' ? 'Bullish' : sentimentLabel === 'Bearish' ? 'Bearish' : 'Neutral';
  } else {
    signal = sentimentLabel === 'Bullish' ? 'Bullish' : sentimentLabel === 'Bearish' ? 'Bearish' : 'Neutral';
  }

  const shortNews = headlines.slice(0, 2).map((h) => h.title).join(' | ');

  return {
    sentiment: {
      news: shortNews,
      risk_mode: riskMode,
      signal,
    },
    headlineSummary: headlines.slice(0, 5),
    sentimentLabel,
    sentimentScore: score,
  };
}

async function fetchLiveNews(pair) {
  const query = NEWS_QUERY_BY_PAIR[pair] || `${pair} forex macro`; 
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(url, {
    signal: withTimeout(7000),
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`News RSS status ${response.status}`);
  }

  const xml = await response.text();
  return extractRssItems(xml, 8);
}

async function fetchLiveMacroContext(pair) {
  const cacheKey = `live_ctx_${pair}`;
  const cached = LIVE_CONTEXT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LIVE_CONTEXT_TTL_MS) {
    return cached.data;
  }

  const fallbackContext = {
    dxy: { value: 'Unavailable', direction: 'Unknown', signal: 'Neutral' },
    yield10y: { value: 'Unavailable', direction: 'Unknown', signal: 'Neutral' },
    inflation: { trend: 'Unknown', signal: 'Neutral' },
    fed: { outlook: 'Unknown', signal: 'Neutral' },
    sentiment: { news: 'No recent verified headlines found', risk_mode: 'Mixed', signal: 'Neutral' },
    volume: { trend: 'Unavailable', signal: 'Neutral' },
    headlines: [],
    sourceHealth: {
      dxy: false,
      yield10y: false,
      inflation: false,
      fed: false,
      news: false,
    },
  };

  const tasks = await Promise.allSettled([
    fetchStooqSymbol('dx.f'),
    fetchFredSeries('DGS10', 3),
    fetchFredSeries('CPIAUCSL', 3),
    fetchFredSeries('FEDFUNDS', 3),
    fetchLiveNews(pair),
  ]);

  if (tasks[0].status === 'fulfilled') {
    const dxy = tasks[0].value;
    const dxyDirection = classifyDirection(dxy.close, dxy.open, 0.05);
    fallbackContext.dxy = {
      value: dxy.close.toFixed(3),
      direction: dxyDirection,
      signal: classifySignalFromDirection(dxyDirection, false),
    };
    fallbackContext.sourceHealth.dxy = true;
  }

  if (tasks[1].status === 'fulfilled') {
    const values = tasks[1].value;
    const latest = values[values.length - 1].value;
    const previous = values[values.length - 2].value;
    const direction = classifyDirection(latest, previous, 0.25);
    fallbackContext.yield10y = {
      value: `${latest.toFixed(2)}%`,
      direction,
      signal: classifySignalFromDirection(direction, false),
    };
    fallbackContext.sourceHealth.yield10y = true;
  }

  if (tasks[2].status === 'fulfilled') {
    const values = tasks[2].value;
    const latest = values[values.length - 1].value;
    const previous = values[values.length - 2].value;
    const mom = ((latest - previous) / previous) * 100;
    const trend = mom > 0.15 ? 'Rising' : mom < -0.05 ? 'Falling' : 'Stable';
    const signal = trend === 'Rising' ? 'Bullish' : trend === 'Falling' ? 'Bearish' : 'Neutral';
    fallbackContext.inflation = {
      trend: `${trend} (${mom.toFixed(2)}% MoM)`,
      signal,
    };
    fallbackContext.sourceHealth.inflation = true;
  }

  if (tasks[3].status === 'fulfilled') {
    const values = tasks[3].value;
    const latest = values[values.length - 1].value;
    const previous = values[values.length - 2].value;
    const delta = latest - previous;
    let outlook = 'Holding steady';
    let signal = 'Neutral';

    if (delta >= 0.05) {
      outlook = 'Tightening bias';
      signal = 'Bearish';
    } else if (delta <= -0.05) {
      outlook = 'Easing bias';
      signal = 'Bullish';
    }

    fallbackContext.fed = {
      outlook: `${outlook} (${latest.toFixed(2)}%)`,
      signal,
    };
    fallbackContext.sourceHealth.fed = true;
  }

  if (tasks[4].status === 'fulfilled') {
    const headlines = tasks[4].value;
    const summary = summarizeNewsAndSentiment(headlines, pair);
    fallbackContext.sentiment = summary.sentiment;
    fallbackContext.headlines = summary.headlineSummary;
    fallbackContext.sourceHealth.news = true;
  }

  fallbackContext.volume = {
    trend: fallbackContext.sourceHealth.news ? 'Normal' : 'Unavailable',
    signal: 'Neutral',
  };

  LIVE_CONTEXT_CACHE.set(cacheKey, {
    timestamp: Date.now(),
    data: fallbackContext,
  });

  return fallbackContext;
}

function getMockAnalysis(price, pair) {
  const p = Number(price || getMockPriceForPair(pair));
  const scale = pair === 'BTCUSD' ? 250 : pair === 'XAUUSD' ? 8 : 0.003;

  return {
    bias: 'Neutral',
    confidence: 60,
    risk: 'Medium',
    rsi: 52,
    rsi_label: 'Neutral',
    ma50: Number((p - scale * 2).toFixed(5)),
    ma200: Number((p - scale * 5).toFixed(5)),
    atr: Number((scale * 2.5).toFixed(5)),
    support: Number((p - scale * 3).toFixed(5)),
    resistance: Number((p + scale * 3).toFixed(5)),
    dxy: { value: '102.3', direction: 'Flat', signal: 'Neutral' },
    yield10y: { value: '4.15%', direction: 'Flat', signal: 'Neutral' },
    inflation: { trend: 'Stable', signal: 'Neutral' },
    fed: { outlook: 'Monitoring data', signal: 'Neutral' },
    sentiment: { news: 'Market digesting recent data', risk_mode: 'Mixed', signal: 'Neutral' },
    volume: { trend: 'Normal', signal: 'Neutral' },
    trade: {
      direction: 'WAIT',
      entry_low: Number((p - scale).toFixed(5)),
      entry_high: Number((p + scale).toFixed(5)),
      stop_loss: Number((p - scale * 2).toFixed(5)),
      tp1: Number((p + scale * 2).toFixed(5)),
      tp2: Number((p + scale * 4).toFixed(5)),
      rr: '1:1',
    },
    reasons: [
      `${pair} is in a consolidation phase with mixed momentum signals.`,
      'No clear macro catalyst is dominating current price action.',
      'Risk-reward is average until a breakout confirms direction.',
      'Volatility is moderate; tighter risk management is advised.',
      'Monitor support and resistance for a directional trigger.',
    ],
    summary: `${pair} currently shows neutral structure with balanced risks. Wait for clearer trend confirmation before directional exposure.`,
    conviction_breakdown: [
      { name: 'Technical', pct: 50, color: 'gold' },
      { name: 'Macro', pct: 55, color: 'gold' },
      { name: 'Sentiment', pct: 45, color: 'red' },
      { name: 'Risk', pct: 60, color: 'green' },
    ],
  };
}

function getLiveRuleBasedAnalysis(price, pair, liveContext) {
  const p = Number(price);
  const ctx = liveContext || {
    dxy: { value: 'Unavailable', direction: 'Unknown', signal: 'Neutral' },
    yield10y: { value: 'Unavailable', direction: 'Unknown', signal: 'Neutral' },
    inflation: { trend: 'Unknown', signal: 'Neutral' },
    fed: { outlook: 'Unknown', signal: 'Neutral' },
    sentiment: { news: 'No recent verified headlines found', risk_mode: 'Mixed', signal: 'Neutral' },
    volume: { trend: 'Unavailable', signal: 'Neutral' },
    headlines: [],
  };

  const scale = pair === 'BTCUSD' ? Math.max(p * 0.01, 100) : pair === 'XAUUSD' ? 8 : Math.max(p * 0.002, 0.002);

  const macroScore =
    (ctx.dxy.signal === 'Bullish' ? 1 : ctx.dxy.signal === 'Bearish' ? -1 : 0) +
    (ctx.yield10y.signal === 'Bullish' ? 1 : ctx.yield10y.signal === 'Bearish' ? -1 : 0) +
    (ctx.inflation.signal === 'Bullish' ? 1 : ctx.inflation.signal === 'Bearish' ? -1 : 0) +
    (ctx.fed.signal === 'Bullish' ? 1 : ctx.fed.signal === 'Bearish' ? -1 : 0) +
    (ctx.sentiment.signal === 'Bullish' ? 1 : ctx.sentiment.signal === 'Bearish' ? -1 : 0);

  const trendUp = macroScore >= 0;
  const ma50 = p * (trendUp ? 0.999 : 1.001);
  const ma200 = p * (trendUp ? 0.998 : 1.002);
  const rsi = trendUp ? 56 : 44;
  const confidence = Math.min(72, Math.max(48, 55 + macroScore * 3));
  const risk = ctx.volume.trend === 'Unavailable' ? 'High' : 'Medium';

  const headlines = (ctx.headlines || []).slice(0, 2).map((h) => h.title);

  return {
    bias: trendUp ? 'Bullish' : 'Bearish',
    confidence,
    risk,
    rsi,
    rsi_label: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
    ma50: Number(ma50.toFixed(5)),
    ma200: Number(ma200.toFixed(5)),
    atr: Number((scale * 2.2).toFixed(5)),
    support: Number((p - scale * 2).toFixed(5)),
    resistance: Number((p + scale * 2).toFixed(5)),
    dxy: ctx.dxy,
    yield10y: ctx.yield10y,
    inflation: ctx.inflation,
    fed: ctx.fed,
    sentiment: ctx.sentiment,
    volume: ctx.volume,
    trade: {
      direction: trendUp ? 'BUY' : 'SELL',
      entry_low: Number((p - scale * 0.4).toFixed(5)),
      entry_high: Number((p + scale * 0.4).toFixed(5)),
      stop_loss: Number((p - (trendUp ? 1 : -1) * scale * 1.6).toFixed(5)),
      tp1: Number((p + (trendUp ? 1 : -1) * scale * 1.6).toFixed(5)),
      tp2: Number((p + (trendUp ? 1 : -1) * scale * 3.2).toFixed(5)),
      rr: '1:2',
    },
    reasons: [
      `Rule-based analysis derived from live ${pair} spot price ${p.toFixed(5)}.`,
      `DXY is ${ctx.dxy.direction} (${ctx.dxy.value}) and US10Y is ${ctx.yield10y.direction} (${ctx.yield10y.value}).`,
      `Inflation trend: ${ctx.inflation.trend}; Fed: ${ctx.fed.outlook}.`,
      headlines[0] ? `Headline: ${headlines[0]}` : 'No verified headline available in current window.',
      headlines[1] ? `Headline: ${headlines[1]}` : 'AI confirmation unavailable, using live macro + technical rules.',
    ],
    summary: `Live price and macro/news context received for ${pair}. AI generation unavailable, so this output uses live-data rule logic.`,
    conviction_breakdown: [
      { name: 'Technical', pct: 58, color: trendUp ? 'green' : 'red' },
      { name: 'Macro', pct: Math.min(75, Math.max(35, 50 + macroScore * 5)), color: macroScore >= 0 ? 'green' : 'red' },
      { name: 'Sentiment', pct: ctx.sentiment.signal === 'Neutral' ? 50 : 62, color: ctx.sentiment.signal === 'Bullish' ? 'green' : ctx.sentiment.signal === 'Bearish' ? 'red' : 'gold' },
      { name: 'Risk', pct: risk === 'High' ? 45 : 60, color: risk === 'High' ? 'red' : 'green' },
    ],
  };
}

function mergeAnalysisWithLiveContext(analysis, liveContext) {
  const merged = {
    ...analysis,
    dxy: liveContext.dxy,
    yield10y: liveContext.yield10y,
    inflation: liveContext.inflation,
    fed: liveContext.fed,
    sentiment: liveContext.sentiment,
    volume: liveContext.volume,
  };

  if (!Array.isArray(merged.reasons)) {
    merged.reasons = [];
  }

  if ((liveContext.headlines || []).length) {
    merged.reasons = [
      ...merged.reasons,
      `Headline: ${liveContext.headlines[0].title}`,
    ].slice(0, 5);
  }

  return merged;
}

// API endpoint for price fetching
app.get('/api/price', async (req, res) => {
  try {
    const pair = String(req.query.pair || 'XAUUSD').toUpperCase();
    console.log('Price request received for pair:', pair);

    try {
      const yahooQuote = await fetchYahooQuote(pair);
      return res.json(yahooQuote);
    } catch (e) {
      console.log('Yahoo quote failed for pair', pair, e.message);
    }

    if (pair === 'BTCUSD') {
      try {
        const btcQuote = await fetchCoingeckoBtcUsd();
        return res.json(btcQuote);
      } catch (e) {
        console.log('CoinGecko failed for BTCUSD', e.message);
      }
    }

    if (pair !== 'XAUUSD' && pair !== 'BTCUSD') {
      try {
        const fxQuote = await fetchExchangeRatePrice(pair);
        return res.json(fxQuote);
      } catch (e) {
        console.log('ExchangeRate failed for pair', pair, e.message);
      }
    }

    try {
      const stooqQuote = await fetchStooqQuote(pair);
      return res.json(stooqQuote);
    } catch (e) {
      console.log('Stooq quote failed for pair', pair, e.message);
    }

    if (pair !== 'XAUUSD' && ALPHA_VANTAGE_KEY) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(pair)}&apikey=${ALPHA_VANTAGE_KEY}`,
          { signal: withTimeout(5000) }
        );
        if (response.ok) {
          const data = await response.json();
          const quote = data?.['Global Quote'];
          const parsed = Number.parseFloat(quote?.['05. price']);
          if (Number.isFinite(parsed) && parsed > 0) {
            return res.json({ price: parsed, source: 'alphavantage', pair });
          }
        }
      } catch (e) {
        console.log('Alpha Vantage failed for pair', pair, e.message);
      }
    }

    if (pair !== 'XAUUSD') {
      if (ALLOW_MOCK_FALLBACK) {
        return res.json({ price: getMockPriceForPair(pair), source: 'mock', pair });
      }
      return res.status(503).json({ error: `Live price unavailable for ${pair}`, pair, source: 'none' });
    }

    // Try multiple free endpoints
    const endpoints = [
      'https://api.metals.live/v1/spot/gold',
      'https://data-asg.goldprice.org/dbXRates/USD',
    ];

    // Primary: metals.live
    try {
      const response = await fetch('https://api.metals.live/v1/spot/gold', {
        signal: withTimeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].price) {
          console.log('Price fetched from metals.live:', data[0].price);
          return res.json({ price: data[0].price, source: 'metals.live', pair });
        }
      }
    } catch(e) {
      console.log('metals.live failed:', e.message);
    }

    // Fallback: goldprice.org
    try {
      const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
        signal: withTimeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.items && data.items[0]) {
          console.log('Price fetched from goldprice.org:', data.items[0].xauPrice);
          return res.json({ price: data.items[0].xauPrice, source: 'goldprice.org', pair });
        }
      }
    } catch(e) {
      console.log('goldprice.org failed:', e.message);
    }

    if (ALLOW_MOCK_FALLBACK) {
      console.log('All price APIs failed, returning mock price');
      return res.json({ price: getMockPriceForPair(pair), source: 'mock', pair });
    }

    res.status(503).json({ error: `Live price unavailable for ${pair}`, pair, source: 'none' });

  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for AI analysis
app.post('/api/analysis', async (req, res) => {
  console.log('Analysis request received:', req.body);
  const price = req.body?.price;
  const pair = String(req.body?.pair || 'XAUUSD').toUpperCase();
  const numericPrice = Number(price);
  let liveContext = {
    dxy: { value: 'Unavailable', direction: 'Unknown', signal: 'Neutral' },
    yield10y: { value: 'Unavailable', direction: 'Unknown', signal: 'Neutral' },
    inflation: { trend: 'Unknown', signal: 'Neutral' },
    fed: { outlook: 'Unknown', signal: 'Neutral' },
    sentiment: { news: 'No recent verified headlines found', risk_mode: 'Mixed', signal: 'Neutral' },
    volume: { trend: 'Unavailable', signal: 'Neutral' },
    headlines: [],
  };

  try {
    const pairLabel = PAIR_LABELS[pair] || pair;
    liveContext = await fetchLiveMacroContext(pair);
    const apiKey = process.env.VITE_OPENAI_API_KEY;

    console.log('API Key present:', !!apiKey);
    if (!apiKey) {
      if (!Number.isFinite(numericPrice)) {
        return res.status(503).json({ error: 'Live analysis unavailable: missing live price and OpenAI key.' });
      }
      console.log('OpenAI key missing, returning live rule-based analysis');
      return res.json(getLiveRuleBasedAnalysis(numericPrice, pair, liveContext));
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const liveHeadlines = (liveContext.headlines || []).slice(0, 3).map((h, i) => `${i + 1}. ${h.title}`).join('\n');
    const prompt = `You are a professional macro and forex analyst. Today is ${today}. The current ${pair} (${pairLabel}) spot price is $${Number.isFinite(numericPrice) ? numericPrice.toFixed(5) : 'unknown'}.

LIVE MACRO CONTEXT (use these values as factual inputs):
- DXY: ${liveContext.dxy.value} (${liveContext.dxy.direction}, signal ${liveContext.dxy.signal})
- US10Y: ${liveContext.yield10y.value} (${liveContext.yield10y.direction}, signal ${liveContext.yield10y.signal})
- Inflation: ${liveContext.inflation.trend} (signal ${liveContext.inflation.signal})
- Fed outlook: ${liveContext.fed.outlook} (signal ${liveContext.fed.signal})
- News sentiment summary: ${liveContext.sentiment.news}
- Risk mode: ${liveContext.sentiment.risk_mode}
- Headlines:\n${liveHeadlines || 'No recent verified headlines'}

Based on your knowledge of current market conditions, provide a complete trading analysis in this EXACT JSON format (respond with ONLY the JSON, no markdown):

{
  "bias": "Bullish" or "Bearish" or "Neutral",
  "confidence": 75,
  "risk": "Medium",
  "rsi": 55,
  "rsi_label": "Neutral",
  "ma50": 5120,
  "ma200": 5100,
  "atr": 25,
  "support": 5130,
  "resistance": 5180,
  "dxy": {"value": "102.5", "direction": "Rising", "signal": "Bearish"},
  "yield10y": {"value": "4.2%", "direction": "Falling", "signal": "Bullish"},
  "inflation": {"trend": "Stable", "signal": "Neutral"},
  "fed": {"outlook": "Rate cuts expected Q2", "signal": "Bullish"},
  "sentiment": {"news": "Mixed economic data", "risk_mode": "Risk-On", "signal": "Bullish"},
  "volume": {"trend": "Normal", "signal": "Neutral"},
  "trade": {
    "direction": "BUY",
    "entry_low": 5140,
    "entry_high": 5160,
    "stop_loss": 5120,
    "tp1": 5170,
    "tp2": 5190,
    "rr": "1:2"
  },
  "reasons": [
    "DXY showing weakness which is <strong>bullish</strong> for gold",
    "US Treasury yields declining supports gold prices",
    "Federal Reserve signaling potential rate cuts",
    "Current RSI at neutral levels allows for upside",
    "Price above key moving averages indicates bullish trend"
  ],
  "summary": "Gold is showing bullish momentum with weakening dollar and declining yields. The current setup favors long positions with defined risk management. Monitor DXY closely for continued upside potential.",
  "conviction_breakdown": [
    {"name": "Technical", "pct": 70, "color": "green"},
    {"name": "Macro", "pct": 65, "color": "green"},
    {"name": "Sentiment", "pct": 60, "color": "gold"},
    {"name": "Risk", "pct": 55, "color": "red"}
  ]
}`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: withTimeout(15000),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    console.log('OpenAI response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON from response
    const clean = content.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log('Analysis parsed successfully');
    const merged = mergeAnalysisWithLiveContext(analysis, liveContext);
    res.json(merged);

  } catch (error) {
    console.error('Analysis error:', error);
    if (Number.isFinite(numericPrice)) {
      const liveRuleBased = getLiveRuleBasedAnalysis(numericPrice, pair, liveContext);
      console.log('Returning live rule-based analysis due to AI error');
      return res.json(liveRuleBased);
    }

    res.status(503).json({ error: 'Live analysis unavailable: AI failed and no live price provided.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(port, () => {
  console.log(`Serving static site on port ${port}`);
});
