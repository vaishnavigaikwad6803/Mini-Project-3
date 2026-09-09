import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { authorityService } from '../../services/authorityService';
import { useNotifications } from '../../context/NotificationContext';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import {
  FileText,
  Search,
  Filter,
  Eye,
  MapPin,
  Download,
  AlertCircle,
  HardHat,
  Trash2
} from 'lucide-react';

const ManageComplaints = () => {
  const { showToast } = useNotifications();
  const [complaints, setComplaints] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roadTypeFilter, setRoadTypeFilter] = useState('ALL');

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedComplaintForDelete, setSelectedComplaintForDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [complaintsData, authsData] = await Promise.all([
        complaintService.getComplaints(),
        authorityService.getAuthorities(),
      ]);
      setComplaints(complaintsData);
      setAuthorities(authsData);
    } catch (err) {
      console.error("Error loading complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDeleteModal = (complaint) => {
    setSelectedComplaintForDelete(complaint);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintForDelete) return;
    if (!deleteReason || deleteReason.trim().length < 3) {
      showToast('Please provide a valid deletion reason (minimum 3 characters).', 'error');
      return;
    }

    setDeleting(true);
    try {
      await complaintService.deleteComplaint(selectedComplaintForDelete.id, deleteReason.trim());
      showToast(`Complaint #${selectedComplaintForDelete.id} deleted successfully.`, 'success');
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete complaint.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (complaints.length === 0) return;
    const headers = ["ID", "Road Name", "Road Type", "District", "State", "Status", "Priority", "AI Damage", "AI Confidence", "Authority", "Engineer Name", "Created At"];
    const rows = complaints.map((c) => [
      c.id,
      `"${c.road_name.replace(/"/g, '""')}"`,
      c.road_type,
      c.district,
      c.state,
      c.status,
      c.priority,
      c.primary_damage_type || "N/A",
      c.ai_confidence ? `${Math.round(c.ai_confidence * 100)}%` : "N/A",
      `"${(c.authority_name || "").replace(/"/g, '""')}"`,
      `"${(c.engineer_name || "Unassigned").replace(/"/g, '""')}"`,
      new Date(c.created_at).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RoadGuard_Complaints_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (roadTypeFilter !== 'ALL' && c.road_type !== roadTypeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(term) ||
        c.road_name.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term) ||
        (c.authority_name && c.authority_name.toLowerCase().includes(term)) ||
        (c.engineer_name && c.engineer_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
            System Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Global Road Damage Complaints
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive audit register of all road damage complaints across all authority jurisdictions.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 shadow-md"
        >
          <Download className="h-4 w-4 text-amber-400" /> Export CSV Report
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">

        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, Road, District, Authority, or Engineer..."
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

      {/* Table */}
      {loading ? (
        <Loader text="Loading global complaints..." />
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Road Name</th>
                  <th className="py-3 px-4">Road Type</th>
                  <th className="py-3 px-4">AI Defect & Severity</th>
                  <th className="py-3 px-4">Engineer Name</th>
                  <th className="py-3 px-4">Assigned Authority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{c.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block max-w-xs truncate">{c.road_name}</span>
                      <span className="text-[11px] text-slate-400">📍 {c.district}, {c.state}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <RoadTypeBadge roadType={c.road_type} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200 block">{c.primary_damage_type || 'Road Defect'}</span>
                      {c.ai_confidence && (
                        <span className="text-[10px] text-cyan-400">
                          AI: {Math.round(c.ai_confidence * 100)}% ({c.ai_severity || 'Medium'})
                        </span>
                      )}
                    </td>
                    {/* Engineer Name Column (Req 6) */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.engineer_name ? (
                        <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                          <HardHat className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span>{c.engineer_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Link>
                        {/* Delete with reason button (Req 5) */}
                        <button
                          type="button"
                          onClick={() => openDeleteModal(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white font-semibold text-xs border border-rose-500/30 transition-colors shadow-sm"
                          title="Delete Complaint"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Complaint Reason Modal (Req 5) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete Complaint: ${selectedComplaintForDelete?.id}`}
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              Warning: Irreversible Complaint Deletion
            </p>
            <p className="text-[11px] text-rose-200">
              You are about to delete complaint <strong>{selectedComplaintForDelete?.id}</strong> ({selectedComplaintForDelete?.road_name}). A mandatory reason must be provided for audit logs and citizen notification.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Reason for Deletion * <span className="text-rose-400 font-normal">(Required)</span>
            </label>
            <textarea
              rows={3}
              required
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Invalid/duplicate complaint report, out of jurisdictional bounds, or resolved offline..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting || !deleteReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ManageComplaints;
