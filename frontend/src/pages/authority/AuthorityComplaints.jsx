import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { authorityService } from '../../services/authorityService';
import { complaintService } from '../../services/complaintService';
import StatusBadge from '../../components/common/StatusBadge';
import RoadTypeBadge from '../../components/common/RoadTypeBadge';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  Building2,
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  AlertCircle,
  HardHat,
  Trash2,
  RefreshCw,
  ClipboardCheck
} from 'lucide-react';

const AuthorityComplaints = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedComplaintForDelete, setSelectedComplaintForDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchComplaints = async () => {
    try {
      setError('');
      let authId = user?.authority_id;
      if (!authId) {
        const auths = await authorityService.getAuthorities();
        if (auths.length > 0) authId = auths[0].id;
      }
      if (authId) {
        const data = await authorityService.getAuthorityComplaints(authId);
        setComplaints(data);
      }
    } catch (err) {
      console.error("Error fetching authority complaints:", err);
      setError('Unable to load complaints for your authority. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

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
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete complaint.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(term) ||
        c.road_name.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term) ||
        (c.engineer_name && c.engineer_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">

      {/* Error state banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchComplaints(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
          Authority Records
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
          Jurisdiction Road Complaints
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage all incoming, in-repair, and verified road damage reports assigned to your division.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Complaint ID, Road Name, Engineer, or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Authority Assigned">Authority Assigned</option>
          <option value="Engineer Assigned">Engineer Assigned</option>
          <option value="Inspection Completed">Inspected</option>
          <option value="Repair In Progress">In Repair</option>
          <option value="Repair Completed">Repair Completed</option>
          <option value="Authority Verification">Under Verification</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Complaints List */}
      {loading ? (
        <Loader text="Loading complaints..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={complaints.length === 0 ? "No Complaints Assigned" : "No Matching Complaints"}
          description={
            complaints.length === 0
              ? "There are currently no road damage complaints assigned to your jurisdiction."
              : "No records match your active search filter. Try clearing your filters or search keywords."
          }
          actionLabel={complaints.length > 0 ? "Clear Filters" : undefined}
          onAction={complaints.length > 0 ? () => { setSearchTerm(''); setStatusFilter('ALL'); } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden sm:block p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Road Name</th>
                    <th className="py-3 px-4">Road Type</th>
                    <th className="py-3 px-4">AI Defect & Severity</th>
                    <th className="py-3 px-4">Engineer Name</th>
                    <th className="py-3 px-4">Citizen</th>
                    <th className="py-3 px-4">Status</th>
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
                        {c.citizen_name || 'Citizen'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(c.status === 'Authority Verification' || c.status === 'Repair Completed') && (
                            <Link
                              to={`/complaints/${c.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                              title="Review & Verify Repair"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" /> Verify
                            </Link>
                          )}
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

          {/* Mobile Card View (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">{c.id}</span>
                  <StatusBadge status={c.status} size="xs" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{c.road_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">📍 {c.district} • {c.primary_damage_type || 'Road Defect'}</p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Engineer:</span>
                  <span className="font-semibold text-cyan-300">{c.engineer_name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  {(c.status === 'Authority Verification' || c.status === 'Repair Completed') && (
                    <Link
                      to={`/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" /> Verify
                    </Link>
                  )}
                  <Link
                    to={`/complaints/${c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white font-semibold text-xs border border-rose-500/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
              You are about to delete complaint <strong>{selectedComplaintForDelete?.id}</strong> ({selectedComplaintForDelete?.road_name}). A mandatory reason must be provided for audit records and citizen notification.
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
              placeholder="e.g. Duplicate complaint report, invalid location outside municipal boundary, or test submission..."
              className="input-field border-rose-500/50 focus:border-rose-500"
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

export default AuthorityComplaints;
