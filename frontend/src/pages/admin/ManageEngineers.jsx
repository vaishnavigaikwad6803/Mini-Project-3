import React, { useState, useEffect } from 'react';
import { engineerService } from '../../services/engineerService';
import { authorityService } from '../../services/authorityService';
import { useNotifications } from '../../context/NotificationContext';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { MAHARASHTRA_DISTRICTS } from '../../utils/geoUtils';
import {
  HardHat,
  Building2,
  Search,
  Wrench,
  Mail,
  Phone,
  CheckCircle2,
  Edit3,
  AlertCircle,
  UserPlus,
  MapPin
} from 'lucide-react';

const ManageEngineers = () => {
  const { showToast } = useNotifications();
  const [engineers, setEngineers] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [authFilter, setAuthFilter] = useState('ALL');

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEng, setSelectedEng] = useState(null);
  const [editForm, setEditForm] = useState({
    designation: '',
    specialization: '',
    status: 'ACTIVE',
  });
  const [updating, setUpdating] = useState(false);

  // Register Modal state (Req 7)
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    password: 'Engineer@123',
    phone: '',
    authority_id: 1,
    employee_id: '',
    designation: 'Field Maintenance Engineer',
    specialization: 'Pothole & Surface Patching',
    district: 'Mumbai',
    state: 'Maharashtra'
  });

  const loadData = async () => {
    try {
      const [engs, auths] = await Promise.all([
        engineerService.getEngineers(),
        authorityService.getAuthorities(),
      ]);
      setEngineers(engs);
      setAuthorities(auths);
      if (auths.length > 0) {
        setRegForm(prev => ({ ...prev, authority_id: auths[0].id }));
      }
    } catch (err) {
      console.error("Error loading engineers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRegisterModal = () => {
    const randomCode = Math.floor(100 + Math.random() * 900);
    setRegForm({
      full_name: '',
      email: '',
      password: 'Engineer@123',
      phone: '',
      authority_id: authorities[0]?.id || 1,
      employee_id: `ENG-MH-${randomCode}`,
      designation: 'Field Maintenance Engineer',
      specialization: 'Pothole & Surface Patching',
      district: 'Mumbai',
      state: 'Maharashtra'
    });
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await engineerService.registerEngineer(regForm);
      showToast(`Field Engineer ${regForm.full_name} (${regForm.employee_id}) registered successfully!`, 'success');
      setRegisterModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to register engineer.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const openEditModal = (eng) => {
    setSelectedEng(eng);
    setEditForm({
      designation: eng.designation,
      specialization: eng.specialization,
      status: eng.status,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEng) return;
    setUpdating(true);
    try {
      await engineerService.updateEngineer(selectedEng.id, editForm);
      showToast(`Engineer ${selectedEng.full_name} updated successfully!`, 'success');
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = engineers.filter((e) => {
    if (authFilter !== 'ALL' && e.authority_id !== parseInt(authFilter)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.full_name.toLowerCase().includes(term) ||
        e.employee_id.toLowerCase().includes(term) ||
        (e.authority_name && e.authority_name.toLowerCase().includes(term)) ||
        (e.district && e.district.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">
            Field Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Engineer Network & Workload Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor maintenance engineers across National Highways, PWD, Municipalities, and Rural divisions.
          </p>
        </div>

        {/* Register New Engineer Button (Req 7) */}
        <button
          type="button"
          onClick={openRegisterModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Register New Engineer
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Name, Employee ID, District, or Authority..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={authFilter}
          onChange={(e) => setAuthFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Authorities</option>
          {authorities.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Engineers Grid */}
      {loading ? (
        <Loader text="Loading engineers..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((eng) => (
            <div key={eng.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    {eng.employee_id}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    {eng.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {eng.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{eng.designation}</p>
                  <p className="text-xs text-amber-400 mt-1 font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {eng.authority_name || 'Assigned Authority'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Specialization</span>
                  🛠️ {eng.specialization}
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span>{eng.email}</span>
                  </div>
                  {eng.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>{eng.phone}</span>
                    </div>
                  )}
                  {eng.district && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      <span>{eng.district}, {eng.state || 'Maharashtra'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Active Tasks</span>
                  <strong className="text-amber-400 text-sm font-bold">{eng.active_workload || 0} repairs</strong>
                </div>
                <button
                  onClick={() => openEditModal(eng)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Register Engineer Modal (Req 7) */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register New Field Maintenance Engineer"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Er. Nilesh Patil"
                value={regForm.full_name}
                onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Employee / Badge ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. ENG-MH-501"
                value={regForm.employee_id}
                onChange={(e) => setRegForm({ ...regForm, employee_id: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="engineer@roadguard.gov.in"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Designation *</label>
              <input
                type="text"
                required
                value={regForm.designation}
                onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Technical Specialization *</label>
              <select
                value={regForm.specialization}
                onChange={(e) => setRegForm({ ...regForm, specialization: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Pothole & Surface Patching">Pothole & Surface Patching</option>
                <option value="Crack Sealing & Resurfacing">Crack Sealing & Resurfacing</option>
                <option value="Structural Asphalt Works">Structural Asphalt Works</option>
                <option value="Bridge & Highway Maintenance">Bridge & Highway Maintenance</option>
                <option value="Rural Road Stabilisation">Rural Road Stabilisation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Jurisdiction District (MH) *</label>
              <select
                value={regForm.district}
                onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.division})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Assigned Authority Body *</label>
            <select
              value={regForm.authority_id}
              onChange={(e) => setRegForm({ ...regForm, authority_id: parseInt(e.target.value) })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {authorities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.jurisdiction_level})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              {registering ? 'Registering...' : 'Register Engineer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Engineer: ${selectedEng?.full_name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Designation</label>
            <input
              type="text"
              required
              value={editForm.designation}
              onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Specialization</label>
            <input
              type="text"
              required
              value={editForm.specialization}
              onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Operational Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
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

export default ManageEngineers;
