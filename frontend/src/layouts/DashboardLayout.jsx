import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { PanelLeft, Shield, Building2, Wrench, Car } from 'lucide-react';

const DashboardLayout = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading, isAdmin, isAuthority, isEngineer } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader text="Verifying session and security credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (user && !user.is_verified) {
      return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // If not authorized for this specific portal, redirect to user's home dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'AUTHORITY') return <Navigate to="/authority" replace />;
    if (user.role === 'ENGINEER') return <Navigate to="/engineer" replace />;
    return <Navigate to="/citizen" replace />;
  }

  const getPortalLabel = () => {
    if (isAdmin) return 'Admin Console';
    if (isAuthority) return user?.authority_name || 'Authority Portal';
    if (isEngineer) return 'Engineer Portal';
    return 'Citizen Portal';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      {/* Mobile Portal Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xs font-bold text-amber-400 font-['Outfit'] uppercase tracking-wider truncate">
            {getPortalLabel()}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
        >
          <PanelLeft className="h-4 w-4 text-amber-400" />
          <span>Menu</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
