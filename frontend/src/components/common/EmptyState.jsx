import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, ArrowRight } from 'lucide-react';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  actionLabel,
  actionText,
  actionTo,
  onAction,
  secondaryActionLabel,
  secondaryActionText,
  secondaryActionTo,
  onSecondaryAction,
  className = ''
}) => {
  const finalActionLabel = actionLabel || actionText;
  const finalSecondaryActionLabel = secondaryActionLabel || secondaryActionText;

  return (
    <div className={`p-8 sm:p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-inner">
        <Icon className="h-7 w-7 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-white font-['Outfit']">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {(finalActionLabel || finalSecondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {finalActionLabel && (
            actionTo ? (
              <Link to={actionTo} className="btn-primary">
                <span>{finalActionLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button onClick={onAction} className="btn-primary">
                <span>{finalActionLabel}</span>
              </button>
            )
          )}

          {finalSecondaryActionLabel && (
            secondaryActionTo ? (
              <Link to={secondaryActionTo} className="btn-secondary">
                <span>{finalSecondaryActionLabel}</span>
              </Link>
            ) : (
              <button onClick={onSecondaryAction} className="btn-secondary">
                <span>{finalSecondaryActionLabel}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
