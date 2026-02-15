
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDb } from '../db';
import { AppData, AppSettings, User } from '../types';

export const MemberArea: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isPreview = new URLSearchParams(location.search).get('preview') === 'true';

  useEffect(() => {
    const loadData = async () => {
      const db = await getDb();
      const session = localStorage.getItem('user_session');
      
      // Feature Manutenção: Se ativo e não for preview, chuta o user
      if (db.settings.maintenanceMode && !isPreview) {
        localStorage.removeItem('user_session');
        navigate('/');
        return;
      }

      if (isPreview) {
        setData(db);
        setUser(db.users[0] || { name: 'Preview User', phone: '000', createdAt: new Date().toISOString(), active: true });
      } else {
        if (!session) {
          navigate('/');
          return;
        }
        try {
          const loggedUser = JSON.parse(session);
          setData(db);
          setUser(loggedUser);
        } catch(e) {
          navigate('/');
        }
      }
    };
    loadData();
  }, [navigate, isPreview]);

  // Lógica da Animação de Scroll
  useEffect(() => {
    const handleScroll = () => {
      const cards = document.querySelectorAll('.scroll-card');
      const focusPoint = window.innerHeight * 0.3; 

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distanceFromFocus = rect.top - focusPoint;
        
        let blur = 0;
        let scale = 1;
        let opacity = 1;

        if (distanceFromFocus > 0) {
            const ratio = Math.min(distanceFromFocus / (window.innerHeight * 0.5), 1);
            blur = ratio * 2; 
            scale = 1 - (ratio * 0.03); 
            opacity = 1 - (ratio * 0.3); 
        } else if (distanceFromFocus < -300) {
            const ratio = Math.min(Math.abs(distanceFromFocus + 300) / 200, 1);
            blur = ratio * 2;
            opacity = 1 - (ratio * 0.2);
        }

        const el = card as HTMLElement;
        el.style.filter = `blur(${blur}px)`;
        el.style.transform = `scale(${scale})`;
        el.style.opacity = `${opacity}`;
        el.style.transition = 'filter 0.3s ease-out, transform 0.3s ease-out, opacity 0.3s ease-out';
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]);

  if (!data || !user) return null;
  const { settings } = data;

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate('/');
  };

  const allActiveModules = data.modules
    .filter(m => {
      if (!m.active) return false;
      if (isPreview) return true;
      
      const userJoinDate = new Date(user.createdAt).getTime();
      const dripMillis = (m.dripDays || 0) * 24 * 60 * 60 * 1000;
      return Date.now() >= (userJoinDate + dripMillis);
    })
    .sort((a, b) => a.order - b.order);

  const verticalModules = allActiveModules.filter(m => m.showInVertical !== false);
  const horizontalModules = allActiveModules.filter(m => m.showInHorizontal === true);

  return (
    <div className="min-h-screen pb-20 selection:bg-blue-50 transition-colors duration-500" 
         style={{ fontFamily: settings.fontFamily, backgroundColor: settings.backgroundColor || '#FFFFFF' }}>
      
      {isPreview && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-4 px-8 flex items-center justify-between sticky top-0 z-[100] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl">
           <div className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
               <span>VISUALIZAÇÃO ADMIN</span>
           </div>
           <button onClick={() => navigate('/admin')} className="bg-white text-blue-900 px-4 py-1.5 rounded-lg font-black text-[9px] hover:bg-slate-100 transition-colors">VOLTAR AO PAINEL</button>
        </div>
      )}

      {data.announcements.filter(a => a.active).map(a => (
        <div key={a.id} className="bg-slate-900 text-white p-4 text-center text-[11px] font-bold tracking-wide relative">
           {a.text}
        </div>
      ))}

      <header 
        className="flex flex-col items-center relative px-6"
        style={{ paddingTop: `${settings.headerSpacing}px`, paddingBottom: `${settings.headerSpacing / 2}px` }}
      >
        {!isPreview && (
          <button 
            onClick={handleLogout} 
            className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-all font-black text-[9px] uppercase tracking-[0.3em] bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-100/50"
          >
            Sair
          </button>
        )}

        <div className="select-none py-4 flex flex-col items-center">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.appName} 
              style={{ width: `${settings.logoWidth * 0.7}px` }}
              className="drop-shadow-sm"
            />
          ) : (
            <h1 className="font-logo text-4xl md:text-5xl" style={{ color: settings.primaryColor }}>
              {settings.appName.split('English')[0]}
              <span style={{ color: settings.accentColor }}>English</span>
            </h1>
          )}
        </div>
      </header>

      <main className="px-6 max-w-5xl mx-auto mt-4 space-y-16">
        
        {verticalModules.length === 0 && horizontalModules.length === 0 ? (
          <div className="text-center py-40 bg-white/30 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-200">
             <div className="text-6xl mb-6 grayscale opacity-20">📚</div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Preparando novas aventuras para você!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 py-4">
            {verticalModules.map((module) => (
              <div 
                key={module.id} 
                onClick={() => navigate(`/module/${module.id}`)}
                className="scroll-card group relative w-full aspect-[21/9] rounded-[2.5rem] overflow-hidden cursor-pointer bg-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] active:scale-[0.98] will-change-transform"
              >
                {module.banner ? (
                  <img 
                    src={module.banner} 
                    alt={module.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200">
                    <span className="text-7xl opacity-10">📚</span>
                    <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest">{module.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {horizontalModules.length > 0 && (
          <div className="pt-8 border-t border-black/[0.05]">
            <h3 className="text-slate-800 font-bold text-2xl mb-6 px-2 tracking-tight">
                {settings.horizontalSectionTitle || 'Mais Aventuras'}
            </h3>
            <div className="flex gap-5 overflow-x-auto pb-8 px-2 snap-x hide-scrollbar">
              {horizontalModules.map((module) => (
                 <div 
                   key={`hz-${module.id}`}
                   onClick={() => navigate(`/module/${module.id}`)}
                   className="snap-center shrink-0 w-[260px] md:w-[320px] aspect-[4/3] rounded-[2rem] overflow-hidden bg-white shadow-lg cursor-pointer hover:scale-[1.02] transition-transform relative"
                 >
                    {module.banner ? (
                      <img src={module.banner} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-4xl opacity-20">📚</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
                       <p className="text-white font-bold text-sm truncate">{module.title}</p>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <footer className="mt-24 text-center opacity-10 py-10">
        <p className="text-[10px] font-black uppercase tracking-[1.5em]">
            {settings.footerText || `${settings.appName} Premium`}
        </p>
      </footer>
    </div>
  );
};
