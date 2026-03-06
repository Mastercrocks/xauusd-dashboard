import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const ALPHA_VANTAGE_KEY = process.env.VITE_ALPHA_VANTAGE_API_KEY;

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

// API endpoint for price fetching
app.get('/api/price', async (req, res) => {
  try {
    const pair = String(req.query.pair || 'XAUUSD').toUpperCase();
    console.log('Price request received for pair:', pair);

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
      return res.json({ price: getMockPriceForPair(pair), source: 'mock', pair });
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

    // Last fallback: mock price
    console.log('All price APIs failed, returning mock price');
    res.json({ price: getMockPriceForPair(pair), source: 'mock', pair });

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
      console.log('OpenAI key missing, returning mock analysis');
      return res.json(getMockAnalysis(price, pair));
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
    const mockAnalysis = getMockAnalysis(price, pair);
    console.log('Returning mock analysis due to error');
    res.json(mockAnalysis);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(port, () => {
  console.log(`Serving static site on port ${port}`);
});
