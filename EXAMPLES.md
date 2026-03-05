# Example Trade Scenarios

This document shows realistic examples of how the dashboard analyzes and recommends trades.

## Example 1: Bullish Setup ✅

### Market Conditions
- **Price**: 2032
- **RSI**: 42 (Neutral)
- **MA50**: 2025
- **MA200**: 2015
- **DXY**: Falling (weakening dollar)
- **Bond Yields**: Declining
- **Inflation**: Rising
- **Fed Outlook**: Dovish
- **News Sentiment**: Bullish
- **Risk Sentiment**: Risk-on
- **Volume**: Increasing

### AI Analysis Output
```json
{
  "marketBias": "Bullish",
  "confidenceScore": 78,
  "riskLevel": "Medium",
  "reasons": [
    "Price above 200 MA indicating uptrend",
    "Dollar weakness supports higher gold",
    "Declining bond yields reduce opportunity cost",
    "Dovish Fed policy supportive",
    "Volume confirming upward move",
    "RSI neutral, room to run higher"
  ],
  "tradeIdea": "Buy",
  "entryZone": 2032,
  "stopLoss": 2018,
  "takeProfit": 2065,
  "timestamp": "2026-03-05T10:00:00Z"
}
```

### Trading Plan
- **Entry**: Buy at 2032 (market price)
- **Stop Loss**: 2018 (14 pips below)
- **Take Profit 1**: 2048 (take 50% profit)
- **Take Profit 2**: 2065 (take 30% profit)
- **Trailing Stop**: Place on remaining 20% after reaching 2048

### Risk Management
- Account Size: $10,000
- Risk per Trade: 2% = $200
- Stop Loss Distance: 14 pips
- Position Size: Calculate via dashboard

---

## Example 2: Bearish Setup ❌

### Market Conditions
- **Price**: 2050
- **RSI**: 75 (Overbought)
- **MA50**: 2045
- **MA200**: 2035
- **DXY**: Rising (strengthening dollar)
- **Bond Yields**: Increasing
- **Inflation**: Falling
- **Fed Outlook**: Hawkish
- **News Sentiment**: Mixed
- **Risk Sentiment**: Risk-off
- **Volume**: Decreasing

### AI Analysis Output
```json
{
  "marketBias": "Bearish",
  "confidenceScore": 72,
  "riskLevel": "Medium",
  "reasons": [
    "RSI overbought (75) - pullback likely",
    "Strong dollar headwind for gold",
    "Rising bond yields reduce gold appeal",
    "Hawkish Fed supportive of higher rates",
    "Falling inflation not supportive",
    "Volume declining on rally - less conviction"
  ],
  "tradeIdea": "Sell",
  "entryZone": 2045,
  "stopLoss": 2060,
  "takeProfit": 2025,
  "timestamp": "2026-03-05T11:30:00Z"
}
```

### Trading Plan
- **Entry**: Sell at 2045 (market price)
- **Stop Loss**: 2060 (15 pips above)
- **Take Profit 1**: 2035 (take 50% profit)
- **Take Profit 2**: 2025 (take 30% profit)
- **Trailing Stop**: Place on remaining 20% after reaching 2035

### Risk Management
- Account Size: $10,000
- Risk per Trade: 2% = $200
- Stop Loss Distance: 15 pips
- Position Size: Calculate via dashboard

---

## Example 3: Neutral Setup (WAIT) ⏸️

### Market Conditions
- **Price**: 2037
- **RSI**: 55 (Neutral)
- **MA50**: 2038
- **MA200**: 2030
- **DXY**: Neutral
- **Bond Yields**: Stable
- **Inflation**: Stable
- **Fed Outlook**: Neutral
- **News Sentiment**: Neutral
- **Risk Sentiment**: Mixed
- **Volume**: Stable

### AI Analysis Output
```json
{
  "marketBias": "Neutral",
  "confidenceScore": 45,
  "riskLevel": "High",
  "reasons": [
    "Mixed signals from macro and technical",
    "RSI in neutral zone",
    "No strong dollar trend",
    "Fed policy unclear",
    "Consolidation pattern - breakout pending",
    "Insufficient volume confirmation"
  ],
  "tradeIdea": "Wait",
  "entryZone": 2040,
  "stopLoss": 2020,
  "takeProfit": 2055,
  "timestamp": "2026-03-05T12:15:00Z"
}
```

### Trading Plan
- **Action**: WAIT for more clarity
- **Watch for**: Break above 2045 (Bullish) or below 2025 (Bearish)
- **Monitor**: Volume and RSI direction changes
- **Next Check**: In 2-4 hours

### Why Not Trade?
- Confidence too low (45%)
- Risk/reward not favorable
- Multiple conflicting signals
- Better opportunities will come

---

## Multi-Timeframe Confirmation Example

Sometimes the same price shows different signals on different timeframes:

### Scenario: Daily Bullish, 4H Bearish

```
Daily Trend:  BULLISH (Price > MA200, RSI 60)
4H Trend:     BEARISH (Price < MA50, RSI 35)
1H Trend:     NEUTRAL (Consolidating)
```

**Trading Decision**: WAIT
- Daily supports uptrend but 4H pullback likely
- Wait for 4H to align with daily
- When 4H reverses to bullish = strong entry signal

### Scenario: All Timeframes Aligned

```
Daily Trend:  BULLISH (Strong)
4H Trend:     BULLISH (Strong)
1H Trend:     BULLISH (Breakout)
```

**Trading Decision**: BUY with HIGH CONFIDENCE
- All timeframes agree = low risk setup
- Confidence score likely 80%+
- Multiple confirmations = better probability

---

## Economic Calendar Events Impact

### Before Major News
- **Recommendation**: REDUCE or CLOSE positions
- **Reasoning**: Volatility spike unpredictable
- **Wait**: 30 min after news release

### Example: Fed Interest Rate Decision
```
Before:  Price 2035, RSI 52, Bullish bias
News:    Hawkish surprise (rates stay high)
After:   Price crashes to 2000, RSI 20
```

**Lesson**: Always check economic calendar before trading!

---

## Real Trade Examples

### Trade 1: Successful Buy (Profit)
- Entry: 2030
- Stop Loss: 2015 (-15 pips)
- Take Profit: 2060 (+30 pips)
- Confidence: 76%
- **Result**: Price went to 2065 = +35 pips profit
- **Risk/Reward**: Risked 15 to make 35 (1:2.3 ratio)

### Trade 2: Failed Sell (Loss)
- Entry: 2048
- Stop Loss: 2065 (+17 pips)
- Take Profit: 2030 (-18 pips)
- Confidence: 62%
- **Result**: Fed dovish surprise, price went to 2075 = -27 pips loss
- **Lesson**: Low confidence trade had bad outcome

### Trade 3: Breakeven (Scalp)
- Entry: 2032
- Stop Loss: 2025
- Take Profit: 2039
- Confidence: 51%
- **Result**: Price hit stop loss at 2025 = -7 pips loss
- **Lesson**: Wait for higher confidence setups

---

## Key Takeaways

1. **Higher Confidence = Better Trades**
   - 75%+ confidence: Trade normally
   - 60-75% confidence: Use tight stops, smaller size
   - Below 60% confidence: WAIT or skip

2. **Risk Management is Everything**
   - Never risk more than 2% per trade
   - Always use stop losses
   - Protect your account first

3. **Align Timeframes**
   - Enter on smaller timeframe
   - Confirm with larger timeframe
   - Exit when largest timeframe signals reversal

4. **Follow the Plan**
   - Don't move stops against you
   - Don't take profits early on good trades
   - Follow rules consistently

5. **Economic Calendar Matters**
   - Check major events before trading
   - Reduce position size before news
   - Avoid trading in first 30 min after events

---

**Remember**: These are educational examples. Past performance ≠ future results. Always test strategies with paper trading first!
