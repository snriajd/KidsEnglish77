
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redireciona automaticamente se já houver sessão
  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session) {
      navigate('/admin');
    }
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

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center p-6 text-white font-sans">
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
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center font-logo text-4xl text-white mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">K</div>
        <h1 className="text-2xl font-black uppercase tracking-[0.4em] text-white">Console<span className="text-blue-500">Admin</span></h1>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.6em] mt-3">Segurança Nível 1</p>
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.3em] mt-4"
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
