import React from 'react';
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

const StatusBadge = ({ status }) => {
  const getBadgeConfig = (st) => {
    switch (st) {
      case 'Submitted':
        return {
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700',
          icon: Clock,
          label: 'Submitted',
        };
      case 'AI Analyzed':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: Cpu,
          label: 'AI Analyzed',
        };
      case 'Authority Assigned':
        return {
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: Building2,
          label: 'Authority Assigned',
        };
      case 'Under Review':
        return {
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: Search,
          label: 'Under Review',
        };
      case 'Engineer Assigned':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: HardHat,
          label: 'Engineer Assigned',
        };
      case 'Inspection Pending':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: Clock,
          label: 'Inspection Pending',
        };
      case 'Inspection Completed':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          icon: CheckCircle2,
          label: 'Inspected',
        };
      case 'Repair Started':
      case 'Repair In Progress':
        return {
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: Wrench,
          label: 'In Repair',
        };
      case 'Repair Completed':
        return {
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          icon: CheckCircle2,
          label: 'Repair Completed',
        };
      case 'Authority Verification':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: ShieldCheck,
          label: 'Verifying',
        };
      case 'Closed':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
          label: 'Resolved & Closed',
        };
      case 'Rejected':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: XCircle,
          label: 'Rejected',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: AlertCircle,
          label: status || 'Unknown',
        };
    }
  };

  const { bg, icon: Icon, label } = getBadgeConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
