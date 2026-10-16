import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Search,
  Home,
  ChevronDown
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, isCitizen, isAuthority, isEngineer, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click and Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setShowUserMenu(false);
    setMobileMenuOpen(false);
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
      <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border font-semibold tracking-wide ${roleColors[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
        {user.role}
      </span>
    );
  };

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/map') return location.pathname === '/map';
    if (path === '/track') return location.pathname.startsWith('/track');
    if (path === '/citizen/report') return location.pathname === '/citizen/report';
    if (path === 'dashboard') {
      return (
        (location.pathname.startsWith('/citizen') && location.pathname !== '/citizen/report') ||
        location.pathname.startsWith('/authority') ||
        location.pathname.startsWith('/engineer') ||
        location.pathname.startsWith('/admin')
      );
    }
    return location.pathname.startsWith(path);
  };

  const getNavLinkClass = (isActive) =>
    `px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${isActive
      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-sm shadow-amber-500/10'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent active:scale-95'
    }`;

  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* 1. BRAND LOGO */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-xl p-1"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
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

          {/* 2. DESKTOP NAVIGATION LINKS */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              to="/"
              className={getNavLinkClass(isActiveRoute('/'))}
            >
              <Home className="h-4 w-4" />
              <span>{t('nav.home')}</span>
            </Link>

            <Link
              to="/map"
              className={getNavLinkClass(isActiveRoute('/map'))}
            >
              <MapPin className="h-4 w-4 text-amber-500" />
              <span>{t('nav.liveMap')}</span>
            </Link>

            <Link
              to="/track"
              className={getNavLinkClass(isActiveRoute('/track'))}
            >
              <Search className="h-4 w-4 text-cyan-400" />
              <span>{t('nav.trackComplaint')}</span>
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                className={getNavLinkClass(isActiveRoute('dashboard'))}
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            )}
          </div>

          {/* 3. RIGHT ACTIONS & USER MENU */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Multilingual Language Switcher (EN / MR / HI) */}
            <LanguageSelector />

            {/* Dark / Light Mode Theme Toggle */}
            <ThemeToggle />

            {/* Quick "Report Damage" CTA Button — Citizen only */}
            {isCitizen && (
              <Link
                to="/citizen/report"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('nav.reportDamage')}</span>
              </Link>
            )}

            {isAuthenticated ? (
              <>
                {/* In-App Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications((prev) => !prev);
                      setShowUserMenu(false);
                    }}
                    className={`p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${showNotifications ? 'bg-slate-800 text-amber-400' : ''
                      }`}
                    aria-label="Open notifications"
                    aria-expanded={showNotifications}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popup */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl overflow-hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-amber-500" />
                          <span className="font-bold text-sm text-white font-['Outfit']">{t('nav.notifications')}</span>
                          {unreadCount > 0 && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAsRead(null, true)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold focus:outline-none focus-visible:underline"
                          >
                            {t('nav.markAllRead')}
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            {t('nav.noNotifications')}
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notif) => (
                            <div
                              key={notif.id}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  markAsRead([notif.id]);
                                  if (notif.action_url) {
                                    navigate(notif.action_url);
                                    setShowNotifications(false);
                                  }
                                }
                              }}
                              onClick={() => {
                                markAsRead([notif.id]);
                                if (notif.action_url) {
                                  navigate(notif.action_url);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-3 text-left hover:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none focus:bg-slate-800/60 ${!notif.is_read ? 'bg-amber-500/5' : ''
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu((prev) => !prev);
                      setShowNotifications(false);
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${showUserMenu ? 'ring-2 ring-amber-500/50 border-amber-500/50' : ''
                      }`}
                    aria-label="User account menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold max-w-[110px] truncate hidden sm:block">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Profile Menu Popup */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
                        <p className="text-xs font-bold text-white truncate font-['Outfit']">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:bg-slate-800"
                      >
                        <LayoutDashboard className="h-4 w-4 text-amber-400" />
                        <span>{t('nav.portalDashboard')}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors mt-1 focus:outline-none focus-visible:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* 4. RESPONSIVE MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-3 pb-5 space-y-2 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150 shadow-2xl">

          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActiveRoute('/') ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Home className="h-4 w-4" />
              <span>{t('nav.home')}</span>
            </Link>

            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActiveRoute('/map') ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-200 hover:bg-slate-800'
                }`}
            >
              <MapPin className="h-4 w-4 text-amber-500" />
              <span>{t('nav.liveMap')}</span>
            </Link>

            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActiveRoute('/track') ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-200 hover:bg-slate-800'
                }`}
            >
              <Search className="h-4 w-4 text-cyan-400" />
              <span>{t('nav.trackComplaint')}</span>
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActiveRoute('dashboard') ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-200 hover:bg-slate-800'
                  }`}
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                <span>{t('nav.portalDashboard')}</span>
              </Link>
            )}
          </div>

          {/* Prominent Action Button: Report Road Damage — Citizen only */}
          {isCitizen && (
            <div className="pt-2">
              <Link
                to="/citizen/report"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all text-center"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t('nav.reportDamage')}</span>
              </Link>
            </div>
          )}

          {/* Multilingual Selection Row on Mobile */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 mt-2">
            <span className="text-xs font-semibold text-slate-300 block">{t('nav.language')} / भाषा</span>
            <LanguageSelector variant="segmented" className="w-full justify-between" />
          </div>

          {/* Theme & Appearance Row */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 mt-2">
            <span className="font-semibold">Appearance Theme</span>
            <ThemeToggle />
          </div>

          {/* User Status / Login Block on Mobile */}
          {isAuthenticated ? (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 mt-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <strong className="text-white text-xs block font-['Outfit'] truncate">{user?.full_name}</strong>
                  <span className="text-[11px] text-slate-400 block truncate">{user?.email}</span>
                </div>
                {getRoleBadge()}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/20 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 mt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl text-center text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl text-center text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

        </div>
      )}
    </nav>
  );
};

export default Navbar;
