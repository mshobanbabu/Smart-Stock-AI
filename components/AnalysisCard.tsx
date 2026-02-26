
import React from 'react';

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, icon, children, className = "" }) => {
  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-5 shadow-lg backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="text-slate-300 leading-relaxed text-sm">
        {children}
      </div>
    </div>
  );
};

export default AnalysisCard;
