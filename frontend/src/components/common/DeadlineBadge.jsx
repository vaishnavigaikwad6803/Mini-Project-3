import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * DeadlineBadge Component
 * Displays the target resolution deadline with color-coded urgency and countdown:
 * - Overdue: Rose / Red with Alert icon
 * - Urgent (<= 2 days): Amber with Clock icon
 * - Standard (> 2 days): Cyan / Indigo with Calendar icon
 * - Completed / Closed: Emerald with Check icon
 */
export const formatDeadlineDate = (deadline) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDeadlineDateTime = (deadline) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DeadlineBadge = ({
  deadline,
  status,
  showIcon = true,
  size = 'sm', // 'xs' | 'sm' | 'md' | 'lg'
  showCountdown = true,
  className = '',
}) => {
  if (!deadline) return null;

  const target = new Date(deadline);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isCompleted = ['Repair Completed', 'Authority Verification', 'Closed'].includes(status);
  const isOverdue = !isCompleted && diffMs < 0;
  const isUrgent = !isCompleted && !isOverdue && diffDays <= 2;

  const formattedDate = formatDeadlineDate(deadline);
  const formattedFull = formatDeadlineDateTime(deadline);

  let badgeStyle = '';
  let IconComponent = Calendar;
  let labelText = '';

  if (isCompleted) {
    badgeStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    IconComponent = CheckCircle2;
    labelText = `Target: ${formattedDate}`;
  } else if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    IconComponent = AlertTriangle;
    labelText = showCountdown
      ? `Overdue (${overdueDays}d ago) • Due: ${formattedDate}`
      : `Overdue • ${formattedDate}`;
  } else if (isUrgent) {
    badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    IconComponent = Clock;
    const timeText = diffHours <= 24 ? `${Math.max(1, diffHours)}h left` : `${diffDays}d left`;
    labelText = showCountdown
      ? `Due in ${timeText} • ${formattedDate}`
      : `Urgent • ${formattedDate}`;
  } else {
    badgeStyle = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    IconComponent = Calendar;
    labelText = showCountdown
      ? `${diffDays}d left • ${formattedDate}`
      : `Due: ${formattedDate}`;
  }

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-1.5',
    lg: 'text-sm px-4 py-2 gap-2 font-bold',
  }[size] || 'text-[11px] px-2.5 py-1 gap-1.5';

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-4.5 w-4.5',
  }[size] || 'h-3.5 w-3.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border shadow-sm ${sizeClasses} ${badgeStyle} ${className}`}
      title={`Target Resolution Deadline: ${formattedFull}`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span>{labelText}</span>
    </span>
  );
};

export default DeadlineBadge;
