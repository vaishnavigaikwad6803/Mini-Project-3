import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ text = 'Loading data...', size = 'md', className = '' }) => {
  const spinnerSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md animate-ping" />
        <div className="relative p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <Loader2 className={`${spinnerSize} text-amber-500 animate-spin`} />
        </div>
      </div>
      {text && (
        <p className="text-xs sm:text-sm font-medium text-slate-400 mt-4 tracking-wide animate-pulse max-w-xs">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
