# XAUUSD AI Trade Analysis Dashboard - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Analysis Methodology](#analysis-methodology)
8. [Trading Rules](#trading-rules)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

The XAUUSD AI Trade Analysis Dashboard is a professional-grade trading analysis tool that uses artificial intelligence (ChatGPT) to evaluate gold market conditions in real-time and provide trading recommendations.

**Key Metrics Analyzed:**
- Technical Indicators (RSI, Moving Averages, ATR)
- Macroeconomic Data (USD Index, Interest Rates, Inflation)
- Market Sentiment (News, Risk Appetite, Volume)
- Multi-Timeframe Trends (1H, 4H, Daily)

**Output Provided:**
- Market Bias (Bullish/Bearish/Neutral)
- Confidence Score (1-100%)
- Risk Assessment (Low/Medium/High)
- Trading Recommendations (Buy/Sell/Wait)
- Entry/Exit Levels with Profit Targets

---

## Key Features

### 1. AI-Powered Analysis
Uses OpenAI's GPT-4 model to analyze complex market relationships and provide nuanced trading insights that go beyond simple technical analysis.

### 2. Comprehensive Market Evaluation
Combines multiple data sources:
- **Technical**: Price action, momentum, volatility
- **Macro**: Economic indicators, policy outlook
- **Sentiment**: Market psychology, risk appetite

### 3. Real-Time Dashboard
Beautiful, responsive web interface showing:
- Current market data
- Technical indicators
- AI analysis results
- Trading recommendations
- Multi-timeframe confirmation

### 4. Risk Management
Built-in risk assessment:
- Risk level classification
- Suggested position sizing
- Risk/reward ratio calculation
- Stop loss placement guidance

### 5. Multi-Timeframe Analysis
Analyzes 1-hour, 4-hour, and daily charts to ensure trades align with larger trends.

---

## Installation

### Prerequisites
- **Node.js** v16 or higher
- **npm** or **yarn** package manager
- **OpenAI API Key** (get from https://platform.openai.com/api-keys)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Verify Installation
```bash
npm run build
```

### Step 3: Set Up Environment
```bash
# Copy example env file
copy .env.example .env

# Edit .env and add your API key
VITE_OPENAI_API_KEY=sk-your-key-here
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open Dashboard
Navigate to `http://localhost:5173`

---

## Configuration

### Environment Variables

**Required:**
```env
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

**Optional (for real market data):**
```env
VITE_ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
VITE_FINNHUB_API_KEY=your-finnhub-key
```

### API Keys

#### OpenAI API
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key to `.env`
5. Ensure you have API credits: https://platform.openai.com/account/billing/overview

#### Alpha Vantage (Optional)
1. Visit https://www.alphavantage.co/
2. Sign up for free API key
3. Add to `.env` for real market data

#### Finnhub (Optional)
1. Visit https://finnhub.io/
2. Create account
3. Get API key for sentiment data

---

## Usage Guide

### Basic Workflow

1. **Open Dashboard**
   - Navigate to http://localhost:5173
   - Verify all sections load properly

2. **View Current Market Data**
   - Price, RSI, Moving Averages
   - Support/Resistance Levels
   - ATR and Volume

3. **Run AI Analysis**
   - Click "Refresh Analysis" button
   - Wait for AI to evaluate market (2-5 seconds)

4. **Review Results**
   - Check Market Bias (Bullish/Bearish/Neutral)
   - Review Confidence Score
   - Assess Risk Level
   - Read Key Reasons

5. **Implement Trade**
   - Use Entry Zone as guide
   - Place Stop Loss at suggested level
   - Set Take Profit targets
   - Use proper position sizing

### Understanding Results

#### Market Bias
- **Bullish**: Conditions favor upward movement
  - Entry: Buy on pullbacks
  - Target: Resistance levels
  
- **Bearish**: Conditions favor downward movement
  - Entry: Sell on bounces
  - Target: Support levels
  
- **Neutral**: Mixed signals, unclear direction
  - Action: Wait for clearer setup
  - Watch: Key level breakouts

#### Confidence Score
- **80-100%**: Very strong signal
  - Trade with normal position size
  - Can hold for longer moves
  
- **60-79%**: Good signal
  - Trade with normal position size
  - Use tighter stops
  
- **40-59%**: Weak signal
  - Reduce position size
  - Use very tight stops
  - Consider waiting
  
- **Below 40%**: Poor signal
  - Skip the trade
  - Wait for better setup

#### Risk Level
- **Low**: Favorable risk/reward
  - Can use full position size
  - Wider stops acceptable
  
- **Medium**: Balanced risk/reward
  - Use 60-75% position size
  - Follow suggested stops
  
- **High**: Unfavorable risk/reward
  - Use only 25-50% position size
  - Use very tight stops
  - Consider skipping

### Multi-Timeframe Analysis

**How to Use:**
1. Check Daily trend first (longest timeframe)
2. Confirm with 4H trend
3. Enter on 1H breakout

**Example:**
```
Daily: Bullish    (Strong uptrend)
4H:    Bullish    (Within daily trend)
1H:    Breakout   (Entry signal)
→ High probability buy setup
```

**Avoid:**
```
Daily: Bullish    (Uptrend)
4H:    Bearish    (Pullback)
1H:    Sell       (Counter to daily)
→ Conflicting signals, wait
```

---

## API Reference

### AIAnalysisService

```typescript
import { AIAnalysisService } from './services/aiAnalysisService';

// Analyze market
const analysis = await AIAnalysisService.analyzeMarket(
  marketData,    // MarketData object
  macroData,     // MacroData object
  sentimentData  // SentimentData object
);

// Returns: AnalysisResult
```

### MarketDataService

```typescript
import { MarketDataService } from './services/marketDataService';

// Get market data
const marketData = await MarketDataService.getMarketData();

// Get timeframe analysis
const timeframes = await MarketDataService.getTimeframeAnalysis();

// Fetch real-time data from Alpha Vantage
const realData = await MarketDataService.fetchRealTimeData('XAUUSD');
```

### MacroSentimentService

```typescript
import { MacroSentimentService } from './services/macroSentimentService';

// Get macro data
const macroData = await MacroSentimentService.getMacroData();

// Get sentiment
const sentiment = await MacroSentimentService.getSentimentData();

// Fetch DXY data
const dxyData = await MacroSentimentService.fetchDXYData();
```

### Types

```typescript
// Market Data
interface MarketData {
  price: number;
  rsi: number;
  ma50: number;
  ma200: number;
  atr: number;
  support: number;
  resistance: number;
  timestamp: string;
}

// Macro Data
interface MacroData {
  dxyDirection: 'up' | 'down' | 'neutral';
  bondYieldDirection: 'up' | 'down' | 'neutral';
  inflationTrend: 'rising' | 'falling' | 'stable';
  fedOutlook: 'hawkish' | 'dovish' | 'neutral';
}

// Sentiment Data
interface SentimentData {
  newsSentiment: 'bullish' | 'bearish' | 'neutral';
  riskSentiment: 'risk-on' | 'risk-off';
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
}

// Analysis Result
interface AnalysisResult {
  marketBias: 'Bullish' | 'Bearish' | 'Neutral';
  confidenceScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reasons: string[];
  tradeIdea: 'Buy' | 'Sell' | 'Wait';
  entryZone: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: string;
}
```

---

## Analysis Methodology

### Data Input
The AI receives the following market data:

1. **Technical Data**
   - Current price
   - RSI (momentum indicator)
   - MA50 (medium-term trend)
   - MA200 (long-term trend)
   - ATR (volatility measure)
   - Support/Resistance levels

2. **Macroeconomic Data**
   - USD Index direction
   - US 10Y Bond Yield direction
   - Inflation trend
   - Federal Reserve outlook

3. **Sentiment Data**
   - News sentiment
   - Risk sentiment (risk-on/off)
   - Volume trend

### Analysis Rules

```
IF DXY rising       → BEARISH for gold
IF DXY falling      → BULLISH for gold
IF Yields rising    → BEARISH for gold
IF Yields falling   → BULLISH for gold
IF Inflation rising → BULLISH for gold
IF Price > MA200    → BULLISH trend
IF Price < MA200    → BEARISH trend
IF RSI > 70         → OVERBOUGHT (reversal risk)
IF RSI < 30         → OVERSOLD (bounces likely)
```

### Scoring Algorithm

**Confidence Score Calculation:**
1. Count bullish signals (0-10 points)
2. Count bearish signals (0-10 points)
3. Check multi-timeframe alignment (bonus/penalty)
4. Assess macro data strength (bonus/penalty)
5. Final score = (bullish - bearish) × timeframe_alignment × macro_strength

### Output Format

AI returns structured JSON:
```json
{
  "marketBias": "Bullish",
  "confidenceScore": 76,
  "riskLevel": "Medium",
  "reasons": ["reason1", "reason2", "reason3"],
  "tradeIdea": "Buy",
  "entryZone": 2032,
  "stopLoss": 2018,
  "takeProfit": 2065
}
```

---

## Trading Rules

### Entry Rules

**For LONG (Buy) Trades:**
1. ✅ Market bias must be Bullish
2. ✅ Confidence score must be > 60%
3. ✅ Price should be near support or breaking above resistance
4. ✅ RSI not > 80 (avoid extreme overbought)
5. ✅ Volume should be increasing or stable

**For SHORT (Sell) Trades:**
1. ✅ Market bias must be Bearish
2. ✅ Confidence score must be > 60%
3. ✅ Price should be near resistance or breaking below support
4. ✅ RSI not < 20 (avoid extreme oversold)
5. ✅ Volume should be increasing or stable

**NEVER trade when:**
- ❌ Confidence score < 50%
- ❌ Major economic news is scheduled within 1 hour
- ❌ Market bias is Neutral AND timeframes disagree
- ❌ Risk level is High AND entry is not highly defined
- ❌ You've already lost 5% of account today

### Exit Rules

**Take Profit Strategy:**
1. Sell 50% at first profit target
2. Sell 30% at second target
3. Let remaining 20% run with trailing stop

**Stop Loss Strategy:**
1. Always use stops (non-negotiable)
2. Place below support (longs) / above resistance (shorts)
3. Adjust to breakeven after reaching 1:1 risk/reward
4. Trail at 20-30 pips once trend is strong

**Early Exit Signals:**
- Exit if opposite signal is generated
- Exit if major support/resistance is broken
- Exit if news creates volatility spike
- Exit if position hasn't moved in 4 hours
- Exit at time-based targets (end of day, end of week)

---

## Troubleshooting

### Issue: "Error: apikey is undefined"

**Cause**: OpenAI API key not set in .env file

**Solution**:
1. Check that .env file exists
2. Verify `VITE_OPENAI_API_KEY=sk-...` is in file
3. Restart dev server: `npm run dev`
4. Check environment variables loaded: `echo $VITE_OPENAI_API_KEY`

### Issue: "Failed to parse market analysis"

**Cause**: AI response format incorrect or API limit exceeded

**Solution**:
1. Check OpenAI account balance: https://platform.openai.com/account/billing/overview
2. Verify API key is correct and not revoked
3. Check rate limits: https://platform.openai.com/account/rate-limits
4. Try different model in code: change 'gpt-4' to 'gpt-3.5-turbo'

### Issue: Dashboard doesn't load

**Cause**: Vite server not running or build error

**Solution**:
```bash
# Kill existing process and restart
npm run dev

# Or use different port if 5173 is taken
npm run dev -- --port 5174
```

### Issue: API calls very slow

**Cause**: Normal - OpenAI API takes 2-5 seconds

**Solutions**:
- This is normal behavior for ChatGPT API
- Production solution: Cache results in database
- Implement request debouncing
- Show loading spinner while waiting

### Issue: Real market data not showing

**Cause**: Alpha Vantage API not configured

**Solution**:
1. Get free API key from https://www.alphavantage.co/
2. Add to .env: `VITE_ALPHA_VANTAGE_API_KEY=your_key`
3. Restart server
4. Currently using mock data for demo

---

## FAQ

### Q: Is this guaranteed to make me money?

**A**: No. No trading system is guaranteed profitable. This tool helps identify high-probability setups, but market is still unpredictable. Always use risk management.

### Q: What's the minimum account size?

**A**: Recommended $5,000+. You can start with less, but position sizing becomes difficult. Never risk more than 2% per trade.

### Q: How often should I use the dashboard?

**A**: 
- Intraday traders: Every 4 hours or before each trade
- Swing traders: Once daily, typically at market open
- Position traders: Once daily or every 2-3 days

### Q: Can I use this for other pairs?

**A**: Current implementation is XAUUSD-specific, but can be modified for EUR/USD, BTC/USD, etc. See code for customization points.

### Q: Is OpenAI API expensive?

**A**: No. Roughly $0.01-0.05 per analysis. You'd get 1000+ analyses for $10.

### Q: What if AI gives bad signal?

**A**: 
- Check confidence score (if <60%, skip it)
- Verify with your own analysis
- Wait for better signal
- Keep all trades in journal to improve over time

### Q: Can I integrate with TradingView?

**A**: Yes. You can:
1. Add webhook to send alerts
2. Use alerts to execute trades
3. Add custom indicators using the analysis output

### Q: How do I improve accuracy?

**A**: 
- Paper trade for 30 days first
- Track every trade in journal
- Review loss reasons
- Adjust entry/exit rules
- Focus on high-confidence setups

### Q: What's the best timeframe to trade?

**A**: Depends on your style:
- Scalpers: 1H
- Swing traders: 4H
- Position traders: Daily

Confirm entry on 1H but always check larger timeframe.

### Q: Should I use leverage?

**A**: Not recommended for beginners. If you do:
- Use maximum 2:1 leverage
- Reduce position size proportionally
- Use tighter stops
- Risk management becomes critical

---

## Getting Help

### Resources
- README.md - Overview and setup
- QUICKSTART.md - 5-minute setup guide
- EXAMPLES.md - Real trade scenarios
- Trading Rules in code: `src/config/tradingRules.ts`

### Support
- Check console for error messages (F12 in browser)
- Review `.env` configuration
- Verify API keys are valid
- Test API directly: https://platform.openai.com/playground

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
**Status**: Production Ready
