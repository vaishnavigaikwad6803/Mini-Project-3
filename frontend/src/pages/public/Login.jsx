import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, 
  Mail, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const demoUsers = [
    { label: 'Citizen', email: 'citizen@roadguard.ai', color: 'text-emerald-400 border-emerald-500/30' },
    { label: 'NHAI Highway', email: 'nhai@roadguard.ai', color: 'text-amber-400 border-amber-500/30' },
    { label: 'State PWD', email: 'pwd@roadguard.ai', color: 'text-indigo-400 border-indigo-500/30' },
    { label: 'Municipal BMC', email: 'municipal@roadguard.ai', color: 'text-cyan-400 border-cyan-500/30' },
    { label: 'Rural PMGSY', email: 'pmgsy@roadguard.ai', color: 'text-emerald-400 border-emerald-500/30' },
    { label: 'Field Engineer', email: 'engineer@roadguard.ai', color: 'text-purple-400 border-purple-500/30' },
    { label: 'Admin', email: 'admin@roadguard.ai', color: 'text-rose-400 border-rose-500/30' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (from !== '/') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'AUTHORITY') navigate('/authority');
        else if (user.role === 'ENGINEER') navigate('/engineer');
        else navigate('/citizen');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400 mb-2 shadow-lg shadow-amber-500/10">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Welcome to RoadGuard AI
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your road maintenance portal
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl bg-slate-950 border border-slate-700 focus-within:border-amber-500 transition-colors">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl bg-slate-950 border border-slate-700 focus-within:border-amber-500 transition-colors">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>

          </form>

          {/* Quick Demo Credentials Fillers */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              ⚡ Quick 1-Click Demo Logins
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {demoUsers.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fillCredentials(d.email)}
                  className={`px-2 py-1.5 rounded-lg bg-slate-950/80 border ${d.color} text-[11px] font-medium hover:bg-slate-800 transition-colors truncate`}
                  title={d.email}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">
            Don't have a citizen account yet?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
              Register Here
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
