import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { engineerService } from '../../services/engineerService';
import { authorityService } from '../../services/authorityService';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { MAHARASHTRA_DISTRICTS } from '../../utils/geoUtils';
import {
  HardHat,
  UserPlus,
  Search,
  Wrench,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MapPin,
  Lock,
  BadgeCheck
} from 'lucide-react';

const AuthorityEngineers = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [engineers, setEngineers] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Register Modal state (Req 7)
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    password: 'Engineer@123',
    phone: '',
    authority_id: user?.authority_id || 1,
    employee_id: '',
    designation: 'Field Maintenance Engineer',
    specialization: 'Pothole & Surface Patching',
    district: 'Mumbai',
    state: 'Maharashtra'
  });

  const loadEngineers = async () => {
    try {
      let authId = user?.authority_id;
      const auths = await authorityService.getAuthorities();
      setAuthorities(auths);

      if (!authId && auths.length > 0) {
        authId = auths[0].id;
      }

      if (authId) {
        setRegForm(prev => ({ ...prev, authority_id: authId }));
        const data = await engineerService.getEngineers({ authority_id: authId });
        setEngineers(data);
      } else {
        const data = await engineerService.getEngineers();
        setEngineers(data);
      }
    } catch (err) {
      console.error("Error loading engineers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, [user]);

  const openRegisterModal = () => {
    const randomCode = Math.floor(100 + Math.random() * 900);
    setRegForm({
      full_name: '',
      email: '',
      password: 'Engineer@123',
      phone: '',
      authority_id: user?.authority_id || (authorities[0]?.id || 1),
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
      loadEngineers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to register engineer.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const filtered = engineers.filter((e) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.full_name.toLowerCase().includes(term) ||
        e.employee_id.toLowerCase().includes(term) ||
        (e.specialization && e.specialization.toLowerCase().includes(term)) ||
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
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
            Maintenance Personnel
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] mt-1">
            Authority Field Engineers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor active work orders, asphalt specializations, and staff workloads.
          </p>
        </div>

        {/* Register Engineer Action Button (Req 7) */}
        <button
          type="button"
          onClick={openRegisterModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Register New Engineer
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Engineer Name, Employee ID, Specialization, or District..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 rounded-xl border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <Loader text="Loading engineer roster..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
          <HardHat className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No engineers found in jurisdiction</h3>
          <button
            onClick={openRegisterModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
          >
            <UserPlus className="h-4 w-4" /> Register First Engineer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((eng) => (
            <div key={eng.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    {eng.employee_id}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    {eng.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {eng.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{eng.designation}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium">
                    <Wrench className="h-3.5 w-3.5" />
                    {eng.specialization}
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{eng.email}</span>
                  </div>
                  {eng.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{eng.phone}</span>
                    </div>
                  )}
                  {eng.district && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>{eng.district}, {eng.state || 'Maharashtra'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Tasks:</span>
                <strong className="text-amber-400 text-sm font-bold">{eng.active_workload || 0} active</strong>
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

          {authorities.length > 1 && (
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
          )}

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

    </div>
  );
};

export default AuthorityEngineers;
