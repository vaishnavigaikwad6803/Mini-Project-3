import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, Heart, Github, Sparkles } from 'lucide-react';

const MainLayout = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modern Infrastructure Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
                  RG
                </div>
                <span className="font-extrabold text-white text-lg tracking-tight font-['Outfit']">
                  RoadGuard<span className="text-amber-500">AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI-Driven Automated Road Damage Detection, GIS Spatial Mapping, and Multi-Authority Municipal Infrastructure Management.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                {t('footer.coveredAuthorities')}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• {t('footer.nhai')}</li>
                <li>• {t('footer.statePwd')}</li>
                <li>• {t('footer.municipalCorp')}</li>
                <li>• {t('footer.ruralRoads')}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                {t('footer.supportedAiClasses')}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>• {t('damage.pothole')}</li>
                <li>• {t('damage.longitudinalCrack')}</li>
                <li>• {t('damage.transverseCrack')}</li>
                <li>• {t('damage.alligatorCrack')}</li>
                <li>• {t('damage.surfaceDegradation')}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                {t('footer.systemInfo')}
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p>Computer Vision: <strong className="text-amber-400">YOLOv8 + OpenCV</strong></p>
                <p>Backend: <strong className="text-cyan-400">FastAPI & Python</strong></p>
                <p>Frontend: <strong className="text-emerald-400">React + Leaflet GIS</strong></p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold mt-2">
                  <Sparkles className="h-3 w-3" /> {t('footer.collegeProject')}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {t('footer.allRightsReserved')}</p>
            <div className="flex items-center gap-4">
              <Link to="/map" className="hover:text-amber-400 transition-colors">{t('nav.liveMap')}</Link>
              <Link to="/track" className="hover:text-amber-400 transition-colors">{t('nav.trackComplaint')}</Link>
              <Link to="/login?type=authority" className="hover:text-amber-400 transition-colors">{t('nav.login')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
