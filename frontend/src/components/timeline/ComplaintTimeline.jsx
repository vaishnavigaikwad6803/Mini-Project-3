import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  Cpu, 
  Building2, 
  HardHat, 
  Wrench, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

const STANDARD_STAGES = [
  { key: 'Submitted', label: 'Complaint Submitted', icon: Clock },
  { key: 'AI Analyzed', label: 'AI Damage Detection', icon: Cpu },
  { key: 'Authority Assigned', label: 'Authority Assigned', icon: Building2 },
  { key: 'Engineer Assigned', label: 'Engineer Assigned', icon: HardHat },
  { key: 'Inspection Completed', label: 'Site Inspection', icon: CheckCircle2 },
  { key: 'Repair In Progress', label: 'Repair in Progress', icon: Wrench },
  { key: 'Repair Completed', label: 'Repair Completed', icon: CheckCircle2 },
  { key: 'Authority Verification', label: 'Authority Verification', icon: ShieldCheck },
  { key: 'Closed', label: 'Complaint Closed', icon: CheckCircle2 },
];

const ComplaintTimeline = ({ history = [], currentStatus = 'Submitted' }) => {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
      <h3 className="text-base font-bold text-white font-['Outfit'] mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-500" />
        Complaint Progress Timeline & Audit Trail
      </h3>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No timeline history recorded yet.</p>
        ) : (
          history.map((step, idx) => {
            const isLatest = idx === history.length - 1;
            const isClosed = step.to_status === 'Closed';

            return (
              <div key={step.id || idx} className="relative group">
                
                {/* Node Icon */}
                <div className={`absolute -left-6 sm:-left-8 top-0.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center border-2 ${
                  isClosed
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : isLatest
                    ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  {isClosed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Content Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isLatest
                    ? 'bg-slate-800/80 border-amber-500/40 shadow-md'
                    : 'bg-slate-800/30 border-slate-800'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {step.to_status}
                      </h4>
                      {step.changed_by_role && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-medium">
                          {step.changed_by_role}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(step.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {step.remarks && (
                    <p className="text-xs text-slate-300 mt-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                      {step.remarks}
                    </p>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
