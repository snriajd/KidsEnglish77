
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDb } from '../db';
import { Module, Media } from '../types';

export const ModuleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [content, setContent] = useState<Media[]>([]);

  useEffect(() => {
    const loadModule = async () => {
        const db = await getDb();
        const foundModule = db.modules.find(m => m.id === id);
        if (!foundModule) {
          navigate('/dashboard');
          return;
        }
        setModule(foundModule);
        setContent(db.media.filter(m => m.moduleId === id));
    };
    loadModule();
  }, [id, navigate]);

  if (!module) return null;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20 font-sans selection:bg-blue-100">
      
      {/* Header Flutuante */}
      <div className="fixed top-0 inset-x-0 z-50 p-6 flex justify-between items-start pointer-events-none">
         <button 
           onClick={() => navigate('/dashboard')} 
           className="pointer-events-auto bg-white/80 backdrop-blur-md text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border border-white/50 hover:scale-105 transition-transform flex items-center gap-2 group"
         >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Voltar
         </button>
      </div>

      {/* Hero Banner Imersivo */}
      <div className="relative w-full aspect-[21/9] md:aspect-[3/1] lg:h-[45vh]">
          {module.banner ? (
            <img src={module.banner} alt={module.title} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-slate-200 flex items-center justify-center text-6xl opacity-10">📚</div>
          )}
          {/* Gradiente para misturar com o fundo */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#F8FAFC]"></div>
      </div>

      {/* Área de Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 -mt-24 relative z-10">
          
          <div className="grid gap-10">
             {content.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200 shadow-sm">
                   <span className="text-4xl opacity-20 block mb-4">✨</span>
                   <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum vídeo adicionado ainda</p>
                </div>
             ) : (
                content.map((item) => (
                  <div key={item.id} className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-1 ring-1 ring-slate-100">
                    
                    {/* Player Container */}
                    <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-black shadow-inner relative z-0">
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
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl">
                           {item.type === 'image' ? '🖼️' : '🔗'}
                        </div>
                      )}
                    </div>

                    {/* Informações do Vídeo */}
                    <div className="px-4 pt-6 pb-2 flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-slate-800 leading-tight mb-2">{item.title}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                           Assistir Agora
                        </p>
                      </div>
                      
                      {/* Ícone Decorativo */}
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 shrink-0">
                         <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                ))
             )}
          </div>
          
          <div className="h-20"></div> {/* Espaçamento final */}
      </div>
    </div>
  );
};
