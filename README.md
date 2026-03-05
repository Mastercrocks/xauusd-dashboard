# XAUUSD AI Trade Analysis Dashboard

A professional, AI-powered trading analysis dashboard for XAUUSD (Gold/USD) that evaluates market conditions and provides trading recommendations using ChatGPT API.

## Features

✅ **AI-Powered Analysis** - Uses ChatGPT to analyze market data and provide professional trading insights

✅ **Real-time Market Data** - Displays current price, technical indicators (RSI, MA50, MA200, ATR), support/resistance levels

✅ **Macro Analysis** - Evaluates impact of USD Index, bond yields, inflation trends, and Fed policy

✅ **Sentiment Analysis** - Incorporates news sentiment, risk sentiment, and volume trends

✅ **Multi-Timeframe Analysis** - Analyzes trends across 1H, 4H, and Daily timeframes

✅ **Trading Signals** - Provides clear trading recommendations with entry zones, stop losses, and take profit levels

✅ **Confidence Scoring** - Displays confidence level (1-100%) for each analysis

✅ **Risk Assessment** - Evaluates risk levels (Low/Medium/High)

✅ **Modern UI** - Beautiful, responsive dashboard with real-time updates

## Output Format

The dashboard returns analysis in this format:

```json
{
  "marketBias": "Bullish | Bearish | Neutral",
  "confidenceScore": 76,
  "riskLevel": "Medium",
  "reasons": [
    "US Dollar weakening",
    "Bond yields falling",
    "Price holding above 200 MA",
    "RSI neutral"
  ],
  "tradeIdea": "Buy | Sell | Wait",
  "entryZone": 2032,
  "stopLoss": 2018,
  "takeProfit": 2065,
  "timestamp": "2026-03-05T10:30:00Z"
}
```

## Analysis Rules

The AI evaluates markets based on:

1. **DXY rising** → bearish for gold
2. **Bond yields rise** → bearish for gold
3. **Inflation expectations rise** → bullish for gold
4. **Price above MA200** → bullish trend
5. **Price below MA200** → bearish trend
6. **RSI > 70** → overbought
7. **RSI < 30** → oversold

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key (Get from https://platform.openai.com/api-keys)

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd "c:\Users\stama\OneDrive\Desktop\XAUUSD DASH\New folder\New folder"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=sk-your-api-key-here
   VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   VITE_FINNHUB_API_KEY=your_finnhub_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   └── Dashboard.tsx       # Main dashboard component
├── services/
│   ├── aiAnalysisService.ts    # ChatGPT integration
│   └── marketDataService.ts    # Market data fetching
├── types/
│   └── index.ts            # TypeScript interfaces
├── styles/
│   └── dashboard.css       # Dashboard styling
├── App.tsx                 # Main app component
└── main.tsx                # Entry point
```

## API Integration

### OpenAI API
- Model: GPT-4
- Endpoint: `/v1/chat/completions`
- Used for: Market analysis and trading recommendations

### Market Data Sources (Optional)
- **Alpha Vantage**: Real-time forex data
- **Finnhub**: Market sentiment and news data

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Customization

### Change the AI Model
Edit `src/services/aiAnalysisService.ts`:
```typescript
model: 'gpt-4' // Change to 'gpt-3.5-turbo' or other models
```

### Modify Analysis Prompt
Update `buildAnalysisPrompt()` in `src/services/aiAnalysisService.ts` to include custom rules or indicators.

### Add Real Market Data
Replace `getMockMarketData()` in `src/services/marketDataService.ts` with API calls to actual data sources.

### Custom Styling
Edit `src/styles/dashboard.css` to match your branding.

## Key Features Explained

### 1. Market Bias
- **Bullish**: Positive conditions suggest upward price movement
- **Bearish**: Negative conditions suggest downward price movement
- **Neutral**: Mixed signals, no clear direction

### 2. Confidence Score
- 1-100% score indicating the strength of the analysis
- Higher scores = more reliable signals
- Consider risk management with lower scores

### 3. Risk Level
- **Low**: Risk/reward ratio favors entry
- **Medium**: Balanced risk/reward
- **High**: Significant risk, use strict stops

### 4. Multi-Timeframe Analysis
- **1H**: Short-term trends for quick trades
- **4H**: Medium-term trends for swing trades
- **Daily**: Long-term trends for position trades

## Trading Best Practices

⚠️ **Always Follow These Rules:**

1. **Never trade without a stop loss**
2. **Use proper position sizing** (Risk only 1-2% per trade)
3. **Confirm signals across multiple timeframes**
4. **Monitor news and economic events**
5. **Keep a trading journal**
6. **Manage risk > chase profits**

## Troubleshooting

### "Failed to parse market analysis"
- Check your OpenAI API key is correct
- Ensure you have API credits
- Check network connection

### No data displaying
- Open browser console (F12) for error messages
- Verify `.env` file is set up correctly
- Check that API keys are valid

### Slow performance
- This is normal with API calls - they take 2-5 seconds
- Consider caching results if analyzing frequently

## Future Enhancements

- [ ] WebSocket support for real-time data
- [ ] Database storage for historical analysis
- [ ] Email/SMS alerts for trading signals
- [ ] Multiple pair analysis (EUR/USD, BTC/USD, etc.)
- [ ] Advanced charting with TradingView API
- [ ] User authentication and portfolios
- [ ] Backtesting engine
- [ ] Risk calculator and position sizer

## License

MIT

## Support

For issues or feature requests, please open an issue in the repository.

## Disclaimer

⚠️ **This tool is for educational purposes only. Trading involves substantial risk of loss. Past performance does not guarantee future results. Always conduct your own research and consult with a financial advisor before making investment decisions.**

---

Built with ❤️ for traders
