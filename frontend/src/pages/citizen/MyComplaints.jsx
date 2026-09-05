import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Loader from '../../components/common/Loader';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  MapPin, 
  Calendar, 
  AlertTriangle 
} from 'lucide-react';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roadTypeFilter, setRoadTypeFilter] = useState('ALL');

  useEffect(() => {
    complaintService.getMyComplaints()
      .then((data) => setComplaints(data))
      .catch((err) => console.error("Error fetching my complaints:", err))
      .finally(() => setLoading(false));
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
            Citizen Grievance Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            My Submitted Complaints
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track status transitions, AI damage scores, and authority repair certifications.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, Road Name, or District..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="AI Analyzed">AI Analyzed</option>
            <option value="Authority Assigned">Authority Assigned</option>
            <option value="Engineer Assigned">Engineer Assigned</option>
            <option value="Inspection Completed">Inspected</option>
            <option value="Repair In Progress">In Repair</option>
            <option value="Repair Completed">Repair Completed</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={roadTypeFilter}
            onChange={(e) => setRoadTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Road Types</option>
            <option value="National Highway">National Highway</option>
            <option value="State Highway">State Highway</option>
            <option value="Municipal/City Road">Municipal Road</option>
            <option value="Rural/Village Road">Rural Road</option>
          </select>

        </div>

      </div>

      {/* Complaints Table */}
      {loading ? (
        <Loader text="Retrieving your complaints..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
          <AlertTriangle className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300 mt-3">No matching complaints found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query or filters.</p>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Road Name</th>
                  <th className="py-3 px-4">Road Type</th>
                  <th className="py-3 px-4">AI Detection & Severity</th>
                  <th className="py-3 px-4">Authority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {c.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                      <span className="text-[11px] text-slate-400">📍 {c.district}, {c.state}</span>
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
                        {c.priority} Priority
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.authority_name || 'Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyComplaints;
