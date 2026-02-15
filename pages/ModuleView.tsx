
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
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        const db = await getDb();
        const foundModule = db.modules.find(m => m.id === id);
        if (!foundModule) {
          handleBack();
          return;
        }
        setModule(foundModule);
        setSettings(db.settings);
        setContent(db.media.filter(m => m.moduleId === id));

        const savedProgress = localStorage.getItem(`progress_${id}`);
        if(savedProgress) setCompletedItems(JSON.parse(savedProgress));
    };
    loadData();
  }, [id]); 

  const toggleComplete = (itemId: string) => {
      let newCompleted;
      if (completedItems.includes(itemId)) {
          newCompleted = completedItems.filter(i => i !== itemId);
      } else {
          newCompleted = [...completedItems, itemId];
          triggerConfetti();
      }
      setCompletedItems(newCompleted);
      localStorage.setItem(`progress_${id}`, JSON.stringify(newCompleted));
  };

  const triggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // RegEx mais robusta para suportar links curtos, longos e embeds
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        // Adiciona origin para evitar erro 150/152/153
        const origin = window.location.origin;
        return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0&modestbranding=1&playsinline=1&origin=${origin}`;
    }
    return url;
  };

  const handleBack = () => {
    const isAdmin = localStorage.getItem('admin_session');
    
    if (isAdmin) {
      navigate('/dashboard?preview=true');
    } else {
      navigate('/dashboard');
    }
  };

  if (!module || !settings) return <div className="min-h-screen bg-[#FFFBEB] animate-pulse"></div>;

  const progress = content.length > 0 ? (completedItems.length / content.length) * 100 : 0;

  return (
    <div className="min-h-screen pb-32 transition-colors duration-500 overflow-x-hidden selection:bg-yellow-200" 
         style={{ 
             fontFamily: settings.fontFamily, 
             backgroundColor: '#FFFBEB', 
             backgroundImage: 'radial-gradient(#E2E8F0 1.5px, transparent 1.5px)',
             backgroundSize: '24px 24px'
         }}>
      
      {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-center overflow-hidden">
              <div className="absolute top-[20%] left-[20%] text-8xl animate-bounce duration-700">🎉</div>
              <div className="absolute top-[30%] right-[20%] text-8xl animate-pulse duration-500">⭐</div>
              <div className="absolute bottom-[40%] left-[40%] text-8xl animate-bounce duration-1000">✨</div>
              <div className="absolute top-[10%] inset-x-0 text-center text-8xl animate-ping opacity-50">🎈</div>
          </div>
      )}

      {/* --- HEADER FLUTUANTE --- */}
      <div className="sticky top-0 z-50 px-4 py-3">
         <div className="bg-white/95 backdrop-blur-xl border-b-[3px] border-slate-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex items-center justify-between max-w-2xl mx-auto p-3">
            <button 
                onClick={handleBack} 
                className="group flex items-center justify-center w-10 h-10 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 rounded-xl shadow-[0_3px_0_rgb(202,138,4)] active:shadow-none active:translate-y-[3px] transition-all"
            >
                <span className="font-black text-xl group-hover:-translate-x-0.5 transition-transform">←</span> 
            </button>
            
            <div className="flex-1 mx-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1">🏆 Progresso</span>
                    <span className="text-blue-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-[0_2px_10px_rgba(34,197,94,0.4)] relative" 
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="relative w-full mb-10">
          <div className="w-full h-[35vh] relative overflow-hidden bg-slate-900 border-b-8 border-white shadow-sm">
            {module.banner ? (
                <img src={module.banner} alt={module.title} className="w-full h-full object-cover opacity-90" />
            ) : (
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-indigo-600 flex items-center justify-center">
                    <span className="text-9xl opacity-20 animate-bounce">🚀</span>
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            
            <div className="absolute bottom-0 inset-x-0 p-6 pb-8 text-center text-white">
                <div className="inline-block bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_rgba(0,0,0,0.1)] transform -rotate-1 mb-4 border-2 border-white">
                   Módulo Oficial
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-xl mb-2 text-white">
                    {module.title}
                </h2>
                <div className="max-w-lg mx-auto">
                    <p className="text-white/90 font-bold text-sm md:text-base leading-relaxed backdrop-blur-sm rounded-xl py-1">
                        {module.description || 'Prepare-se para uma aventura incrível!'}
                    </p>
                </div>
            </div>
          </div>
      </div>

      {/* --- LISTA DE AULAS CENTRALIZADA --- */}
      <div className="max-w-2xl mx-auto px-4 space-y-8">
          
          {content.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-200 border-dashed">
                <div className="text-7xl mb-4 grayscale opacity-40">🦕</div>
                <h3 className="text-2xl font-black text-slate-400 mb-2">Ops... Vazio!</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">O professor ainda está criando esta aventura.</p>
             </div>
          ) : (
             content.map((item, index) => {
               const isCompleted = completedItems.includes(item.id);
               return (
               <div key={item.id} className={`relative bg-white rounded-[2.5rem] overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${isCompleted ? 'ring-4 ring-green-400/30 shadow-[0_20px_40px_-10px_rgba(34,197,94,0.2)]' : 'shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)]'}`}>
                   
                   {/* Badge de Número da Aula */}
                   <div className={`absolute top-4 left-4 z-20 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border-4 border-white shadow-lg ${isCompleted ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>
                      {isCompleted ? '✓' : index + 1}
                   </div>

                   {/* Área de Mídia */}
                   <div className="p-3 pb-0">
                        <div className="w-full aspect-video bg-slate-100 rounded-[2rem] overflow-hidden relative border-4 border-slate-50">
                            {item.type === 'video' ? (
                                <iframe
                                    src={getEmbedUrl(item.url)}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={item.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                ></iframe>
                            ) : item.type === 'image' ? (
                                <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 relative group cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                    <span className="text-5xl mb-4 text-blue-300 group-hover:scale-110 transition-transform">🔗</span>
                                    <span className="bg-white text-blue-600 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs shadow-md">
                                        Abrir Material
                                    </span>
                                </div>
                            )}
                        </div>
                   </div>

                   {/* Conteúdo */}
                   <div className="p-6 md:p-8">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                        {item.type === 'video' ? 'Videoaula' : 'Atividade'}
                                    </span>
                                    {isCompleted && <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">Concluído</span>}
                                </div>
                                <h3 className={`text-2xl font-black leading-tight ${isCompleted ? 'text-slate-400' : 'text-slate-800'}`}>
                                    {item.title}
                                </h3>
                            </div>
                        </div>

                        {item.description && (
                            <p className="text-slate-500 text-sm md:text-base font-bold leading-relaxed mb-8 bg-slate-50 p-4 rounded-2xl">
                                {item.description}
                            </p>
                        )}

                        <button 
                            onClick={() => toggleComplete(item.id)}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] active:scale-[0.99] border-b-4 ${
                                isCompleted 
                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-500'
                            }`}
                        >
                            {isCompleted ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                        </button>
                   </div>
               </div>
               )})
          )}
      </div>

      <div className="h-20"></div>
    </div>
  );
};
