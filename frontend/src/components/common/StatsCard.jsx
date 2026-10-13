import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'amber', trend, className = '' }) => {
  const colorMap = {
    amber: 'from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/30 text-amber-400 group-hover:border-amber-500/50',
    emerald: 'from-emerald-500/15 via-slate-900 to-slate-900 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/50',
    cyan: 'from-cyan-500/15 via-slate-900 to-slate-900 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-500/50',
    rose: 'from-rose-500/15 via-slate-900 to-slate-900 border-rose-500/30 text-rose-400 group-hover:border-rose-500/50',
    indigo: 'from-indigo-500/15 via-slate-900 to-slate-900 border-indigo-500/30 text-indigo-400 group-hover:border-indigo-500/50',
    purple: 'from-purple-500/15 via-slate-900 to-slate-900 border-purple-500/30 text-purple-400 group-hover:border-purple-500/50',
  };

  const iconBgMap = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:bg-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 group-hover:bg-cyan-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:bg-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30 group-hover:bg-purple-500/20',
  };

  return (
    <div className={`group p-5 rounded-2xl bg-gradient-to-b ${colorMap[color] || colorMap.amber} border shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${className}`}>
      {/* Top subtle decorative ambient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-40" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-['Outfit'] tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${iconBgMap[color] || iconBgMap.amber}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{trend.label}</span>
          <span className={trend.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
