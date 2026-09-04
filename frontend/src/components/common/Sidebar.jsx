import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
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
  Car
} from 'lucide-react';

const Sidebar = () => {
  const { user, isCitizen, isAuthority, isEngineer, isAdmin } = useAuth();

  const citizenNav = [
    { to: '/citizen', icon: LayoutDashboard, label: 'Overview' },
    { to: '/citizen/report', icon: PlusCircle, label: 'Report Road Defect' },
    { to: '/citizen/complaints', icon: FileText, label: 'My Complaints' },
    { to: '/map', icon: MapPin, label: 'Live Road Map' },
  ];

  const authorityNav = [
    { to: '/authority', icon: LayoutDashboard, label: 'Authority Overview' },
    { to: '/authority/complaints', icon: FileText, label: 'Road Complaints' },
    { to: '/authority/engineers', icon: HardHat, label: 'Field Engineers' },
    { to: '/map', icon: MapPin, label: 'Jurisdiction Map' },
  ];

  const engineerNav = [
    { to: '/engineer', icon: LayoutDashboard, label: 'My Workstation' },
    { to: '/engineer/assignments', icon: Wrench, label: 'Assigned Repairs' },
    { to: '/map', icon: MapPin, label: 'Inspection Map' },
  ];

  const adminNav = [
    { to: '/admin', icon: LayoutDashboard, label: 'Executive Analytics' },
    { to: '/admin/users', icon: Users, label: 'User Directory' },
    { to: '/admin/authorities', icon: Building2, label: 'Road Authorities' },
    { to: '/admin/engineers', icon: HardHat, label: 'Engineer Network' },
    { to: '/admin/complaints', icon: FileText, label: 'All Complaints' },
    { to: '/map', icon: MapPin, label: 'National GIS Map' },
  ];

  let currentNav = citizenNav;
  let roleTitle = "Citizen Portal";
  let roleIcon = Car;

  if (isAdmin) {
    currentNav = adminNav;
    roleTitle = "Admin Console";
    roleIcon = Shield;
  } else if (isAuthority) {
    currentNav = authorityNav;
    roleTitle = user?.authority_name || "Authority Portal";
    roleIcon = Building2;
  } else if (isEngineer) {
    currentNav = engineerNav;
    roleTitle = "Field Engineer Portal";
    roleIcon = Wrench;
  }

  const RoleIconComponent = roleIcon;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      
      {/* Portal Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
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
      </div>

      {/* Nav items */}
      <nav className="p-3 space-y-1 flex-1">
        {currentNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/citizen' || item.to === '/authority' || item.to === '/engineer' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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
  );
};

export default Sidebar;
