
export interface StockInfo {
  ticker: string;
  name: string;
  price?: string;
  change?: string;
}

export interface PriceAlert {
  ticker: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

export interface UserPreferences {
  email: string;
  phone: string;
  enableBrowserPush: boolean;
  enableEmailAlerts: boolean; // UI placeholder for future backend integration
  enableSMSAlerts: boolean;   // UI placeholder for future backend integration
  onlyHighImpact: boolean;
  enableBackgroundMonitoring: boolean;
  customApiKey?: string;
}

export interface AnalysisResult {
  ticker: string;
  currentPrice: number;
  priceTimestamp?: string;
  lastUpdated: number;
  summary: string[]; // Changed to array for bullet points
  fundamental: string;
  technical: string;
  supportLevel: string;
  resistanceLevel: string;
  news: Array<{
    title: string;
    impact: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  entryLevel: string;
  exitLevel: string;
  dailySummary: string;
  recommendation: string; // New field
  recommendationReason?: string;
  sources: Array<{
    title: string;
    uri: string;
  }>;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  addedAt: number;
}
