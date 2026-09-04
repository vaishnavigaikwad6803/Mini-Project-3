import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-5">
        <div className="inline-flex h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h1 className="text-4xl font-extrabold text-white font-['Outfit']">404 – Page Not Found</h1>
        <p className="text-xs text-slate-400">
          The road sector or page you are trying to reach does not exist or has been relocated.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <Home className="h-4 w-4" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
