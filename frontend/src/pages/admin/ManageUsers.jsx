import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useNotifications } from '../../context/NotificationContext';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import {
  Users,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Edit3,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from 'lucide-react';

const ROLES = ['CITIZEN', 'AUTHORITY', 'ENGINEER', 'ADMIN'];

const ManageUsers = () => {
  const { showToast } = useNotifications();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'CITIZEN',
    district: '',
    state: '',
    is_active: true,
  });
  const [updating, setUpdating] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEditModal = (u) => {
    setSelectedUser(u);
    setEditForm({
      full_name: u.full_name,
      role: u.role,
      district: u.district || '',
      state: u.state || '',
      is_active: u.is_active,
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdating(true);
    try {
      await adminService.updateUser(selectedUser.id, editForm);
      showToast(`User ${editForm.full_name} updated successfully!`, 'success');
      setEditModalOpen(false);
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update user', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.district && u.district.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div>
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
          User Directory & Access Control
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
          Manage System Users
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          View all registered Citizens, Authority Officers, Field Engineers, and Administrators.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Name, Email, or District..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Roles</option>
          <option value="CITIZEN">Citizen</option>
          <option value="AUTHORITY">Authority</option>
          <option value="ENGINEER">Engineer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading user directory..." />
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <strong className="text-white block">{u.full_name}</strong>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${u.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          u.role === 'AUTHORITY' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                            u.role === 'ENGINEER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {u.district ? `📍 ${u.district}, ${u.state}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${u.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User: ${selectedUser?.email}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">District</label>
              <input
                type="text"
                value={editForm.district}
                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="rounded text-amber-500"
              />
              <span className="font-semibold text-slate-200">Account Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ManageUsers;
