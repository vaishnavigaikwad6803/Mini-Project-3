import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ text = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      <p className="text-sm font-medium text-slate-400 mt-4 tracking-wide">{text}</p>
    </div>
  );
};

export default Loader;
