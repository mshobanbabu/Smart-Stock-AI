
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { analyzeStock, getTrendingStocks, getMarketPulse, checkSignificantChanges } from './services/geminiService';
import { AnalysisResult, WatchlistItem, PriceAlert, UserPreferences } from './types';
import AnalysisCard from './components/AnalysisCard';
import StockChart from './components/StockChart';

// Icons
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const TrendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.5 8.5L8 10l-6 6"/><path d="M16 7h6v6"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const FundamentalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const TechnicalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const LevelsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v4"/><path d="M11 6v8"/><path d="M15 14v4"/><path d="M19 10v8"/><path d="M3 10v8"/><path d="M21 21H3"/></svg>;
const NewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const ChartToggleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></svg>;
const PulseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const ArrowUpRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>;

const BellIcon = ({ active, filled }: { active?: boolean; filled?: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`${active ? "text-amber-400" : "text-slate-500"} transition-colors duration-300`}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

interface Message {
  role: 'user' | 'model';
  text: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.error?.message || event.message || "";
      const stack = event.error?.stack || "";
      
      // Ignore non-critical errors from third-party widgets or extensions
      if (
        message.includes('TradingView') || 
        message.includes('tradingview') || 
        stack.includes('tradingview') ||
        message.includes('Script error') ||
        message.includes('ResizeObserver')
      ) {
        console.warn("Caught non-fatal runtime error:", message);
        return;
      }

      setHasError(true);
      setErrorDetails(message);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const saved = localStorage.getItem('watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse watchlist from localStorage", e);
      return [];
    }
  });
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const saved = localStorage.getItem('priceAlerts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse alerts from localStorage", e);
      return [];
    }
  });
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {
          email: '', phone: '', enableBrowserPush: false, enableEmailAlerts: false,
          enableSMSAlerts: false, onlyHighImpact: true, enableBackgroundMonitoring: false, customApiKey: ''
        };
      }
      const saved = localStorage.getItem('userPreferences');
      return saved ? JSON.parse(saved) : {
        email: '',
        phone: '',
        enableBrowserPush: false,
        enableEmailAlerts: false,
        enableSMSAlerts: false,
        onlyHighImpact: true,
        enableBackgroundMonitoring: false,
        customApiKey: ''
      };
    } catch (e) {
      return {
        email: '', phone: '', enableBrowserPush: false, enableEmailAlerts: false,
        enableSMSAlerts: false, onlyHighImpact: true, enableBackgroundMonitoring: false, customApiKey: ''
      };
    }
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [trending, setTrending] = useState<{ ticker: string; reason: string }[]>([]);
  const [marketPulse, setMarketPulse] = useState<string>('');
  const [marketRegion, setMarketRegion] = useState<'US' | 'India'>('US');
  const [error, setError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const initRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Alert Setup State
  const [showAlertDialog, setShowAlertDialog] = useState<string | null>(null);
  const [alertForm, setAlertForm] = useState<{ price: string; condition: 'above' | 'below' }>({ price: '', condition: 'above' });
  
  // Notification State
  const [triggeredAlert, setTriggeredAlert] = useState<{ message: string; sentiment: string; impactLevel?: string } | null>(null);
  const [alertHistory, setAlertHistory] = useState<string[]>(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const saved = localStorage.getItem('alertHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('alertHistory', JSON.stringify(alertHistory.slice(-50)));
      }
    } catch (e) {}
  }, [alertHistory]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
      }
    } catch (e) {}
  }, [watchlist]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('priceAlerts', JSON.stringify(alerts));
      }
    } catch (e) {}
  }, [alerts]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('userPreferences', JSON.stringify(prefs));
      }
    } catch (e) {}
  }, [prefs]);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      // Add a small delay to prevent "Refresh storms" from hitting API instantly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Prevent double execution in StrictMode or rapid state changes
      if (initRef.current && Date.now() - lastFetchRef.current < 10000) return;
      
      try {
        // Check for API key early
        const apiKey = prefs.customApiKey || 
          (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined) || 
          (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
          setError("GEMINI_API_KEY is missing or invalid. Please set it in your Vercel Environment Variables and REDEPLOY, or add it in Settings.");
          return;
        }

        // Try to load from cache first
        const cacheKey = `marketData_${marketRegion}`;
        const cached = localStorage.getItem(cacheKey);
        const quotaCooldown = localStorage.getItem('quota_cooldown');
        
        if (quotaCooldown && Date.now() - parseInt(quotaCooldown) < 300000) {
          // If we hit a quota error in the last 5 mins, don't even try to fetch
          if (cached) {
            const { pulse, stocks } = JSON.parse(cached);
            setMarketPulse(pulse);
            setTrending(stocks);
            setError("API is in cooldown due to previous quota error. Using cached data.");
          } else {
            setError("API is in cooldown. Please wait a few minutes before refreshing.");
          }
          return;
        }

        if (cached) {
          try {
            const { pulse, stocks, timestamp } = JSON.parse(cached);
            const isFresh = Date.now() - timestamp < 3600000; // 1 hour cache for market pulse
            if (isFresh) {
              setMarketPulse(pulse);
              setTrending(stocks);
              return;
            }
          } catch (e) {
            localStorage.removeItem(cacheKey);
          }
        }

        initRef.current = true;
        lastFetchRef.current = Date.now();
        setMarketPulse('');
        setTrending([]);
        
        console.log(`Fetching fresh market data for ${marketRegion}...`);
        
        // Serialize requests to avoid hitting concurrent quota limits
        const stocks = await getTrendingStocks(marketRegion, prefs.customApiKey);
        // Small delay between requests to respect RPM
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pulse = await getMarketPulse(marketRegion, prefs.customApiKey);
        
        setTrending(stocks);
        setMarketPulse(pulse);

        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          pulse,
          stocks,
          timestamp: Date.now()
        }));
        localStorage.removeItem('quota_cooldown');
      } catch (err: any) {
        console.error("Detailed Market Data Error:", err);
        const errorMessage = err.message || JSON.stringify(err);
        const isQuota = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota');
        
        if (isQuota) {
          console.error("QUOTA EXCEEDED ERROR:", errorMessage);
          localStorage.setItem('quota_cooldown', Date.now().toString());
          setError("API Quota Exceeded. The Free Tier of Gemini has limits (15 requests/min). Cooldown active for 5 mins.");
        } else {
          console.error("MARKET DATA ERROR:", errorMessage);
          setError(`Market data unavailable: ${errorMessage}`);
        }
        
        // Fallback to stale cache if available
        const cached = localStorage.getItem(`marketData_${marketRegion}`);
        if (cached) {
          try {
            const { pulse, stocks } = JSON.parse(cached);
            setMarketPulse(pulse);
            setTrending(stocks);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    };
    initData();
  }, [marketRegion, prefs.customApiKey]);

  // Background Watchdog System
  useEffect(() => {
    if (watchlist.length === 0 || !prefs.enableBackgroundMonitoring) return;

    const watchdog = async () => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        const quotaCooldown = localStorage.getItem('quota_cooldown');
        if (quotaCooldown && Date.now() - parseInt(quotaCooldown) < 300000) return;

        setIsMonitoring(true);
        const randomIndex = Math.floor(Math.random() * watchlist.length);
        const stockToScan = watchlist[randomIndex].ticker;
        
        const change = await checkSignificantChanges(stockToScan, prefs.customApiKey);
        if (change.hasChange) {
          const alertId = `${stockToScan}-${change.alertMessage}`;
          
          // Deduplication check
          if (!alertHistory.includes(alertId)) {
            // Prioritize High Impact
            if (prefs.onlyHighImpact && change.impactLevel !== 'high') {
              // Just add to history, don't show popup
              setAlertHistory(prev => [...prev, alertId]);
              return;
            }

            const msg = `IMPACT ALERT (${stockToScan}): ${change.alertMessage}`;
            setTriggeredAlert({ 
              message: msg, 
              sentiment: change.sentiment,
              impactLevel: change.impactLevel 
            });
            setAlertHistory(prev => [...prev, alertId]);
            sendBrowserNotification(`${change.impactLevel.toUpperCase()} IMPACT: ${stockToScan}`, change.alertMessage);
          }
        }
      } catch (e: any) {
        console.error("Watchdog scan failed:", e);
        const msg = e.message || "";
        if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
          try { localStorage.setItem('quota_cooldown', Date.now().toString()); } catch (err) {}
        }
      } finally {
        setTimeout(() => setIsMonitoring(false), 2000);
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        watchdog();
      }
    }, 900000); // Check every 15 mins, only when tab is visible
    return () => clearInterval(interval);
  }, [watchlist, prefs.enableBrowserPush]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const sendBrowserNotification = (title: string, body: string) => {
    if (!prefs.enableBrowserPush || typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const checkAlerts = useCallback((ticker: string, currentPrice: number) => {
    const relevantAlerts = alerts.filter(a => a.ticker === ticker && a.isActive);
    for (const alert of relevantAlerts) {
      const isTriggered = alert.condition === 'above' 
        ? currentPrice >= alert.targetPrice 
        : currentPrice <= alert.targetPrice;
      
      if (isTriggered) {
        const message = `${ticker} target hit! Price is now ${alert.condition} $${alert.targetPrice.toFixed(2)}.`;
        setTriggeredAlert({ message, sentiment: alert.condition === 'above' ? 'bullish' : 'bearish', impactLevel: 'high' });
        sendBrowserNotification(`Price Alert: ${ticker}`, message);
        setAlerts(prev => prev.map(a => a.ticker === ticker && a.targetPrice === alert.targetPrice ? { ...a, isActive: false } : a));
      }
    }
  }, [alerts, prefs.enableBrowserPush]);

  const handleSearch = async (ticker: string, reason?: string) => {
    if (!ticker || loading) return;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const quotaCooldown = localStorage.getItem('quota_cooldown');
        if (quotaCooldown && Date.now() - parseInt(quotaCooldown) < 300000) {
          setError("API is in cooldown due to previous quota error. Please wait a few minutes.");
          return;
        }
      }
    } catch (e) {}

    setLoading(true);
    setError(null);
    setShowChart(false);
    
    // Small delay to prevent rapid clicking
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const result = await analyzeStock(ticker.toUpperCase(), prefs.customApiKey);
      if (reason) {
        result.recommendationReason = reason;
      }
      setAnalysis(result);
      checkAlerts(result.ticker, result.currentPrice);
    } catch (err: any) {
      const msg = err.message || JSON.stringify(err);
      if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('quota_cooldown', Date.now().toString());
          }
        } catch (e) {}
        setError("API Quota Exceeded. The Free Tier of Gemini has limits (15 requests/min). Cooldown active for 5 mins.");
      } else {
        setError(`Failed to analyze stock: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = (ticker: string) => {
    if (!watchlist.find(item => item.ticker === ticker)) {
      setWatchlist([...watchlist, { ticker, name: ticker, addedAt: Date.now() }]);
    }
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(watchlist.filter(item => item.ticker !== ticker));
    setAlerts(alerts.filter(a => a.ticker !== ticker));
  };

  const handleSetAlert = () => {
    if (!showAlertDialog || !alertForm.price) return;
    const newAlert: PriceAlert = {
      ticker: showAlertDialog,
      targetPrice: parseFloat(alertForm.price),
      condition: alertForm.condition,
      isActive: true
    };
    setAlerts([...alerts.filter(a => a.ticker !== showAlertDialog), newAlert]);
    setShowAlertDialog(null);
    setAlertForm({ price: '', condition: 'above' });
    if (prefs.enableBrowserPush && typeof Notification !== 'undefined' && Notification.permission !== 'granted') Notification.requestPermission();
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertIcon />
          </div>
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The application encountered a runtime error. This is often due to missing environment variables or browser compatibility issues.
          </p>
          {errorDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left max-h-40 overflow-y-auto">
                <p className="text-[10px] font-mono text-rose-400 break-all">{errorDetails}</p>
              </div>
              {(errorDetails.includes('429') || errorDetails.toLowerCase().includes('quota')) && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-left">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Quota Troubleshooting</h4>
                  <p className="text-[10px] text-slate-400 mb-2">You have hit the Gemini API rate limits.</p>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 underline font-bold">Check your usage dashboard here →</a>
                </div>
              )}
            </div>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const quotaCooldown = localStorage.getItem('quota_cooldown');
        if (quotaCooldown && Date.now() - parseInt(quotaCooldown) < 300000) {
          setChatMessages(prev => [...prev, { role: 'user', text: chatInput }, { role: 'model', text: "Chat restricted due to API cooldown. Please wait a few minutes." }]);
          setChatInput('');
          return;
        }
      }
    } catch (e) {}

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);
    try {
      const apiKey = prefs.customApiKey || 
        (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined) || 
        (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("GEMINI_API_KEY is not defined.");
      }
      const ai = new GoogleGenAI({ apiKey });
      if (!chatRef.current) {
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: { 
            systemInstruction: `Expert Stock AI. Data-driven and professional. Current Date: ${new Date().toLocaleDateString()}. Always use Google Search to find the latest real-time stock prices, news, and market data before answering. Do not rely on your internal knowledge for current prices.`,
            tools: [{ googleSearch: {} }]
          }
        });
      }
      const stream = await chatRef.current.sendMessageStream({ message: userMessage });
      let fullResponse = "";
      setChatMessages(prev => [...prev, { role: 'model', text: "" }]);
      for await (const chunk of stream) {
        fullResponse += (chunk as GenerateContentResponse).text;
        setChatMessages(prev => {
          const m = [...prev];
          m[m.length - 1].text = fullResponse;
          return m;
        });
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const msg = err.message || "";
      if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('quota_cooldown', Date.now().toString());
          }
        } catch (e) {}
      }
      setChatMessages(prev => [...prev, { role: 'model', text: "Chat offline. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* Alert Banner */}
      {triggeredAlert && (
        <div className={`fixed top-6 right-6 z-[100] ${triggeredAlert.sentiment === 'bullish' ? 'bg-emerald-600 border-emerald-400' : triggeredAlert.sentiment === 'bearish' ? 'bg-rose-600 border-rose-400' : 'bg-indigo-600 border-indigo-400'} text-white font-bold px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-right-10 duration-500 border-2 ${triggeredAlert.impactLevel === 'high' ? 'ring-4 ring-white/20 scale-105' : ''}`}>
          <div className="flex flex-col items-center">
             <AlertIcon />
             <span className="text-[10px] uppercase mt-1">{triggeredAlert.sentiment}</span>
          </div>
          <div className="max-w-sm">
            {triggeredAlert.impactLevel === 'high' && (
              <span className="inline-block bg-white text-black text-[10px] px-2 py-0.5 rounded-full mb-2 animate-pulse">HIGH IMPACT EVENT</span>
            )}
            <span className="text-base block">{triggeredAlert.message}</span>
          </div>
          <button onClick={() => setTriggeredAlert(null)} className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors">✕</button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAnalysis(null)}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center"><TrendingIcon /></div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">SmartStock AI</h1>
          </div>
          <div className="flex items-center gap-2">
            {localStorage.getItem('quota_cooldown') && Date.now() - parseInt(localStorage.getItem('quota_cooldown') || '0') < 300000 && (
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="API Cooldown Active"></div>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-lg"><SettingsIcon /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Watchlist</h2>
            <div className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-opacity duration-500 ${isMonitoring ? 'text-indigo-400 opacity-100' : 'text-slate-600 opacity-50'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
              Monitoring
            </div>
          </div>
          
          {watchlist.length === 0 ? (
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800/50">
              <p className="text-sm text-slate-500 italic text-center">Your portfolio is empty. Search for tickers to begin monitoring.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {watchlist.map(item => {
                const activeAlert = alerts.find(a => a.ticker === item.ticker && a.isActive);
                return (
                  <div key={item.ticker} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => handleSearch(item.ticker)}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-200 tracking-tight">{item.ticker}</span>
                      {activeAlert && <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] text-amber-500 font-bold border border-amber-500/20"><BellIcon active filled /><span>${activeAlert.targetPrice}</span></div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setShowAlertDialog(item.ticker); }} className={`p-1 transition-all rounded-md ${activeAlert ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-indigo-400'}`}><BellIcon active={!!activeAlert} filled={!!activeAlert} /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.ticker); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"><TrashIcon /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-4">AI Picks & Trending</h2>
            <div className="flex flex-wrap gap-2 px-2">
              {trending.map(stock => (
                <button key={stock.ticker} onClick={() => handleSearch(stock.ticker, stock.reason)} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">{stock.ticker}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><SearchIcon /></div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 sm:text-sm" placeholder="Search (e.g. NVDA, NSE:RELIANCE, BSE:TCS)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)} />
          </div>
          <button onClick={() => handleSearch(searchTerm)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20">Analyze</button>
        </header>

        <div className="p-6 max-w-6xl mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 animate-pulse font-medium">Running deep scan...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-10 text-center mt-10 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-3">Analysis Interrupted</h3>
              <div className="max-h-48 overflow-y-auto mb-6 p-2 bg-slate-900/30 rounded-lg">
                <p className="text-slate-300 leading-relaxed break-words text-sm">
                  {error}
                </p>
              </div>
              
              {(error.includes('Quota') || error.includes('429') || error.toLowerCase().includes('quota')) && (
                <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-left">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Free Tier Troubleshooting</h4>
                  <ul className="text-xs text-slate-400 space-y-2">
                    <li>• You have hit the Gemini API rate limits (15 requests/min or 1,500/day).</li>
                    <li>• <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold">Click here to check your current usage dashboard</a>.</li>
                    <li>• Try disabling "Background Watchdog" in Settings to save quota.</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(error);
                    alert("Error copied to clipboard");
                  }} 
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700"
                >
                  Copy Error
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }} 
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Clear Cache & Reset App
                </button>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Analysis Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">{analysis.ticker}</h1>
                    <div className="flex items-center gap-2">
                      <button onClick={() => addToWatchlist(analysis.ticker)} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase"><PlusIcon /> Watch</button>
                      <button onClick={() => setShowChart(!showChart)} className={`p-2 border rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase ${showChart ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400'}`}><ChartToggleIcon /> {showChart ? "Hide Chart" : "Chart"}</button>
                    </div>
                    <div className="ml-0 md:ml-auto flex flex-col items-end">
                      <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-2xl">
                        <div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live*</span>
                          <span className="text-[8px] text-slate-500 uppercase leading-none">{analysis.priceTimestamp || "Search Grounded"}</span>
                        </div>
                        <span className="text-3xl font-mono text-white font-bold leading-none">${analysis.currentPrice?.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Refreshed: {new Date(analysis.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {analysis.recommendationReason && (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                      <p className="text-sm text-indigo-300 italic">
                        <span className="font-bold uppercase text-[10px] mr-2 tracking-widest">Recommendation Context:</span>
                        {analysis.recommendationReason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">AI Recommendation</h3>
                      <p className="text-xl font-bold text-white tracking-tight">{analysis.recommendation}</p>
                    </div>
                  </div>

                  <div className="text-lg text-slate-400 max-w-2xl leading-relaxed mt-4 text-justify">
                    <ul className="space-y-2">
                      {Array.isArray(analysis.summary) ? analysis.summary.map((point, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      )) : (
                        <li>{analysis.summary}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {showChart && <div className="animate-in slide-in-from-top-4 fade-in duration-300"><StockChart key={analysis.ticker} ticker={analysis.ticker} /></div>}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnalysisCard title="Fundamental Analysis" icon={<FundamentalIcon />}>{analysis.fundamental}</AnalysisCard>
                <AnalysisCard title="Technical Analysis" icon={<TechnicalIcon />}>
                  <div className="space-y-4">
                    <p>{analysis.technical}</p>
                    <div className="pt-4 border-t border-slate-700/50 flex flex-col gap-3">
                      <div className="flex justify-between items-center px-3 py-2 bg-slate-900/40 rounded-lg border border-indigo-500/10"><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Resistance</span><span className="text-slate-100 font-mono font-bold">{analysis.resistanceLevel}</span></div>
                      <div className="flex justify-between items-center px-3 py-2 bg-slate-900/40 rounded-lg border border-emerald-500/10"><span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Support</span><span className="text-slate-100 font-mono font-bold">{analysis.supportLevel}</span></div>
                    </div>
                  </div>
                </AnalysisCard>
                <AnalysisCard title="Entry & Exit Levels" icon={<LevelsIcon />}>
                  <div className="space-y-4">
                    <div><span className="block text-indigo-400 font-semibold mb-1">Target Entry:</span><p>{analysis.entryLevel}</p></div>
                    <div><span className="block text-rose-400 font-semibold mb-1">Target Exit:</span><p>{analysis.exitLevel}</p></div>
                  </div>
                </AnalysisCard>
                <AnalysisCard title="News Impact" icon={<NewsIcon />} className="lg:col-span-2">
                  <div className="space-y-4">
                    {analysis.news.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-medium text-slate-200">{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${item.sentiment === 'positive' ? 'bg-green-500/20 text-green-500' : item.sentiment === 'negative' ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-300'}`}>{item.sentiment}</span>
                        </div>
                        <p className="text-xs text-slate-400 italic">Impact: {item.impact}</p>
                      </div>
                    ))}
                  </div>
                </AnalysisCard>
                <AnalysisCard title="Alerts & Daily Summary" icon={<AlertIcon />}>
                   <div className="space-y-4">
                      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs leading-relaxed"><span className="font-bold text-amber-500 block mb-1">MARKET PULSE</span>{analysis.dailySummary}</div>
                      <div className="text-sm text-slate-400">Proactive background scans are monitoring {analysis.ticker} news impacts.</div>
                   </div>
                </AnalysisCard>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              {/* Region Toggle */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setMarketRegion('US')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${marketRegion === 'US' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'}`}
                >
                  US Market
                </button>
                <button 
                  onClick={() => setMarketRegion('India')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${marketRegion === 'India' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'}`}
                >
                  India Market
                </button>
              </div>

              {/* Home Dashboard */}
              <div className="space-y-8">
                {/* Market Pulse Overview */}
                <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                        <PulseIcon /> {marketRegion} Market Pulse
                      </div>
                      <button 
                        onClick={() => {
                          localStorage.removeItem(`marketData_${marketRegion}`);
                          window.location.reload();
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
                      >
                        <PulseIcon /> Refresh
                      </button>
                    </div>
                    <h2 className="text-3xl font-bold text-white">{marketRegion} Overview</h2>
                    <div className="text-slate-400 leading-relaxed text-lg text-justify whitespace-pre-line max-w-4xl">
                      {marketPulse || `Fetching latest ${marketRegion} market insights...`}
                    </div>
                  </div>
                </div>

                {/* Structured Top Recommendations Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Recommendations</h3>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">AI Selected</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trending.length > 0 ? trending.map(s => (
                      <button 
                        key={s.ticker}
                        onClick={() => handleSearch(s.ticker, s.reason)} 
                        className="group text-left p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col h-full"
                      >
                        <div className="flex justify-between items-center w-full mb-3">
                          <span className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{s.ticker}</span>
                          <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                            <PlusIcon />
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors line-clamp-3">
                          {s.reason}
                        </p>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Analyze Now <ArrowUpRightIcon />
                        </div>
                      </button>
                    )) : (
                      <>
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="h-40 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-10 text-center">
                <h2 className="text-2xl font-bold text-slate-200 mb-2">Institutional-Grade Analysis</h2>
                <p className="text-slate-500 max-w-md">Search any ticker above to get real-time AI grounded analysis on fundamentals, technicals, and news.</p>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                   {['Live Search', 'Technical Bias', 'Price Alerts', 'News Impact'].map(feat => (
                     <div key={feat} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">{feat}</div>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"><ChatIcon /></button>
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-md h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-100 text-sm">Stock AI Assistant</h3>
            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>{msg.text || "Thinking..."}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-2">
            <input type="text" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-sm text-slate-200 focus:outline-none" placeholder="Ask about stocks..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
            <button onClick={handleSendMessage} className="p-2 bg-indigo-600 rounded-xl text-white"><SendIcon /></button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Application Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Alert Contact Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Contact Information</h4>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Email</label><input type="email" className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg" value={prefs.email} onChange={(e) => setPrefs({ ...prefs, email: e.target.value })} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Phone</label><input type="tel" className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg" value={prefs.phone} onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })} /></div>
                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                  <div><span className="text-sm font-medium text-slate-200">Push Notifications</span><span className="block text-[10px] text-emerald-400 font-bold uppercase">Browser Alerts</span></div>
                  <input type="checkbox" className="w-5 h-5 rounded" checked={prefs.enableBrowserPush} onChange={(e) => {
                    if (e.target.checked && typeof Notification !== 'undefined' && Notification.permission !== 'granted') Notification.requestPermission();
                    setPrefs({ ...prefs, enableBrowserPush: e.target.checked });
                  }} />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                  <div><span className="text-sm font-medium text-slate-200">Background Watchdog</span><span className="block text-[10px] text-slate-500 font-bold uppercase">Auto-scan Watchlist</span></div>
                  <input type="checkbox" className="w-5 h-5 rounded" checked={prefs.enableBackgroundMonitoring} onChange={(e) => setPrefs({ ...prefs, enableBackgroundMonitoring: e.target.checked })} />
                </label>
                {!prefs.enableBackgroundMonitoring && (
                  <p className="text-[9px] text-emerald-400 px-1 italic">Recommended for Free Tier to save API quota.</p>
                )}

                <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                  <div><span className="text-sm font-medium text-slate-200">High Impact Only</span><span className="block text-[10px] text-slate-500 font-bold uppercase">Filter Noise</span></div>
                  <input type="checkbox" className="w-5 h-5 rounded" checked={prefs.onlyHighImpact} onChange={(e) => setPrefs({ ...prefs, onlyHighImpact: e.target.checked })} />
                </label>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Alert Memory</h4>
                  <button 
                    onClick={() => {
                      setAlertHistory([]);
                      alert("Alert history cleared. You may see previous alerts again if they are still relevant.");
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded-lg transition-colors border border-slate-700 flex justify-between px-4 items-center"
                  >
                    <span>Clear Alert History</span>
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-white">{alertHistory.length}</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Vercel / Production Fix</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                    If your Vercel deployment shows "Market data unavailable", it's likely because the environment variable wasn't baked into the build. You can paste your key here to fix it instantly.
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Manual Gemini API Key</label>
                    <input 
                      type="password" 
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-xs font-mono" 
                      placeholder="AIzaSy..." 
                      value={prefs.customApiKey} 
                      onChange={(e) => setPrefs({ ...prefs, customApiKey: e.target.value })} 
                    />
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[9px] text-indigo-400 hover:underline mt-1 block"
                    >
                      Check your Quota & API usage here →
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quota Management</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                    If you frequently see "Quota Exceeded" errors, you can connect your own paid Google Cloud API key for higher limits.
                  </p>
                  <button 
                    onClick={async () => {
                      if (window.aistudio) {
                        try {
                          await window.aistudio.openSelectKey();
                          window.location.reload(); 
                        } catch (err) {
                          console.error("Failed to open key selector:", err);
                        }
                      }
                    }}
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[10px] font-bold uppercase rounded-lg transition-colors border border-indigo-500/30 flex justify-center items-center gap-2"
                  >
                    <GlobeIcon /> Use Paid API Key
                  </button>
                </div>
              </div>

              {/* Deployment Guide */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <GlobeIcon /> Public URL Guide (Free)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  To get a public URL for this app for free:
                </p>
                <ul className="text-[11px] space-y-2 text-slate-300">
                  <li>• **Vercel**: Connect your GitHub repo for instant zero-config hosting.</li>
                  <li>• **Firebase**: Use Google's Firebase Hosting 'No Cost' plan.</li>
                  <li>• **Mobile**: Once hosted, open the URL in Chrome/Safari and select "Add to Home Screen" to install it.</li>
                </ul>
              </div>
            </div>
            <div className="p-4 bg-slate-800 border-t border-slate-700">
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold transition-colors">Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Setup */}
      {showAlertDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Set Price Alert for {showAlertDialog}</h3>
            <div className="space-y-4">
              <select className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg" value={alertForm.condition} onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value as 'above' | 'below' })}>
                <option value="above">Price ABOVE</option><option value="below">Price BELOW</option>
              </select>
              <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg" placeholder="Target Price" value={alertForm.price} onChange={(e) => setAlertForm({ ...alertForm, price: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAlertDialog(null)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300">Cancel</button>
                <button onClick={handleSetAlert} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold">Set Alert</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;