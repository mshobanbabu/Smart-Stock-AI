
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

const getAI = (customApiKey?: string) => {
  const apiKey = customApiKey || 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined) || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
    throw new Error("GEMINI_API_KEY is not defined or invalid. Please set it in your Vercel Environment Variables and REDEPLOY your app, or provide a custom key in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();
      const isRateLimit = error.message?.includes('429') || 
                          error.status === 429 || 
                          errorStr.includes('quota') || 
                          errorStr.includes('rate_limit') ||
                          errorStr.includes('429');
      
      if (isRateLimit && i < maxRetries - 1) {
        // Exponential backoff: 5s, 10s, 20s, 40s...
        const delay = Math.pow(2, i) * 5000 + Math.random() * 2000;
        console.warn(`Quota exceeded. Retrying in ${Math.round(delay/1000)}s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (isRateLimit) {
        throw new Error("API Quota Exhausted. The Free Tier has limits (RPM/RPD). Please wait a few minutes or check your Google AI Studio dashboard.");
      }
      throw error;
    }
  }
  throw lastError;
};

export const analyzeStock = async (ticker: string, customApiKey?: string): Promise<AnalysisResult> => {
  return withRetry(async () => {
    const ai = getAI(customApiKey);
    const now = new Date().toLocaleString();
    const prompt = `Current Date and Time: ${now}.
    Perform a comprehensive stock analysis for "${ticker}". 
    If the ticker includes a prefix like NSE: or BSE:, analyze it as an Indian stock.
    
    CRITICAL INSTRUCTION: Fetch the absolute latest REAL-TIME price available from the current trading session (as of ${now}). 
    Do NOT return the "Previous Close" or "Yesterday's" price if the market is currently open or in pre/post-market trading. 
    Look for labels like "Live", "Real-time", or "As of [Current Time]" in search results (e.g., Google Finance, Yahoo Finance, CNBC).
    
    Include the following sections in your response as valid JSON:
    1. currentPrice: The most recent available stock price as a number (e.g., 150.25).
    2. priceTimestamp: The exact time/date the price was quoted (e.g., "Feb 25, 11:35 AM ET").
    3. summary: An array of 2 strings, each representing a key point about the stock's current status.
    4. fundamental: Key fundamental metrics (P/E, Revenue Growth, Debt-to-Equity) and an analysis of their health.
    5. technical: Current technical trends (Moving averages, RSI, Volume trends).
    6. supportLevel: Key support price levels found in technical analysis (e.g., "$142.50, $138.00").
    7. resistanceLevel: Key resistance price levels found in technical analysis (e.g., "$155.00, $162.00").
    8. news: A list of 3-4 recent news items. For each, include "title", "impact" (how it affects price), and "sentiment" (positive/negative/neutral).
    9. entryLevel: Suggested buying price range with reasoning.
    10. exitLevel: Suggested target/stop-loss price range with reasoning.
    11. dailySummary: A concise wrap-up of today's market action for this stock.
    12. recommendation: A clear "Buy", "Sell", or "Hold" recommendation with a 1-sentence justification.

    Use Google Search to ensure data is as close to real-time as possible. Return only the JSON object.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentPrice: { type: Type.NUMBER },
            priceTimestamp: { type: Type.STRING },
            summary: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            fundamental: { type: Type.STRING },
            technical: { type: Type.STRING },
            supportLevel: { type: Type.STRING },
            resistanceLevel: { type: Type.STRING },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  sentiment: { type: Type.STRING },
                },
                required: ["title", "impact", "sentiment"],
              },
            },
            entryLevel: { type: Type.STRING },
            exitLevel: { type: Type.STRING },
            dailySummary: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["currentPrice", "priceTimestamp", "summary", "fundamental", "technical", "supportLevel", "resistanceLevel", "news", "entryLevel", "exitLevel", "dailySummary", "recommendation"],
        },
      },
    });

    const rawJson = JSON.parse(response.text || "{}");
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || "#",
      })) || [];

    return {
      ...rawJson,
      ticker,
      sources,
      lastUpdated: Date.now(),
    };
  });
};

export const checkSignificantChanges = async (ticker: string, customApiKey?: string): Promise<{ hasChange: boolean; alertMessage: string; sentiment: 'bullish' | 'bearish' | 'neutral'; impactLevel: 'high' | 'medium' | 'low' }> => {
  return withRetry(async () => {
    const ai = getAI(customApiKey);
    const prompt = `Check for any significant fundamental changes or high-impact news for ${ticker} in the last 24 hours. 
    Respond with JSON:
    1. hasChange: true if there is major news affecting price or fundamentals.
    2. alertMessage: A short headline of the change.
    3. sentiment: current market sentiment (bullish/bearish/neutral).
    4. impactLevel: The severity of the impact (high/medium/low). Only mark as 'high' if it's a major event like earnings, acquisition, or regulatory shift.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasChange: { type: Type.BOOLEAN },
            alertMessage: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            impactLevel: { type: Type.STRING },
          }
        }
      }
    });
    return JSON.parse(response.text || '{"hasChange": false, "alertMessage": "", "sentiment": "neutral", "impactLevel": "low"}');
  });
};

export const getMarketPulse = async (region: 'US' | 'India' = 'US', customApiKey?: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAI(customApiKey);
    const now = new Date().toLocaleString();
    const prompt = region === 'India' 
      ? `Current Date/Time: ${now}. Provide a summary of today's Indian stock market (NSE/BSE) sentiment. Format it as two distinct bullet points (Point 1 and Point 2) on separate lines, followed by a brief sector outlook.`
      : `Current Date/Time: ${now}. Provide a summary of today's overall US stock market sentiment. Format it as two distinct bullet points (Point 1 and Point 2) on separate lines, followed by a brief sector outlook.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "Market data currently unavailable.";
  });
};

export const getTrendingStocks = async (region: 'US' | 'India' = 'US', customApiKey?: string): Promise<{ ticker: string; reason: string }[]> => {
  return withRetry(async () => {
    const ai = getAI(customApiKey);
    const prompt = region === 'India'
      ? "List 5 currently trending Indian stocks (tickers with NSE: prefix, e.g., NSE:RELIANCE, NSE:TCS) that show strong growth potential. For each, provide a 1-sentence reason for the recommendation based on recent trends."
      : "List 5 currently trending US stocks (tickers only, e.g., AAPL, NVDA) that show strong growth potential. For each, provide a 1-sentence reason for the recommendation based on recent news or trends.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["ticker", "reason"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return region === 'India' 
        ? [
            { ticker: "NSE:RELIANCE", reason: "Strong growth in retail and digital services sectors." },
            { ticker: "NSE:TCS", reason: "Robust deal pipeline and digital transformation demand." },
            { ticker: "NSE:HDFCBANK", reason: "Consistent credit growth and market leadership." },
            { ticker: "NSE:INFY", reason: "Expansion in cloud and AI services globally." },
            { ticker: "NSE:ICICIBANK", reason: "Improving asset quality and strong retail franchise." }
          ]
        : [
            { ticker: "AAPL", reason: "Anticipation of new AI features in upcoming software updates." },
            { ticker: "NVDA", reason: "Dominance in the AI chip market and strong quarterly earnings." },
            { ticker: "TSLA", reason: "Expansion of manufacturing capacity and FSD progress." },
            { ticker: "MSFT", reason: "Leadership in enterprise cloud and OpenAI partnership." },
            { ticker: "GOOGL", reason: "Strong ad revenue and advancements in Gemini AI." }
          ];
    }
  });
};
