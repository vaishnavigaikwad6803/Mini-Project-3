import React, { useState, useEffect } from 'react';
import { authorityService } from '../../services/authorityService';
import { useNotifications } from '../../context/NotificationContext';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import {
  Building2,
  PlusCircle,
  Search,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AUTHORITY_TYPES = [
  'National Highway Authority',
  'State Highway/PWD Authority',
  'Municipal Authority',
  'Rural Road Authority'
];

const ROAD_TYPES = [
  'National Highway',
  'State Highway',
  'Municipal/City Road',
  'Rural/Village Road'
];

const ManageAuthorities = () => {
  const { showToast } = useNotifications();
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    authority_type: 'National Highway Authority',
    road_type_coverage: 'National Highway',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    jurisdiction_area: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAuthorities = async () => {
    try {
      const data = await authorityService.getAuthorities();
      setAuthorities(data);
    } catch (err) {
      console.error("Error loading authorities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthorities();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      code: `AUTH-${Date.now().toString().slice(-4)}`,
      name: '',
      authority_type: 'National Highway Authority',
      road_type_coverage: 'National Highway',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      jurisdiction_area: '',
      contact_email: '',
      contact_phone: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (auth) => {
    setIsEditing(true);
    setEditingId(auth.id);
    setFormData({
      code: auth.code,
      name: auth.name,
      authority_type: auth.authority_type,
      road_type_coverage: auth.road_type_coverage,
      state: auth.state,
      district: auth.district,
      jurisdiction_area: auth.jurisdiction_area || '',
      contact_email: auth.contact_email,
      contact_phone: auth.contact_phone,
      is_active: auth.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await authorityService.updateAuthority(editingId, formData);
        showToast('Authority updated successfully!', 'success');
      } else {
        await authorityService.createAuthority(formData);
        showToast('New road authority registered successfully!', 'success');
      }
      setModalOpen(false);
      loadAuthorities();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save authority', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = authorities.filter((a) => {
    if (typeFilter !== 'ALL' && a.authority_type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        a.name.toLowerCase().includes(term) ||
        a.code.toLowerCase().includes(term) ||
        a.district.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
            Jurisdiction Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Road Authorities Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure National Highway (NHAI), State Highway (PWD), Municipal Corporation, and Rural Road divisions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="h-4 w-4" /> Add New Authority
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Authority Name, Code, or District..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Authority Types</option>
          {AUTHORITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Grid Cards */}
      {loading ? (
        <Loader text="Loading authorities..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((auth) => (
            <div key={auth.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    {auth.code}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {auth.authority_type}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {auth.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-400" />
                    {auth.district}, {auth.state}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Road Coverage:</span>
                    <strong className="text-amber-400">{auth.road_type_coverage}</strong>
                  </div>
                  {auth.jurisdiction_area && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <strong>Corridor:</strong> {auth.jurisdiction_area}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span>{auth.contact_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{auth.contact_phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => openEditModal(auth)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Configuration
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Authority Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? `Edit Authority: ${formData.code}` : 'Register New Road Authority'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Authority Code *</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. NHAI-RO-MUM"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Authority Type *</label>
              <select
                value={formData.authority_type}
                onChange={(e) => setFormData({ ...formData, authority_type: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {AUTHORITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Official Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. National Highways Authority of India (RO Mumbai)"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Road Type Coverage *</label>
            <select
              value={formData.road_type_coverage}
              onChange={(e) => setFormData({ ...formData, road_type_coverage: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {ROAD_TYPES.map((rt) => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">District *</label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Jurisdiction Corridor / Description</label>
            <textarea
              rows={2}
              value={formData.jurisdiction_area}
              onChange={(e) => setFormData({ ...formData, jurisdiction_area: e.target.value })}
              placeholder="e.g. NH-48 Express Highway & Western Corridor..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Authority' : 'Register Authority'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default ManageAuthorities;
