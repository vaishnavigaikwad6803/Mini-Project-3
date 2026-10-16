import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Building2,
  Users,
  Wrench,
  BarChart3,
  ClipboardCheck,
  Shield,
  Activity,
  History,
  HardHat,
  Car,
  X
} from 'lucide-react';

const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { user, isCitizen, isAuthority, isEngineer, isAdmin } = useAuth();
  const { t } = useLanguage();

  const citizenNav = [
    { to: '/citizen', icon: LayoutDashboard, label: t('common.overview') },
    { to: '/map', icon: MapPin, label: t('nav.liveMap') },
  ];

  const authorityNav = [
    { to: '/authority', icon: LayoutDashboard, label: t('authority.overview') },
    { to: '/authority/complaints', icon: FileText, label: t('authority.roadComplaints') },
    { to: '/authority/engineers', icon: HardHat, label: t('authority.fieldEngineers') },
    { to: '/map', icon: MapPin, label: t('authority.jurisdictionMap') },
  ];

  const engineerNav = [
    { to: '/engineer', icon: LayoutDashboard, label: t('engineer.workstationTitle') },
    { to: '/engineer/assignments', icon: Wrench, label: t('engineer.assignedRepairs') },
    { to: '/map', icon: MapPin, label: t('engineer.inspectionMap') },
  ];

  const adminNav = [
    { to: '/admin', icon: LayoutDashboard, label: t('admin.executiveAnalytics') },
    { to: '/admin/users', icon: Users, label: t('admin.userDirectory') },
    { to: '/admin/authorities', icon: Building2, label: t('admin.roadAuthorities') },
    { to: '/admin/engineers', icon: HardHat, label: t('admin.engineerNetwork') },
    { to: '/admin/complaints', icon: FileText, label: t('admin.allComplaints') },
    { to: '/map', icon: MapPin, label: t('admin.nationalGisMap') },
  ];

  let currentNav = citizenNav;
  let roleTitle = t('citizen.portalTitle');
  let roleIcon = Car;

  if (isAdmin) {
    currentNav = adminNav;
    roleTitle = t('admin.portalTitle');
    roleIcon = Shield;
  } else if (isAuthority) {
    currentNav = authorityNav;
    roleTitle = user?.authority_name || t('authority.portalTitle');
    roleIcon = Building2;
  } else if (isEngineer) {
    currentNav = engineerNav;
    roleTitle = t('engineer.portalTitle');
    roleIcon = Wrench;
  }

  const RoleIconComponent = roleIcon;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Portal Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <RoleIconComponent className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                {roleTitle}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.full_name || 'Active Session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {currentNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                end={item.to === '/citizen' || item.to === '/authority' || item.to === '/engineer' || item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer System Status Badge */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="rounded-xl p-3 bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">AI Model Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                YOLOv8 Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              v1.0 • OpenCV Preprocessor Ready
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
