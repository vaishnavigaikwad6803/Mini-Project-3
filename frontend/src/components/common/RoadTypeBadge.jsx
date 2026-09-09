import React from 'react';

const RoadTypeBadge = ({ roadType, size = 'sm', showDivisionTag = true }) => {
  const getBadgeConfig = (rt) => {
    switch (rt) {
      case 'National Highway':
        return {
          tag: 'NH',
          label: 'National Highway',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30',
          icon: '🛣️'
        };
      case 'State Highway':
        return {
          tag: 'State',
          label: 'State Highway (PWD)',
          classes: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30',
          icon: '🛣️'
        };
      case 'Municipal/City Road':
        return {
          tag: 'Munci',
          label: 'Municipal Road (City)',
          classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
          icon: '🏙️'
        };
      case 'Rural/Village Road':
        return {
          tag: 'Rural',
          label: 'Rural Road (ZP/PMGSY)',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
          icon: '🌾'
        };
      default:
        return {
          tag: 'Road',
          label: roadType || 'Road',
          classes: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: '📍'
        };
    }
  };

  const config = getBadgeConfig(roadType);
  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px]'
    : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold border transition-all ${config.classes} ${sizeClasses}`}
      title={`${config.label} - Maharashtra Division`}
    >
      <span>{config.icon}</span>
      {showDivisionTag && (
        <span className="font-mono font-bold uppercase tracking-wider opacity-90 px-1 py-0.2 rounded bg-black/20 text-[10px]">
          {config.tag}
        </span>
      )}
      <span className="truncate">{config.label}</span>
    </span>
  );
};

export default RoadTypeBadge;
