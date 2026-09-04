import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'amber', trend }) => {
  const colorMap = {
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30',
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
  };

  const iconBgMap = {
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-b ${colorMap[color] || colorMap.amber} border backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-2 font-['Outfit']">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${iconBgMap[color] || iconBgMap.amber}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
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
