import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Clock,
  Cpu,
  Building2,
  HardHat,
  Search,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  AlertCircle
} from 'lucide-react';

const StatusBadge = ({ status, size = 'sm', showDot = false }) => {
  const { t } = useLanguage();

  const getBadgeConfig = (st) => {
    switch (st) {
      case 'Submitted':
        return {
          bg: 'bg-slate-800/90 text-slate-200 border-slate-700/80',
          dot: 'bg-slate-400',
          icon: Clock,
          label: t('status.PENDING', 'Submitted'),
        };
      case 'AI Analyzed':
        return {
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
          dot: 'bg-cyan-400',
          icon: Cpu,
          label: t('status.VERIFIED', 'AI Analyzed'),
        };
      case 'Authority Assigned':
        return {
          bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
          dot: 'bg-indigo-400',
          icon: Building2,
          label: t('status.VERIFIED', 'Authority Assigned'),
        };
      case 'Under Review':
        return {
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
          dot: 'bg-blue-400',
          icon: Search,
          label: t('status.AUTHORITY_VERIFICATION', 'Under Review'),
        };
      case 'Engineer Assigned':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
          dot: 'bg-amber-400',
          icon: HardHat,
          label: t('status.ENGINEER_ASSIGNED', 'Engineer Assigned'),
        };
      case 'Inspection Pending':
        return {
          bg: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
          dot: 'bg-orange-400 animate-pulse',
          icon: Clock,
          label: t('status.PENDING', 'Inspection Pending'),
        };
      case 'Inspection Completed':
        return {
          bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/35',
          dot: 'bg-yellow-400',
          icon: CheckCircle2,
          label: t('status.VERIFIED', 'Inspected'),
        };
      case 'Repair Started':
      case 'Repair In Progress':
        return {
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
          dot: 'bg-purple-400 animate-ping',
          icon: Wrench,
          label: t('status.IN_PROGRESS', 'In Repair'),
        };
      case 'Repair Completed':
        return {
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/35',
          dot: 'bg-teal-400',
          icon: CheckCircle2,
          label: t('status.REPAIR_COMPLETED', 'Repair Completed'),
        };
      case 'Authority Verification':
        return {
          bg: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
          dot: 'bg-sky-400',
          icon: ShieldCheck,
          label: t('status.AUTHORITY_VERIFICATION', 'Verifying'),
        };
      case 'Closed':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
          label: t('status.CLOSED', 'Resolved & Closed'),
        };
      case 'Rejected':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
          dot: 'bg-rose-400',
          icon: XCircle,
          label: t('status.REJECTED', 'Rejected'),
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
          icon: AlertCircle,
          label: status || 'Unknown',
        };
    }
  };

  const { bg, dot, icon: Icon, label } = getBadgeConfig(status);

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px] gap-1'
    : size === 'md'
      ? 'px-3 py-1.5 text-xs gap-2'
      : 'px-2.5 py-1 text-xs gap-1.5';

  const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold border shadow-sm backdrop-blur-sm whitespace-nowrap ${bg} ${sizeClasses}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      <Icon className={`${iconSize} shrink-0`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
