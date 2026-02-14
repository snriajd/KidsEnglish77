
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDb } from '../db';
import { Module, Media, AppSettings } from '../types';

export const ModuleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [content, setContent] = useState<Media[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const loadModule = async () => {
        const db = await getDb();
        const foundModule = db.modules.find(m => m.id === id);
        if (!foundModule) {
          navigate('/dashboard');
          return;
        }
        setModule(foundModule);
        setSettings(db.settings);
        setContent(db.media.filter(m => m.moduleId === id));
    };
    loadModule();
  }, [id, navigate]);

  if (!module || !settings) return null;

  return (
    <div className="bg-[#F4F7FA] min-h-screen pb-32 selection:bg-blue-100" style={{ fontFamily: settings.fontFamily }}>
      
      {/* Botão Voltar Premium */}
      <div className="fixed top-0 inset-x-0 z-50 p-6 flex justify-between items-start pointer-events-none">
         <button 
           onClick={() => navigate('/dashboard')} 
           className="pointer-events-auto bg-white/90 backdrop-blur-xl text-slate-800 px-6 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-black/5 border border-white/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
         >
            <span className="group-hover:-translate-x-1 transition-transform text-lg">←</span> 
            Voltar
         </button>
      </div>

      {/* Hero Banner Minimalista */}
      <div className="relative w-full h-[35vh] md:h-[45vh] lg:h-[50vh] overflow-hidden">
          {module.banner ? (
            <img src={module.banner} alt={module.title} className="w-full h-full object-cover scale-105 blur-[1px] brightness-90" />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-8xl opacity-10">📚</div>
          )}
          {/* Overlay de gradiente para suavizar a transição com o fundo */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#F4F7FA]"></div>
          
          {/* Título do Módulo Flutuante (Subtil) */}
          <div className="absolute bottom-32 inset-x-0 text-center px-6">
             <h2 className="text-white text-3xl md:text-5xl font-black drop-shadow-2xl tracking-tight opacity-90">{module.title}</h2>
          </div>
      </div>

      {/* Grid de Conteúdo */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
          
          <div className="grid gap-12">
             {content.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-md rounded-[3rem] p-20 text-center border border-white shadow-xl">
                   <div className="text-6xl mb-6 opacity-20">🎞️</div>
                   <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Em breve, novas aulas aqui!</p>
                </div>
             ) : (
                content.map((item) => (
                  <div key={item.id} className="bg-white rounded-[3rem] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12)] border border-white/50 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 group overflow-hidden">
                    
                    {/* Player Area */}
                    <div className="aspect-video w-full rounded-[2.2rem] overflow-hidden bg-black shadow-inner relative ring-8 ring-slate-50">
                      {item.type === 'video' && (
                        <iframe
                          src={item.url}
                          className="w-full h-full"
                          allowFullScreen
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          loading="lazy"
                        ></iframe>
                      )}
                      {item.type !== 'video' && (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-5xl">
                           {item.type === 'image' ? '🖼️' : '🔗'}
                        </div>
                      )}
                    </div>

                    {/* Meta Data */}
                    <div className="mt-10 px-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                               <span className="text-blue-500 font-black text-[9px] uppercase tracking-widest">Videoaula Disponível</span>
                            </div>
                            <h3 className="font-black text-2xl md:text-3xl text-slate-800 leading-[1.1] tracking-tight">{item.title}</h3>
                         </div>
                         <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors shrink-0">
                            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         </div>
                      </div>

                      {/* Descrição Curta */}
                      {item.description && (
                        <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
             )}
          </div>
          
          {/* Footer do Módulo */}
          <div className="mt-20 text-center border-t border-slate-200 pt-10">
             <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-lg">🎉</span>
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Você está indo muito bem!</span>
             </div>
          </div>
      </div>
    </div>
  );
};
