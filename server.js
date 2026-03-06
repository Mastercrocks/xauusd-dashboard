import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd())));
app.use(express.json());

// API endpoint for AI analysis
app.post('/api/analysis', async (req, res) => {
  try {
    const { price } = req.body;
    const apiKey = process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const prompt = `You are a professional macro and forex analyst. Today is ${today}. The current XAUUSD spot price is $${price ? price.toFixed(2) : 'approximately 5,150-5,200'}.

Based on your knowledge of current market conditions, provide a complete trading analysis in this EXACT JSON format (respond with ONLY the JSON, no markdown):

{
  "bias": "Bullish" or "Bearish" or "Neutral",
  "confidence": number 1-100,
  "risk": "Low" or "Medium" or "High",
  "rsi": number,
  "rsi_label": "brief label e.g. Neutral / Cooling",
  "ma50": number,
  "ma200": number,
  "atr": number,
  "support": number,
  "resistance": number,
  "dxy": {"value": "e.g. 99.2", "direction": "Rising" or "Falling" or "Flat", "signal": "Bearish" or "Bullish" or "Neutral"},
  "yield10y": {"value": "e.g. 4.11%", "direction": "Rising" or "Falling" or "Flat", "signal": "Bearish" or "Bullish" or "Neutral"},
  "inflation": {"trend": "Rising" or "Falling" or "Stable", "signal": "Bullish" or "Bearish" or "Neutral"},
  "fed": {"outlook": "brief description", "signal": "Bullish" or "Bearish" or "Neutral"},
  "sentiment": {"news": "brief", "risk_mode": "Risk-Off" or "Risk-On" or "Mixed", "signal": "Bullish" or "Bearish" or "Neutral"},
  "volume": {"trend": "Elevated" or "Normal" or "Low", "signal": "Bullish" or "Bearish" or "Neutral"},
  "trade": {
    "direction": "BUY" or "SELL" or "WAIT",
    "entry_low": number,
    "entry_high": number,
    "stop_loss": number,
    "tp1": number,
    "tp2": number,
    "rr": "e.g. 1:2 to 1:4"
  },
  "reasons": [
    "reason 1 with <strong>key term</strong> tags allowed",
    "reason 2",
    "reason 3",
    "reason 4",
    "reason 5 about risks with <span class='warn'>warning text</span> if needed"
  ],
  "summary": "2-3 sentence prose summary of the overall market picture with <strong> and <span class='highlight'> or <span class='warn'> tags allowed",
  "conviction_breakdown": [
    {"name": "label", "pct": number, "color": "green" or "red" or "gold"},
    {"name": "label", "pct": number, "color": "green" or "red" or "gold"},
    {"name": "label", "pct": number, "color": "green" or "red" or "gold"},
    {"name": "label", "pct": number, "color": "green" or "red" or "gold"}
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON from response
    const clean = content.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const analysis = JSON.parse(jsonMatch[0]);
    res.json(analysis);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(port, () => {
  console.log(`Serving static site on port ${port}`);
});
