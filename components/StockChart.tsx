
import React, { useEffect, useRef } from 'react';

interface StockChartProps {
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || !ticker) return;

    const currentContainer = container.current;
    currentContainer.innerHTML = '';

    const chartId = `tv-chart-${ticker.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const widgetDiv = document.createElement('div');
    widgetDiv.id = chartId;
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    currentContainer.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    const symbol = ticker.includes(':') 
      ? ticker 
      : (ticker.length <= 5 ? `NASDAQ:${ticker}` : `NSE:${ticker}`);

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "container_id": chartId
    });

    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [ticker]);

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-2xl h-[450px] shadow-2xl tradingview-widget-container" 
      ref={container}
    />
  );
};

export default StockChart;
