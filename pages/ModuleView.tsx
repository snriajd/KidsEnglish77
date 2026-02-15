
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
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
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
  const theme = settings.moduleDesignTheme || 'modern-glass';

  // --- THEME CONFIGURATIONS ---
  const themes = {
      'modern-glass': {
          bg: '#FFFBEB',
          bgImage: 'radial-gradient(#E2E8F0 1.5px, transparent 1.5px)',
          headerClass: 'bg-white/95 backdrop-blur-xl border-b-[3px] border-slate-200 shadow-sm rounded-2xl',
          cardClass: (isCompleted: boolean) => `bg-white rounded-[2.5rem] overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${isCompleted ? 'ring-4 ring-green-400/30 shadow-lg' : 'shadow-md'}`,
          titleClass: 'text-slate-800 font-bold',
          btnClass: (isCompleted: boolean) => `rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] border-b-4 ${isCompleted ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-500'}`
      },
      'playful-kids': {
          bg: '#FFFAFA',
          bgImage: 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6), linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6)',
          headerClass: 'bg-yellow-400 border-4 border-black text-black rounded-xl shadow-[4px_4px_0_black]',
          cardClass: (isCompleted: boolean) => `bg-white border-4 border-black rounded-3xl overflow-hidden transition-all duration-300 hover:rotate-1 ${isCompleted ? 'bg-green-50' : ''} shadow-[8px_8px_0_rgba(0,0,0,1)]`,
          titleClass: 'text-black font-black tracking-tighter',
          btnClass: (isCompleted: boolean) => `rounded-xl border-4 border-black font-black uppercase text-xs transition-all shadow-[4px_4px_0_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${isCompleted ? 'bg-green-400 text-black' : 'bg-pink-500 text-white hover:bg-pink-400'}`
      },
      'cinema-dark': {
          bg: '#111827',
          bgImage: 'none',
          headerClass: 'bg-gray-900 border border-gray-800 text-white rounded-lg shadow-2xl',
          cardClass: (isCompleted: boolean) => `bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 ${isCompleted ? 'border-green-500/50' : 'hover:border-gray-600'}`,
          titleClass: 'text-white font-bold tracking-wide',
          btnClass: (isCompleted: boolean) => `rounded-lg font-bold uppercase text-[10px] tracking-widest transition-colors ${isCompleted ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-white text-black hover:bg-gray-200'}`
      },
      'minimal-list': {
          bg: '#FFFFFF',
          bgImage: 'none',
          headerClass: 'bg-white border-b border-gray-100',
          cardClass: (isCompleted: boolean) => `bg-white border-b border-gray-100 py-6 last:border-0 ${isCompleted ? 'opacity-70' : ''}`,
          titleClass: 'text-gray-900 font-bold',
          btnClass: (isCompleted: boolean) => `rounded-full border border-gray-200 px-6 py-2 text-xs font-bold transition-colors ${isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-black text-white hover:bg-gray-800'}`
      },
      'gamer-grid': {
          bg: '#0F172A',
          bgImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
          headerClass: 'bg-slate-800/90 border-b-4 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]',
          cardClass: (isCompleted: boolean) => `bg-slate-800 border-2 ${isCompleted ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-indigo-500/50 hover:border-indigo-400'} rounded-none transition-all duration-200 skew-x-[-2deg]`,
          titleClass: 'text-white font-mono uppercase tracking-tight',
          btnClass: (isCompleted: boolean) => `clip-path-polygon font-mono text-xs uppercase tracking-widest py-3 hover:bg-opacity-80 transition-all ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`
      }
  };

  const currentTheme = themes[theme] || themes['modern-glass'];
  const isMinimal = theme === 'minimal-list';

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-500 overflow-x-hidden ${theme === 'cinema-dark' ? 'text-white' : 'text-slate-800'}`} 
         style={{ 
             fontFamily: settings.fontFamily, 
             backgroundColor: currentTheme.bg, 
             backgroundImage: currentTheme.bgImage,
             backgroundSize: theme === 'gamer-grid' ? '40px 40px' : '24px 24px'
         }}>
      
      {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-center overflow-hidden">
              <div className="absolute top-[20%] left-[20%] text-8xl animate-bounce duration-700">🎉</div>
              <div className="absolute top-[30%] right-[20%] text-8xl animate-pulse duration-500">⭐</div>
              <div className="absolute bottom-[40%] left-[40%] text-8xl animate-bounce duration-1000">✨</div>
          </div>
      )}

      {/* --- HEADER FLUTUANTE --- */}
      <div className="sticky top-0 z-50 px-4 py-3">
         <div className={`flex items-center justify-between max-w-2xl mx-auto p-3 ${currentTheme.headerClass}`}>
            <button 
                onClick={handleBack} 
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${theme === 'playful-kids' ? 'bg-white border-2 border-black hover:-translate-y-1' : theme === 'cinema-dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 shadow-sm'}`}
            >
                <span className="font-black text-xl">←</span> 
            </button>
            
            <div className="flex-1 mx-4">
                <div className={`flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 ${theme === 'cinema-dark' || theme === 'gamer-grid' ? 'text-gray-400' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1">🏆 Progresso</span>
                    <span className="text-blue-500">{Math.round(progress)}%</span>
                </div>
                <div className={`h-4 rounded-full overflow-hidden ${theme === 'playful-kids' ? 'border-2 border-black bg-white' : 'bg-slate-100 border border-slate-200'}`}>
                    <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 ease-out relative" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
         </div>
      </div>

      {/* --- HERO SECTION --- */}
      {!isMinimal && (
          <div className="relative w-full mb-10 group">
              <div className="w-full h-[35vh] relative overflow-hidden bg-slate-900 shadow-sm">
                {module.banner ? (
                    <img src={module.banner} alt={module.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-9xl opacity-20 animate-bounce">🚀</span>
                    </div>
                )}
              </div>
          </div>
      )}

      {/* --- LISTA DE AULAS --- */}
      <div className={`max-w-2xl mx-auto px-4 ${theme === 'gamer-grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}`}>
          {isMinimal && (
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
               <p className="text-gray-500 mt-2">{module.description}</p>
            </div>
          )}
          
          {content.length === 0 ? (
             <div className="text-center py-20 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-300">
                <div className="text-6xl mb-4 grayscale opacity-40">🎬</div>
                <h3 className="text-2xl font-black text-slate-400">Em Breve</h3>
             </div>
          ) : (
             content.map((item, index) => {
               const isCompleted = completedItems.includes(item.id);
               return (
               <div key={item.id} className={currentTheme.cardClass(isCompleted)}>
                   
                   {/* Layout Minimalista: Linha Simples */}
                   {isMinimal ? (
                       <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-400 flex-shrink-0">
                               {isCompleted ? '✓' : index + 1}
                           </div>
                           <div className="flex-1">
                               <h3 className="font-bold text-gray-900">{item.title}</h3>
                               <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{item.type}</div>
                           </div>
                           <button onClick={() => window.open(item.url, '_blank')} className="text-xs font-bold underline text-gray-500 mr-4">Ver Aula</button>
                           <button onClick={() => toggleComplete(item.id)} className={`w-6 h-6 rounded-full border flex items-center justify-center ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                              {isCompleted && '✓'}
                           </button>
                       </div>
                   ) : (
                       // Layouts com Cards (Modern, Playful, Cinema, Gamer)
                       <>
                           <div className="p-3 pb-0">
                                <div className={`w-full aspect-video rounded-xl overflow-hidden relative ${theme === 'playful-kids' ? 'border-2 border-black' : ''}`}>
                                    {item.type === 'video' ? (
                                        <iframe src={getEmbedUrl(item.url)} className="w-full h-full" allowFullScreen title={item.title}></iframe>
                                    ) : item.type === 'image' ? (
                                        <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                            <span className="text-4xl mb-2">🔗</span>
                                            <span className="font-bold uppercase text-xs">Abrir Link</span>
                                        </div>
                                    )}
                                    {/* Badge Número */}
                                    <div className={`absolute top-2 left-2 w-8 h-8 flex items-center justify-center font-bold text-sm shadow-md ${theme === 'playful-kids' ? 'bg-white border-2 border-black rounded-lg text-black' : 'bg-black/60 text-white rounded-full backdrop-blur-md'}`}>
                                        {isCompleted ? '✓' : index + 1}
                                    </div>
                                </div>
                           </div>

                           <div className="p-6">
                                <h3 className={`text-xl mb-2 ${currentTheme.titleClass}`}>{item.title}</h3>
                                {item.description && (
                                    <p className={`text-sm mb-6 ${theme === 'cinema-dark' || theme === 'gamer-grid' ? 'text-gray-400' : 'text-slate-500'}`}>
                                        {item.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'playful-kids' ? 'text-black bg-yellow-300 px-2 py-1 border border-black rounded' : 'text-slate-400'}`}>
                                        {item.type === 'video' ? 'Assistir' : item.type === 'image' ? 'Ver Imagem' : 'Acessar'}
                                    </span>
                                    <button 
                                        onClick={() => toggleComplete(item.id)}
                                        className={`px-6 py-3 ${currentTheme.btnClass(isCompleted)}`}
                                    >
                                        {isCompleted ? 'Concluído!' : 'Marcar Feito'}
                                    </button>
                                </div>
                           </div>
                       </>
                   )}
               </div>
               );
             })
          )}
      </div>
    </div>
  );
};
