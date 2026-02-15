
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { findUser, getDb } from '../db';
import { AppSettings } from '../types';

export const UserLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
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

    if (settings.maintenanceMode) {
      setError('Sistema em manutenção. Tente novamente mais tarde.');
      return;
    }

    const user = await findUser(phone);
    if (user) {
      try {
          localStorage.setItem('user_session', JSON.stringify(user));
          navigate('/dashboard');
      } catch (e) {
          setError('Erro ao salvar sessão. Limpe o cache do navegador.');
      }
    } else {
      setError('Número não cadastrado.');
    }
  };

  if (!settings) return <div className="min-h-screen bg-black"></div>;

  // Tela de Manutenção
  if (settings.maintenanceMode) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center" style={{ fontFamily: settings.fontFamily }}>
           <div className="text-6xl mb-6 animate-pulse">🛠️</div>
           <h1 className="text-3xl font-black uppercase tracking-widest mb-4">Em Manutenção</h1>
           <p className="text-slate-400 font-bold max-w-md">Estamos melhorando a plataforma para você. Volte em alguns instantes.</p>
           <Link to="/admin-login" className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-colors">Acesso Admin</Link>
        </div>
     )
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white"
      style={{ fontFamily: settings.fontFamily }}
    >
      <div className="mb-16 text-center select-none flex flex-col items-center animate-in fade-in zoom-in duration-700">
        {settings.logoUrl ? (
          <img 
            src={settings.logoUrl} 
            alt={settings.appName} 
            style={{ width: `${settings.logoWidth}px` }}
            className="mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        ) : (
          <h1 className="font-logo text-5xl tracking-tighter" style={{ color: 'white' }}>
            Kids<span style={{ color: settings.accentColor }}>English</span>
          </h1>
        )}
      </div>

      <div className="w-full max-w-sm space-y-10 animate-in slide-in-from-bottom-8 duration-1000">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-center text-slate-500 font-black text-[10px] uppercase tracking-[0.4em]">
              {settings.loginTitle || "Acesso Exclusivo"}
            </label>
             <p className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500/50 text-center -mt-2 mb-4">
               {settings.loginSubtitle || "Premium Education"}
            </p>

            <div className="relative group">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp com DDD"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[2rem] px-8 py-6 text-center text-white font-bold text-xl outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all group-hover:border-white/20"
                required
              />
            </div>
          </div>
          
          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">{error}</p>}

          <button
            type="submit"
            style={{ backgroundColor: settings.primaryColor }}
            className="w-full text-white font-black py-6 rounded-[2rem] text-sm uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Entrar na Plataforma
          </button>
        </form>

        <div className="text-center pt-8 border-t border-white/[0.05]">
          <Link 
            to="/admin-login" 
            className="text-slate-600 hover:text-blue-400 text-[9px] font-black uppercase tracking-[0.4em] transition-colors"
          >
            Acesso Administrativo
          </Link>
        </div>
      </div>
    </div>
  );
};
