import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileText,
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  AlertTriangle,
  PlusCircle,
  Building2,
  Cpu,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const MyComplaints = () => {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roadTypeFilter, setRoadTypeFilter] = useState('ALL');

  const fetchMyComplaints = () => {
    setError('');
    complaintService.getMyComplaints()
      .then((data) => setComplaints(data))
      .catch((err) => {
        console.error("Error fetching my complaints:", err);
        setError('Unable to load your complaints. Please check your network connection.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (roadTypeFilter !== 'ALL' && c.road_type !== roadTypeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(term) ||
        c.road_name.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Error state banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchMyComplaints(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t('common.retry')}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
            {t('citizen.myReports')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            {t('citizen.myReports')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('citizen.activeComplaintsSubtitle')}
          </p>
        </div>

        <Link
          to="/citizen/report"
          className="btn-primary flex items-center gap-2 text-xs shadow-lg shadow-amber-500/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t('citizen.reportNew')}</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">

        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">{t('citizen.allStatuses') || t('common.all')}</option>
            <option value="Submitted">{t('status.PENDING')}</option>
            <option value="AI Analyzed">{t('status.VERIFIED')}</option>
            <option value="Authority Assigned">{t('status.AUTHORITY_VERIFICATION')}</option>
            <option value="Engineer Assigned">{t('status.ENGINEER_ASSIGNED')}</option>
            <option value="Inspection Completed">{t('status.VERIFIED')}</option>
            <option value="Repair In Progress">{t('status.IN_PROGRESS')}</option>
            <option value="Repair Completed">{t('status.REPAIR_COMPLETED')}</option>
            <option value="Closed">{t('status.CLOSED')}</option>
          </select>

          <select
            value={roadTypeFilter}
            onChange={(e) => setRoadTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">{t('roadTypes.allRoadTypes')}</option>
            <option value="National Highway">{t('roadTypes.nationalHighway')}</option>
            <option value="State Highway">{t('roadTypes.stateHighway')}</option>
            <option value="Municipal/City Road">{t('roadTypes.municipalRoad')}</option>
            <option value="Rural/Village Road">{t('roadTypes.ruralRoad')}</option>
          </select>

        </div>

      </div>

      {/* Complaints List */}
      {loading ? (
        <Loader text={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={complaints.length === 0 ? "No Complaints Submitted Yet" : "No Matching Complaints"}
          description={
            complaints.length === 0
              ? "You haven't reported any road damages yet. Help keep Maharashtra roads safe by reporting road hazards!"
              : "No records match your active search filter. Try clearing your filters or search keywords."
          }
          actionLabel={complaints.length === 0 ? t('citizen.reportRoadHazard') : t('common.clearFilters')}
          actionTo={complaints.length === 0 ? "/citizen/report" : undefined}
          onAction={complaints.length > 0 ? () => { setSearchTerm(''); setStatusFilter('ALL'); setRoadTypeFilter('ALL'); } : undefined}
        />
      ) : (
        <div className="space-y-4">

          {/* Desktop Table View */}
          <div className="hidden sm:block p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{t('table.id')}</th>
                    <th className="py-3 px-4">{t('table.date')}</th>
                    <th className="py-3 px-4">{t('table.roadName')}</th>
                    <th className="py-3 px-4">{t('table.location')}</th>
                    <th className="py-3 px-4">{t('table.roadType')}</th>
                    <th className="py-3 px-4">{t('table.aiDetection')}</th>
                    <th className="py-3 px-4">{t('table.authority')}</th>
                    <th className="py-3 px-4">{t('table.status')}</th>
                    <th className="py-3 px-4 text-right">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 max-w-[130px] truncate" title={c.id}>
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="font-medium text-slate-200 block">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                        {c.created_at && (
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <Link
                          to={`/map?id=${encodeURIComponent(c.id)}${c.latitude && c.longitude ? `&lat=${c.latitude}&lng=${c.longitude}` : ''}`}
                          className="flex items-start gap-1.5 group cursor-pointer hover:bg-slate-800/80 p-1.5 -m-1.5 rounded-xl transition-all"
                          title="Click to locate on Live GIS Map"
                        >
                          <MapPin className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 group-hover:text-amber-300 transition-transform" />
                          <div>
                            <span className="text-white font-medium block group-hover:text-amber-400 group-hover:underline underline-offset-2 transition-colors">
                              {c.district ? `${c.district}, ${c.state || ''}` : 'Location Pin'}
                            </span>
                            {c.landmark ? (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px] group-hover:text-slate-300">{c.landmark}</span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono block group-hover:text-slate-400">
                                {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <RoadTypeBadge roadType={c.road_type} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-semibold block">
                          {c.primary_damage_type || c.damage_type || 'Road Defect'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                          c.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {t(`priority.${c.priority}`) || c.priority} {t('common.priority')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {c.authority_name || 'Pending'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> {t('common.details')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                  <StatusBadge status={c.status} size="xs" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                    <span>{c.district}, {c.state}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
                  <RoadTypeBadge roadType={c.road_type} size="sm" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    c.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                    c.priority === 'High' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {t(`priority.${c.priority}`) || c.priority} {t('common.priority')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>{new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <Link
                    to={`/complaints/${c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Eye className="h-3 w-3" /> {t('common.viewDetails')}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};

export default MyComplaints;
