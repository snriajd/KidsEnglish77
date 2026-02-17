
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { findUser, getDb } from '../db';
import { AppSettings } from '../types';

export const UserLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
        const db = await getDb();
        setSettings(db.settings);
    };
    loadSettings();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsLoading(true);
    setError('');

    // Pequeno delay artificial para sensação de processamento
    await new Promise(r => setTimeout(r, 800));

    if (settings.maintenanceMode) {
      setError('O sistema está em manutenção. Tente mais tarde!');
      setIsLoading(false);
      return;
    }

    // Normaliza o telefone (remove caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
        const user = await findUser(cleanPhone);
        
        if (user) {
          if (!user.active) {
             setError('Acesso desativado. Contate a escola.');
          } else {
             localStorage.setItem('user_session', JSON.stringify(user));
             navigate('/dashboard');
             return;
          }
        } else {
          setError('Ops! Número não encontrado.');
        }
    } catch (e) {
        setError('Erro de conexão. Verifique sua internet.');
    } finally {
        setIsLoading(false);
    }
  };

  if (!settings) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (settings.maintenanceMode) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center relative overflow-hidden" style={{ fontFamily: settings.fontFamily }}>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="z-10 bg-white/5 backdrop-blur-lg p-10 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-md w-full animate-in zoom-in duration-500">
               <div className="text-6xl mb-6 animate-bounce">🚧</div>
               <h1 className="text-3xl font-black uppercase tracking-widest mb-4 text-yellow-400">Em Manutenção</h1>
               <p className="text-slate-300 font-bold mb-8">Estamos preparando novidades incríveis! O sistema volta em breve.</p>
               {settings.showAdminLink && (
                 <Link to="/admin-login" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-widest transition-all">Acesso Admin</Link>
               )}
           </div>
        </div>
     )
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ 
          fontFamily: settings.fontFamily,
          background: `radial-gradient(circle at center, ${settings.primaryColor} 0%, #0f172a 100%)`
      }}
    >
      {/* Background Decorativo Animado */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />

      <div className="w-full max-w-md z-10 animate-in slide-in-from-bottom-8 duration-700 fade-in">
        
        {/* Card Principal */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[3rem] p-8 md:p-10 relative overflow-hidden group">
            
            {/* Brilho Superior no Card */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-10">
                <div className="mb-6 transform transition-transform group-hover:scale-105 duration-500">
                    {settings.logoUrl ? (
                    <img 
                        src={settings.logoUrl} 
                        alt={settings.appName} 
                        style={{ width: `${settings.logoWidth}px` }}
                        className="drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                    />
                    ) : (
                    <h1 className="font-logo text-5xl md:text-6xl tracking-tighter text-white drop-shadow-lg">
                        Kids<span className="text-yellow-400">English</span>
                    </h1>
                    )}
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-white font-black text-xl tracking-wide uppercase">Portal do Aluno</h2>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest opacity-80">Aprender nunca foi tão divertido!</p>
                </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-white/60 text-[10px] font-black uppercase tracking-widest pl-4">Seu Número de Acesso</label>
                    <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className="text-xl group-focus-within/input:scale-110 transition-transform duration-300">📱</span>
                        </div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(99) 99999-9999"
                            className="w-full bg-black/20 border border-white/10 text-white placeholder:text-white/30 text-lg font-bold rounded-2xl py-4 pl-14 pr-4 outline-none focus:bg-black/40 focus:border-blue-400/50 transition-all shadow-inner"
                            required
                        />
                    </div>
                </div>
                
                {error && (
                    <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3 animate-in shake">
                        <span className="text-lg">⚠️</span>
                        <p className="text-rose-200 text-xs font-bold leading-tight">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/btn overflow-hidden rounded-2xl p-[1px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-transform"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl py-4 px-6 transition-all">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest">Entrando...</span>
                            </div>
                        ) : (
                            <span className="text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                Começar Aventura 🚀
                            </span>
                        )}
                    </div>
                </button>
            </form>

            {/* Admin Footer */}
            {settings.showAdminLink && (
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <Link 
                        to="/admin-login" 
                        className="inline-flex items-center gap-2 text-white/30 hover:text-white/80 transition-colors text-[9px] font-black uppercase tracking-[0.2em]"
                    >
                        <span>🔒</span> Área Administrativa
                    </Link>
                </div>
            )}
        </div>
        
        <p className="text-center text-white/20 text-[9px] font-black uppercase tracking-[0.5em] mt-8">
            Plataforma Segura v1.0
        </p>
      </div>
    </div>
  );
};
