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

function getLiveRuleBasedAnalysis(price, pair) {
  const p = Number(price);
  const scale = pair === 'BTCUSD' ? Math.max(p * 0.01, 100) : pair === 'XAUUSD' ? 8 : Math.max(p * 0.002, 0.002);
  const ma50 = p - scale * 1.5;
  const ma200 = p - scale * 3;
  const trendUp = p > ma200;
  const rsi = trendUp ? 56 : 44;

  return {
    bias: trendUp ? 'Bullish' : 'Bearish',
    confidence: 58,
    risk: 'Medium',
    rsi,
    rsi_label: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
    ma50: Number(ma50.toFixed(5)),
    ma200: Number(ma200.toFixed(5)),
    atr: Number((scale * 2.2).toFixed(5)),
    support: Number((p - scale * 2).toFixed(5)),
    resistance: Number((p + scale * 2).toFixed(5)),
    dxy: { value: 'Live feed unavailable', direction: 'Unknown', signal: 'Neutral' },
    yield10y: { value: 'Live feed unavailable', direction: 'Unknown', signal: 'Neutral' },
    inflation: { trend: 'Unknown', signal: 'Neutral' },
    fed: { outlook: 'Unknown', signal: 'Neutral' },
    sentiment: { news: 'No verified live news feed configured', risk_mode: 'Mixed', signal: 'Neutral' },
    volume: { trend: 'Unknown', signal: 'Neutral' },
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
      `Price is ${trendUp ? 'above' : 'below'} MA200 proxy, indicating ${trendUp ? 'uptrend' : 'downtrend'} bias.`,
      'AI/news confirmation unavailable; this is technical fallback from live price only.',
      'Use independent news verification before executing trades.',
      'Apply strict risk management due reduced macro/news context.',
    ],
    summary: `Live price received for ${pair}. AI/news confirmation unavailable, so this output is a rule-based technical fallback from real-time price only.`,
    conviction_breakdown: [
      { name: 'Technical', pct: 58, color: 'green' },
      { name: 'Macro', pct: 30, color: 'red' },
      { name: 'Sentiment', pct: 25, color: 'red' },
      { name: 'Risk', pct: 55, color: 'gold' },
    ],
  };
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
  try {
    const pairLabel = PAIR_LABELS[pair] || pair;
    const apiKey = process.env.VITE_OPENAI_API_KEY;

    console.log('API Key present:', !!apiKey);
    if (!apiKey) {
      if (!Number.isFinite(Number(price))) {
        return res.status(503).json({ error: 'Live analysis unavailable: missing live price and OpenAI key.' });
      }
      console.log('OpenAI key missing, returning live rule-based analysis');
      return res.json(getLiveRuleBasedAnalysis(Number(price), pair));
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const prompt = `You are a professional macro and forex analyst. Today is ${today}. The current ${pair} (${pairLabel}) spot price is $${price ? Number(price).toFixed(5) : 'unknown'}.

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
    res.json(analysis);

  } catch (error) {
    console.error('Analysis error:', error);
    if (Number.isFinite(Number(price))) {
      const liveRuleBased = getLiveRuleBasedAnalysis(Number(price), pair);
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
