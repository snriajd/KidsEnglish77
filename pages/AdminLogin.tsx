
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicSettings } from '../db';
import { AppSettings } from '../types';

export const AdminLogin: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
        const session = localStorage.getItem('admin_session');
        if (session) {
            navigate('/admin');
            return;
        }
        // Usar a versão otimizada
        const s = await getPublicSettings();
        setSettings(s);
    };
    init();
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === 'snarud' && password === 'snarud7') {
      localStorage.setItem('admin_session', 'true');
      navigate('/admin');
    } else {
      setError('Credenciais incorretas.');
    }
  };

  if (!settings) return null;

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center p-6 text-white font-sans" style={{ fontFamily: settings.fontFamily }}>
      <div className="w-full max-w-sm mb-12 animate-in fade-in duration-500">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Área do Aluno
        </button>
      </div>

      <div className="mb-12 text-center animate-in zoom-in duration-700">
        <div 
            className="w-16 h-16 rounded-3xl flex items-center justify-center font-logo text-4xl text-white mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            style={{ backgroundColor: settings.primaryColor }}
        >
            {settings.logoUrl ? <img src={settings.logoUrl} className="w-10 h-10 object-contain" /> : 'K'}
        </div>
        <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-white">
            {settings.adminLoginTitle}
        </h1>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.6em] mt-3">
          {settings.adminLoginSubtitle || 'Segurança Nível 1'}
        </p>
      </div>

      <div className="w-full max-w-sm bg-white/[0.02] border border-white/[0.05] rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom-8 duration-1000">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Identificação</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full bg-black border border-white/[0.08] rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500/50 transition-all"
              placeholder="Username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] ml-4">Chave de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/[0.08] rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest text-center animate-pulse">{error}</p>}
          <button
            type="submit"
            style={{ backgroundColor: settings.primaryColor }}
            className="w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.3em] mt-4"
          >
            Autenticar
          </button>
        </form>
      </div>

      <div className="mt-16 text-slate-800 text-[8px] font-black uppercase tracking-[0.8em]">
        KidsEnglish Core Engine v2.0
      </div>
    </div>
  );
};
