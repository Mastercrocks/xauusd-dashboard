# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key

### Step 3: Set Up Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

2. Open `.env` and add your API key:
   ```
   VITE_OPENAI_API_KEY=sk-your-key-here
   VITE_ALPHA_VANTAGE_API_KEY=your_key_here
   VITE_FINNHUB_API_KEY=your_key_here
   ```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open Dashboard
Visit `http://localhost:5173` in your browser

## 📊 Using the Dashboard

1. **View Market Data**: Check current XAUUSD price and technical indicators
2. **Click "Refresh Analysis"**: Run AI analysis to get trading signals
3. **Review Results**:
   - Market Bias (Bullish/Bearish/Neutral)
   - Confidence Score (1-100%)
   - Risk Level (Low/Medium/High)
   - Key reasons for the analysis
   - Trading recommendations with entry/exit points

## 🔑 Getting API Keys

### OpenAI (Required)
- Visit: https://platform.openai.com/api-keys
- Create account or log in
- Generate new secret key
- Add to `.env` as `VITE_OPENAI_API_KEY`

### Alpha Vantage (Optional - for real market data)
- Visit: https://www.alphavantage.co/
- Sign up for free API key
- Add to `.env` as `VITE_ALPHA_VANTAGE_API_KEY`

### Finnhub (Optional - for sentiment data)
- Visit: https://finnhub.io/
- Create account
- Get API key
- Add to `.env` as `VITE_FINNHUB_API_KEY`

## 🔧 Common Issues & Solutions

### "Error: apikey is undefined"
**Solution**: Check that your `.env` file has the correct API key with proper naming

### "Failed to parse market analysis"
**Solution**: 
- Verify API key is valid at https://platform.openai.com/account/billing/overview
- Ensure you have API credits
- Check that your request is under rate limits

### Dashboard not loading
**Solution**:
- Check browser console (F12 → Console tab)
- Make sure npm dev server is running
- Try `npm run dev` again

### Port 5173 already in use
**Solution**:
```bash
# Kill the process using port 5173 or use different port
npm run dev -- --port 5174
```

## 📈 Understanding the Analysis

### Market Bias
- **Bullish**: Price likely to go UP
- **Bearish**: Price likely to go DOWN
- **Neutral**: Mixed signals, uncertain direction

### Confidence Score
- 80-100%: Very strong signal, high probability
- 60-79%: Good signal, likely to work
- 40-59%: Weak signal, use caution
- Below 40%: Poor signal, avoid trading

### Risk Level
- **Low**: Risk/reward ratio is favorable
- **Medium**: Balanced risk and reward
- **High**: Significant risk, use smaller positions

### Trade Idea
- **Buy**: Go LONG - expect upward movement
- **Sell**: Go SHORT - expect downward movement
- **Wait**: Not enough conviction, wait for clearer signal

## 💡 Trading Tips

1. **Never skip the stop loss** - Always have an exit plan
2. **Risk only 1-2% per trade** - Use position sizing calculator
3. **Confirm across timeframes** - Check 1H, 4H, Daily trends
4. **Watch the news** - Major economic events impact gold
5. **Keep records** - Track all trades for improvement
6. **Be patient** - Not every signal should be traded

## 📊 Technical Indicators Explained

- **RSI (Relative Strength Index)**
  - > 70: Overbought (potential reversal down)
  - < 30: Oversold (potential reversal up)
  - 30-70: Neutral zone

- **MA50 (50-Period Moving Average)**
  - Price above: Bullish
  - Price below: Bearish

- **MA200 (200-Period Moving Average)**
  - Most important trend indicator
  - Price above: Long-term bullish
  - Price below: Long-term bearish

- **ATR (Average True Range)**
  - Measures volatility
  - Higher ATR: More volatile (wider stops needed)
  - Lower ATR: Less volatile (tighter stops possible)

## 🌍 What Drives Gold (XAUUSD) Prices

**Bullish for Gold (Pushes price UP):**
- 📉 Weak US Dollar
- 📉 Falling interest rates
- 📈 Rising inflation
- 😟 Economic uncertainty
- 📊 Risk-off sentiment

**Bearish for Gold (Pushes price DOWN):**
- 📈 Strong US Dollar
- 📈 Rising interest rates
- 💪 Economic strength
- 😊 Positive sentiment
- 📊 Risk-on sentiment

## 🚀 Next Steps

- [ ] Configure your API keys
- [ ] Run your first analysis
- [ ] Paper trade using the signals
- [ ] Keep a trading journal
- [ ] Review and improve
- [ ] Scale up when comfortable

---

**Happy Trading! Remember: Past performance ≠ Future results. Always manage risk!**
