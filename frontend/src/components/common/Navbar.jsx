import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  ShieldAlert,
  Bell,
  User,
  LogOut,
  MapPin,
  PlusCircle,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, isAuthenticated, logout, isCitizen, isAuthority, isEngineer, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isAuthority) return '/authority';
    if (isEngineer) return '/engineer';
    return '/citizen';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const roleColors = {
      ADMIN: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      AUTHORITY: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      ENGINEER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      CITIZEN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${roleColors[user.role] || 'bg-slate-800 text-slate-300'}`}>
        {user.role}
      </span>
    );
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-white font-['Outfit']">
                RoadGuard<span className="text-amber-500 ml-1">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase hidden sm:block">
                Road Damage Detection & Authority Management
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-amber-400 bg-slate-800/60' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              Home
            </Link>
            <Link
              to="/map"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === '/map' ? 'text-amber-400 bg-slate-800/60' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              <MapPin className="h-4 w-4 text-amber-500" />
              Live Map
            </Link>
            <Link
              to="/track"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/track' ? 'text-amber-400 bg-slate-800/60' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
            >
              Track Complaint
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname.startsWith('/citizen') ||
                    location.pathname.startsWith('/authority') ||
                    location.pathname.startsWith('/engineer') ||
                    location.pathname.startsWith('/admin')
                    ? 'text-amber-400 bg-slate-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Action Icons & Auth Profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Quick Report CTA Button */}
            <Link
              to="/citizen/report"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Report Damage
            </Link>

            {isAuthenticated ? (
              <>
                {/* In-App Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popup */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold text-sm text-white">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAsRead(null, true)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead([notif.id]);
                                if (notif.action_url) {
                                  navigate(notif.action_url);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-3 text-left hover:bg-slate-800/60 cursor-pointer transition-colors ${!notif.is_read ? 'bg-amber-500/5' : ''
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-xs font-semibold ${!notif.is_read ? 'text-amber-300' : 'text-slate-200'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {user?.full_name ? user.full_name.charAt(0) : 'U'}
                    </div>
                    <span className="text-xs font-medium max-w-[100px] truncate hidden sm:block">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                  </button>

                  {/* Profile Menu Popup */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {getRoleBadge()}
                          {user?.district && (
                            <span className="text-[10px] text-slate-400 truncate">
                              📍 {user.district}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        to={getDashboardPath()}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-amber-400" />
                        Dashboard
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors mt-1"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            to="/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Live Map
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Track Complaint
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-slate-800 font-medium"
            >
              My Dashboard
            </Link>
          )}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800/80 pt-3 mt-1">
            <span className="text-xs text-slate-300 font-medium">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            to="/citizen/report"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm bg-amber-500 text-slate-950 font-semibold text-center mt-2"
          >
            Report Road Damage
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
