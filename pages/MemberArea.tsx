
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDb } from '../db';
import { AppData, User } from '../types';

export const MemberArea: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isPreview = new URLSearchParams(location.search).get('preview') === 'true';

  useEffect(() => {
    const loadData = async () => {
      const db = await getDb();
      const session = localStorage.getItem('user_session');
      
      if (db.settings.maintenanceMode && !isPreview) {
        localStorage.removeItem('user_session');
        navigate('/');
        return;
      }

      if (isPreview) {
        setData(db);
        setUser(db.users[0] || { name: 'Visitante', phone: '000', createdAt: new Date().toISOString(), active: true });
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

  // --- Lógica de Animação de Scroll (Vertical) ---
  useEffect(() => {
      if (!data) return;

      const handleIntersect = (entries: IntersectionObserverEntry[]) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  // Entrou na tela: Foca e normaliza
                  entry.target.classList.remove('opacity-40', 'blur-[2px]', 'scale-95', 'translate-y-8');
                  entry.target.classList.add('opacity-100', 'blur-0', 'scale-100', 'translate-y-0');
              } else {
                  // Saiu da tela: Desfoca novamente (efeito de lista dinâmica)
                  if (entry.boundingClientRect.top > 0) {
                    entry.target.classList.add('opacity-40', 'blur-[2px]', 'scale-95', 'translate-y-8');
                    entry.target.classList.remove('opacity-100', 'blur-0', 'scale-100', 'translate-y-0');
                  }
              }
          });
      };

      observerRef.current = new IntersectionObserver(handleIntersect, {
          root: null,
          rootMargin: '0px',
          threshold: 0.15 
      });

      const cards = document.querySelectorAll('.module-card-anim');
      cards.forEach(card => observerRef.current?.observe(card));

      return () => observerRef.current?.disconnect();
  }, [data, isPreview]); 

  const { horizontalModules, verticalModules } = useMemo(() => {
    if (!data || !user) return { horizontalModules: [], verticalModules: [] };

    const availableModules = data.modules.filter(m => {
        if (m.active === false) return false;
        if (isPreview) return true;
        const userJoinDate = new Date(user.createdAt).getTime();
        const dripMillis = (m.dripDays || 0) * 24 * 60 * 60 * 1000;
        return Date.now() >= (userJoinDate + dripMillis);
    }).sort((a, b) => a.order - b.order);

    return {
        horizontalModules: availableModules.filter(m => m.showInHorizontal),
        verticalModules: availableModules.filter(m => m.showInVertical !== false) // Padrão é true
    };
  }, [data, user, isPreview]);

  if (!data || !user) return <div className="min-h-screen bg-white"></div>;

  const { settings } = data;

  return (
    <div className="min-h-screen bg-white pb-20" style={{ fontFamily: settings.fontFamily }}>
      
      {/* --- PREVIEW BAR --- */}
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-900/90 backdrop-blur-md text-white py-3 px-6 flex justify-between items-center shadow-xl border-b border-white/10 animate-in slide-in-from-top-full">
           <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] font-black uppercase tracking-widest">Modo Visualização</span>
           </div>
           <button 
             onClick={() => navigate('/admin')}
             className="bg-white text-slate-900 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors shadow-lg"
           >
             ← Voltar ao Admin
           </button>
        </div>
      )}

      {/* --- HEADER: Logo --- */}
      <header className={`flex flex-col items-center pt-10 pb-6 px-6 ${isPreview ? 'mt-12' : ''}`}>
          <div className="transform transition-transform duration-300 hover:scale-105">
            {settings.logoUrl ? (
                <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    style={{ width: `${settings.logoWidth}px` }} 
                    className="object-contain drop-shadow-xl" 
                />
            ) : (
                <h1 className="text-5xl font-black text-blue-900 tracking-tighter text-center">
                    Kids<span className="text-blue-500">English</span>
                </h1>
            )}
          </div>
      </header>

      {/* --- SCROLL HORIZONTAL (Destaques) --- */}
      {horizontalModules.length > 0 && (
          <section className="mb-10">
              <div className="px-6 mb-4">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {settings.horizontalSectionTitle || 'Destaques'}
                  </h2>
              </div>
              <div className="flex overflow-x-auto gap-4 px-6 pb-6 snap-x hide-scrollbar">
                  {horizontalModules.map(module => (
                      <div 
                          key={`h-${module.id}`}
                          onClick={() => navigate(`/module/${module.id}`)}
                          className="min-w-[85%] md:min-w-[45%] snap-center group relative aspect-[16/8] bg-slate-100 rounded-3xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden border border-slate-100 transition-all active:scale-95"
                      >
                           {module.banner ? (
                                <img src={module.banner} alt={module.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                           ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-200">
                                    <span className="text-3xl mb-1">⭐</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{module.title}</span>
                                </div>
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>
                           <div className="absolute bottom-4 left-5 right-5">
                               <h3 className="text-white font-black text-lg leading-tight drop-shadow-md">{module.title}</h3>
                           </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* --- LISTA VERTICAL --- */}
      <main className="max-w-md mx-auto px-6">
          <div className="flex flex-col gap-10">
              {verticalModules.map((module) => (
                  <div 
                      key={module.id} 
                      onClick={() => navigate(`/module/${module.id}`)}
                      className="module-card-anim group relative w-full aspect-[16/7] bg-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] cursor-pointer overflow-hidden border border-slate-100 transition-all duration-700 ease-out opacity-0 translate-y-8 blur-[2px] scale-95"
                  >
                      {module.banner ? (
                          <img 
                            src={module.banner} 
                            alt={module.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-200">
                              <span className="text-4xl mb-2">🖼️</span>
                              <span className="text-xs font-black uppercase tracking-widest text-blue-300">{module.title}</span>
                          </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                  </div>
              ))}
              
              {verticalModules.length === 0 && horizontalModules.length === 0 && (
                  <div className="text-center py-20 opacity-30">
                      <p className="text-xs font-bold uppercase tracking-widest">Nenhum conteúdo disponível</p>
                  </div>
              )}
          </div>
      </main>

      <div className="fixed bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity z-50">
          <button onClick={() => { localStorage.removeItem('user_session'); navigate('/'); }} className="text-[9px] font-bold text-slate-300 p-2">Sair</button>
      </div>
    </div>
  );
};
