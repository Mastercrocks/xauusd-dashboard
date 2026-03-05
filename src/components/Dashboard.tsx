import React, { useState, useEffect } from 'react';
import { AnalysisResult, MarketData, MacroData, SentimentData, TimeframeAnalysis, TradingPair } from '../types';
import { AIAnalysisService } from '../services/aiAnalysisService';
import { MarketDataService } from '../services/marketDataService';
import { PAIR_LIST, getPairConfig } from '../config/pairsConfig';
import '../styles/dashboard.css';

export const Dashboard: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<TradingPair>('XAUUSD');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [timeframeAnalysis, setTimeframeAnalysis] = useState<TimeframeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock macro data
  const macroData: MacroData = {
    dxyDirection: 'down',
    bondYieldDirection: 'down',
    inflationTrend: 'falling',
    fedOutlook: 'dovish',
  };

  // Mock sentiment data
  const sentimentData: SentimentData = {
    newsSentiment: 'bullish',
    riskSentiment: 'risk-on',
    volumeTrend: 'increasing',
  };

  useEffect(() => {
    const analyzeMarket = async () => {
      try {
        setLoading(true);
        const data = await MarketDataService.getMarketData(selectedPair);
        setMarketData(data);

        const timeframes = await MarketDataService.getTimeframeAnalysis();
        setTimeframeAnalysis(timeframes);

        const result = await AIAnalysisService.analyzeMarket(
          data,
          macroData,
          sentimentData,
          selectedPair
        );
        setAnalysis(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    analyzeMarket();
  }, [selectedPair]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MarketDataService.getMarketData(selectedPair);
      setMarketData(data);

      const result = await AIAnalysisService.analyzeMarket(
        data,
        macroData,
        sentimentData,
        selectedPair
      );
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>AI Trade Analysis Dashboard</h1>
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value as TradingPair)}
            className="pair-selector"
          >
            {PAIR_LIST.map((pair) => (
              <option key={pair} value={pair}>
                {getPairConfig(pair).name} ({pair})
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleRefresh} disabled={loading} className="btn-refresh">
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <small>Make sure to set your OpenAI API key in .env file</small>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing market data with AI...</p>
        </div>
      ) : (
        <>
          {marketData && (
            <div className="market-data-section">
              <h2>Current Market Data</h2>
              <div className="data-grid">
                <div className="data-item">
                  <label>Price</label>
                  <span className="value">${marketData.price.toFixed(2)}</span>
                </div>
                <div className="data-item">
                  <label>RSI</label>
                  <span className="value">{marketData.rsi.toFixed(2)}</span>
                </div>
                <div className="data-item">
                  <label>MA 50</label>
                  <span className="value">${marketData.ma50.toFixed(2)}</span>
                </div>
                <div className="data-item">
                  <label>MA 200</label>
                  <span className="value">${marketData.ma200.toFixed(2)}</span>
                </div>
                <div className="data-item">
                  <label>ATR</label>
                  <span className="value">{marketData.atr.toFixed(2)}</span>
                </div>
                <div className="data-item">
                  <label>Support</label>
                  <span className="value">${marketData.support.toFixed(2)}</span>
                </div>
                <div className="data-item">
                  <label>Resistance</label>
                  <span className="value">${marketData.resistance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {analysis && (
            <>
              <div className="analysis-section">
                <h2>AI Analysis Results</h2>
                <div className="analysis-grid">
                  <div className="analysis-card bias">
                    <h3>Market Bias</h3>
                    <p className={`bias-${analysis.marketBias.toLowerCase()}`}>
                      {analysis.marketBias}
                    </p>
                  </div>

                  <div className="analysis-card confidence">
                    <h3>Confidence Score</h3>
                    <div className="score-display">
                      <span className="score">{analysis.confidenceScore}%</span>
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{ width: `${analysis.confidenceScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="analysis-card risk">
                    <h3>Risk Level</h3>
                    <p className={`risk-${analysis.riskLevel.toLowerCase()}`}>
                      {analysis.riskLevel}
                    </p>
                  </div>
                </div>

                <div className="reasons-section">
                  <h3>Key Reasons</h3>
                  <ul className="reasons-list">
                    {analysis.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="trade-idea-section">
                  <h3>Trade Idea</h3>
                  <div className="trade-grid">
                    <div className="trade-item">
                      <label>Suggested Action</label>
                      <span className={`trade-action ${analysis.tradeIdea.toLowerCase()}`}>
                        {analysis.tradeIdea}
                      </span>
                    </div>
                    <div className="trade-item">
                      <label>Entry Zone</label>
                      <span className="value">${analysis.entryZone.toFixed(2)}</span>
                    </div>
                    <div className="trade-item">
                      <label>Stop Loss</label>
                      <span className="value risk">${analysis.stopLoss.toFixed(2)}</span>
                    </div>
                    <div className="trade-item">
                      <label>Take Profit</label>
                      <span className="value bullish">${analysis.takeProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {timeframeAnalysis.length > 0 && (
                <div className="timeframe-section">
                  <h2>Multi-Timeframe Analysis</h2>
                  <div className="timeframe-cards">
                    {timeframeAnalysis.map((tf) => (
                      <div key={tf.timeframe} className="timeframe-card">
                        <h4>{tf.timeframe}</h4>
                        <p className={`trend ${tf.trend.toLowerCase()}`}>
                          {tf.trend}
                        </p>
                        <div className="strength-bar">
                          <div
                            className="strength-fill"
                            style={{ width: `${tf.strength}%` }}
                          ></div>
                        </div>
                        <span className="strength-text">{tf.strength}% Strength</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="timestamp">
                <small>Last updated: {new Date(analysis.timestamp).toLocaleString()}</small>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
