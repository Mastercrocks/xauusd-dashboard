import axios from 'axios';
import {
  MarketData,
  MacroData,
  SentimentData,
  AnalysisResult,
  TradingPair,
} from '../types';
import { getPairConfig } from '../config/pairsConfig';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT_MS = 15000;

export class AIAnalysisService {
  static async analyzeMarket(
    marketData: MarketData,
    macroData: MacroData,
    sentimentData: SentimentData,
    pair: TradingPair = 'XAUUSD'
  ): Promise<AnalysisResult> {
    // Always return a usable analysis even when external AI is unavailable.
    if (!OPENAI_API_KEY) {
      return this.generateFallbackAnalysis(marketData, pair);
    }

    const prompt = this.buildAnalysisPrompt(
      marketData,
      macroData,
      sentimentData,
      pair
    );

    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional macro and forex analyst. Analyze market data and provide trading recommendations in JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: OPENAI_TIMEOUT_MS,
        }
      );

      const analysisText = response.data.choices?.[0]?.message?.content;
      if (!analysisText || typeof analysisText !== 'string') {
        throw new Error('Empty AI response');
      }

      return this.parseAnalysis(analysisText);
    } catch (error) {
      console.warn('AI request failed, using fallback analysis:', error);
      return this.generateFallbackAnalysis(marketData, pair);
    }
  }

  private static buildAnalysisPrompt(
    marketData: MarketData,
    macroData: MacroData,
    sentimentData: SentimentData,
    pair: TradingPair = 'XAUUSD'
  ): string {
    const pairConfig = getPairConfig(pair);
    return `
You are a professional macro and forex analyst.

Analyze the following ${pair} (${pairConfig.name}) market data and determine the trading bias.

Return your analysis as a valid JSON object with exactly this structure:
{
  "marketBias": "Bullish" | "Bearish" | "Neutral",
  "confidenceScore": number (1-100),
  "riskLevel": "Low" | "Medium" | "High",
  "reasons": [string, string, string],
  "tradeIdea": "Buy" | "Sell" | "Wait",
  "entryZone": number,
  "stopLoss": number,
  "takeProfit": number
}

MARKET DATA:
- Price: ${marketData.price}
- RSI: ${marketData.rsi}
- Moving Average 50: ${marketData.ma50}
- Moving Average 200: ${marketData.ma200}
- ATR: ${marketData.atr}
- Support Level: ${marketData.support}
- Resistance Level: ${marketData.resistance}

MACRO DATA:
- US Dollar Index (DXY) direction: ${macroData.dxyDirection}
- US 10 Year Yield direction: ${macroData.bondYieldDirection}
- Inflation trend: ${macroData.inflationTrend}
- Federal Reserve outlook: ${macroData.fedOutlook}

MARKET SENTIMENT:
- News sentiment: ${sentimentData.newsSentiment}
- Risk sentiment: ${sentimentData.riskSentiment}
- Volume trend: ${sentimentData.volumeTrend}

ANALYSIS RULES:
1. If DXY is rising → bearish for gold
2. If bond yields rise → bearish for gold
3. If inflation expectations rise → bullish for gold
4. If price above MA200 → bullish trend
5. If price below MA200 → bearish trend
6. If RSI > 70 → overbought
7. If RSI < 30 → oversold

Provide only valid JSON, no additional text.
`;
  }

  private static parseAnalysis(jsonString: string): AnalysisResult {
    try {
      // Extract JSON from the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        marketBias: parsed.marketBias,
        confidenceScore: parsed.confidenceScore,
        riskLevel: parsed.riskLevel,
        reasons: parsed.reasons,
        tradeIdea: parsed.tradeIdea,
        entryZone: parsed.entryZone,
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
      throw new Error('Failed to parse market analysis');
    }
  }

  private static generateFallbackAnalysis(
    marketData: MarketData,
    pair: TradingPair
  ): AnalysisResult {
    const priceVsMa200 = marketData.price - marketData.ma200;
    const priceVsMa50 = marketData.price - marketData.ma50;

    const bullishSignals =
      (priceVsMa200 > 0 ? 1 : 0) +
      (priceVsMa50 > 0 ? 1 : 0) +
      (marketData.rsi >= 45 && marketData.rsi <= 65 ? 1 : 0);

    const bearishSignals =
      (priceVsMa200 < 0 ? 1 : 0) +
      (priceVsMa50 < 0 ? 1 : 0) +
      (marketData.rsi > 70 ? 1 : 0);

    let marketBias: AnalysisResult['marketBias'] = 'Neutral';
    let tradeIdea: AnalysisResult['tradeIdea'] = 'Wait';

    if (bullishSignals >= 2 && bearishSignals === 0) {
      marketBias = 'Bullish';
      tradeIdea = 'Buy';
    } else if (bearishSignals >= 2 && bullishSignals === 0) {
      marketBias = 'Bearish';
      tradeIdea = 'Sell';
    }

    const confidenceScore = Math.min(
      85,
      Math.max(45, 55 + (bullishSignals - bearishSignals) * 10)
    );

    const riskLevel: AnalysisResult['riskLevel'] =
      marketData.atr > Math.abs(marketData.resistance - marketData.support) * 0.6
        ? 'High'
        : marketData.atr > 20
          ? 'Medium'
          : 'Low';

    const direction = marketBias === 'Bearish' ? -1 : 1;
    const atrOffset = marketData.atr * 0.8;

    const entryZone = Number(marketData.price.toFixed(2));
    const stopLoss = Number((entryZone - direction * atrOffset).toFixed(2));
    const takeProfit = Number((entryZone + direction * atrOffset * 1.6).toFixed(2));

    return {
      marketBias,
      confidenceScore,
      riskLevel,
      reasons: [
        `Fallback rule-based analysis for ${pair} (AI unavailable).`,
        `Price is ${priceVsMa200 >= 0 ? 'above' : 'below'} MA200 and ${priceVsMa50 >= 0 ? 'above' : 'below'} MA50.`,
        `RSI is ${marketData.rsi.toFixed(1)} with ATR ${marketData.atr.toFixed(1)}.`,
      ],
      tradeIdea,
      entryZone,
      stopLoss,
      takeProfit,
      timestamp: new Date().toISOString(),
    };
  }
}
