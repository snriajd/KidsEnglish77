
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../db';
import { AppData, Module, AppSettings } from '../types';

type Tab = 'dashboard' | 'content' | 'design' | 'users' | 'announcements';

const FONT_OPTIONS = [
  { name: 'Lilita One', label: 'Cartoon' },
  { name: 'Fredoka', label: 'Divertida' },
  { name: 'Quicksand', label: 'Moderna' },
  { name: 'Nunito', label: 'Redonda' },
  { name: 'Comic Neue', label: 'Quadrinhos' },
  { name: 'Bubblegum Sans', label: 'Festa' },
  { name: 'Outfit', label: 'Clean' },
  { name: 'Baloo 2', label: 'Bouncy' },
];

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<AppData | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (localStorage.getItem('admin_active_tab') as Tab) || 'dashboard';
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // States de Formulário
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({
    title: '',
    dripDays: 0,
    banner: '',
    description: '',
    showInVertical: true,
    showInHorizontal: false
  });

  const [newUser, setNewUser] = useState({ name: '', phone: '' });
  const [newAnnouncement, setNewAnnouncement] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      // Verificação de sessão simples no localStorage
      if (!localStorage.getItem('admin_session')) {
        navigate('/admin-login');
        return;
      }
      // Carregamento do banco nativo
      try {
        const dbData = await api.getDb();
        setData(dbData);
      } catch (e) {
        showToast("Erro ao carregar banco de dados", "error");
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const refresh = async () => {
    const dbData = await api.getDb();
    setData(dbData);
  };

  // Atualizado para aceitar o formato (JPEG ou PNG)
  const compressImage = (base64: string, maxWidth = 1000, format = 'image/jpeg'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           // Limpa o canvas para garantir transparência no PNG
           ctx.clearRect(0, 0, width, height);
           ctx.drawImage(img, 0, 0, width, height);
        }
        // Usa o formato especificado (PNG para logos, JPEG para banners)
        resolve(canvas.toDataURL(format, 0.9));
      };
    });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // Banners continuam sendo JPEG para performance
        const compressed = await compressImage(base64, 1000, 'image/jpeg');
        setModuleForm(prev => ({ 
          ...prev, 
          banner: compressed, 
          bannerSize: (compressed.length / 1024).toFixed(1) + ' KB' 
        }));
        setIsUploading(false);
        showToast("Banner carregado!");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveModule = async () => {
    if (!moduleForm.title) {
        showToast("O título é obrigatório", "error");
        return;
    }

    try {
      if (editingModuleId) {
        const existing = data?.modules.find(m => m.id === editingModuleId);
        const updatedModule: Module = {
          ...existing,
          ...moduleForm,
          id: editingModuleId,
          active: true,
          category: 'videos'
        } as Module;
        await api.updateModule(updatedModule);
        showToast("Módulo atualizado!");
      } else {
        const newMod: Omit<Module, 'id'> = {
          title: moduleForm.title || '',
          description: moduleForm.description || '',
          dripDays: moduleForm.dripDays || 0,
          banner: moduleForm.banner || '',
          bannerSize: moduleForm.bannerSize || '',
          showInVertical: moduleForm.showInVertical ?? true,
          showInHorizontal: moduleForm.showInHorizontal ?? false,
          order: (data?.modules.length || 0) + 1,
          active: true,
          category: 'videos',
          icon: '📚'
        };
        await api.addModule(newMod);
        showToast("Módulo criado!");
      }
      
      setModuleForm({ title: '', dripDays: 0, banner: '', description: '', showInVertical: true, showInHorizontal: false });
      setEditingModuleId(null);
      await refresh();
    } catch(e) {
      showToast("Erro ao salvar no banco", "error");
    }
  };

  const handleUpdateDesign = async (key: keyof AppSettings, value: any) => {
    if (data) {
      const newSettings = { ...data.settings, [key]: value };
      await api.updateSettings(newSettings);
      await refresh();
      showToast("Design Atualizado!");
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const json = await api.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kidsenglish-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Backup baixado!");
    } catch (e) {
      showToast("Erro ao criar backup", "error");
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if(!confirm("ATENÇÃO: Isso irá substituir TODOS os dados atuais pelos do arquivo de backup. Deseja continuar?")) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const success = await api.importData(json);
        if (success) {
          showToast("Dados restaurados com sucesso!");
          await refresh();
        } else {
          showToast("Arquivo de backup inválido", "error");
        }
      } catch(err) {
        showToast("Erro ao ler arquivo", "error");
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Funções de Anúncios
  const handleAddAnnouncement = async () => {
    if (newAnnouncement) {
      await api.addAnnouncement(newAnnouncement);
      setNewAnnouncement('');
      await refresh();
      showToast("Aviso adicionado!");
    }
  };

  const handleUpdateAnnouncement = async (id: string, text: string) => {
    await api.updateAnnouncement(id, text);
    // Não precisa dar refresh aqui se usarmos o state local ou se o input for controlado, 
    // mas para garantir sincronia, damos refresh.
    // Para UX melhor em inputs, idealmente não damos refresh a cada tecla, mas aqui é onBlur ou botão.
    await refresh();
    showToast("Aviso atualizado!");
  };

  // Helper Stats
  const getStats = () => {
    if (!data) return { today: 0, yesterday: 0, last7: 0, month: 0, total: 0 };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - (86400000 * 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      today: data.users.filter(u => new Date(u.createdAt).getTime() >= startOfToday).length,
      yesterday: data.users.filter(u => {
        const t = new Date(u.createdAt).getTime();
        return t >= startOfYesterday && t < startOfToday;
      }).length,
      last7: data.users.filter(u => new Date(u.createdAt).getTime() >= startOf7Days).length,
      month: data.users.filter(u => new Date(u.createdAt).getTime() >= startOfMonth).length,
      total: data.users.length
    };
  };

  if (!data) return null;
  const stats = getStats();

  const NavItem = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false); // Fecha o sidebar ao clicar
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="bg-black min-h-screen flex text-slate-400 font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-in fade-in zoom-in ${
          notification.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* Overlay para fechar sidebar mobile ao clicar fora */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[55] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[60] w-64 bg-[#050505] border-r border-white/[0.03] p-6 flex flex-col gap-8 transition-transform duration-500
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-logo text-2xl text-white shadow-xl">K</div>
          <h1 className="text-white font-logo text-xl tracking-tight">Kids<span className="text-blue-500">Admin</span></h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem id="dashboard" label="Métricas" icon="📊" />
          <NavItem id="content" label="Cursos" icon="🎥" />
          <NavItem id="users" label="Alunos" icon="👤" />
          <NavItem id="announcements" label="Avisos" icon="📣" />
          <NavItem id="design" label="Design" icon="🎨" />
        </nav>

        <div className="space-y-3 pt-6 border-t border-white/[0.05]">
          <button 
            onClick={() => navigate('/dashboard?preview=true')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-[9px] uppercase tracking-[0.2em] transition-all shadow-lg"
          >
            Ver Plataforma 👁️
          </button>
          <button 
            onClick={() => { localStorage.removeItem('admin_session'); navigate('/admin-login'); }}
            className="w-full text-slate-700 hover:text-red-500 font-black text-[9px] uppercase tracking-widest py-2"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative h-screen bg-black">
        <div className="lg:hidden p-5 border-b border-white/[0.05] flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-40">
           <button onClick={() => setIsSidebarOpen(true)} className="text-blue-500 text-xl">☰</button>
           <h2 className="text-[10px] font-black uppercase tracking-widest text-white">{activeTab}</h2>
           <div className="w-6"></div>
        </div>

        <div className="max-w-5xl mx-auto p-6 lg:p-12 space-y-10">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col gap-1">
                <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Analytics Real</span>
                <h2 className="text-3xl font-black text-white tracking-tighter">Matrículas</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                 {[
                   { label: 'Hoje', value: stats.today },
                   { label: 'Ontem', value: stats.yesterday },
                   { label: '7 Dias', value: stats.last7 },
                   { label: 'Mês', value: stats.month },
                   { label: 'Total', value: stats.total },
                 ].map(s => (
                   <div key={s.label} className="bg-[#050505] border border-white/[0.05] p-5 rounded-2xl text-center">
                      <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                      <h3 className="text-2xl font-black text-white">{s.value}</h3>
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 bg-[#050505] rounded-[2rem] border border-white/[0.05] p-8">
                    <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-6">Últimos Alunos</h4>
                    <div className="space-y-3">
                        {data.users.slice(-5).reverse().map(u => (
                          <div key={u.phone} className="flex items-center justify-between py-3 border-b border-white/[0.02]">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-xs">{u.name?.charAt(0)}</div>
                              <div>
                                <p className="text-white font-bold text-sm">{u.name}</p>
                                <p className="text-[9px] text-slate-600 uppercase">{u.phone}</p>
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-800 uppercase">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                    </div>
                 </div>
                 <div className="bg-white/[0.01] border border-white/[0.05] rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
                    <span className="text-2xl mb-2">📚</span>
                    <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Módulos</p>
                    <h4 className="text-5xl font-black text-white mt-1">{data.modules.length}</h4>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-white tracking-tighter">Módulos</h2>
                <button 
                  onClick={() => { setEditingModuleId(null); setModuleForm({ title: '', dripDays: 0, banner: '', showInVertical: true, showInHorizontal: false }); }}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Criar Módulo
                </button>
              </div>

              {(moduleForm.title !== undefined || editingModuleId) && (
                <div className="bg-[#050505] p-8 rounded-[2.5rem] border border-blue-500/20 space-y-8 animate-in zoom-in duration-300">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                    <h3 className="text-blue-500 font-black uppercase text-[10px] tracking-widest">{editingModuleId ? 'Editar' : 'Novo'} Módulo</h3>
                    <button onClick={() => {setModuleForm({title: '', dripDays: 0, banner: ''}); setEditingModuleId(null);}} className="text-slate-600 text-xs hover:text-white transition-colors">✕ CANCELAR</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase ml-2 mb-1 block">Título</label>
                            <input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Histórias de Verão" className="w-full bg-black border border-white/[0.08] rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase ml-2 mb-1 block">Dias p/ Liberar</label>
                            <input type="number" value={moduleForm.dripDays} onChange={e => setModuleForm({ ...moduleForm, dripDays: parseInt(e.target.value) })} className="w-full bg-black border border-white/[0.08] rounded-xl p-4 text-white text-sm outline-none" />
                        </div>

                        {/* Controles de Visibilidade */}
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-600 uppercase ml-2 block">Onde exibir?</label>
                           <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] cursor-pointer hover:bg-white/[0.06] transition-colors">
                                 <input 
                                   type="checkbox" 
                                   checked={moduleForm.showInVertical !== false} // Default true
                                   onChange={e => setModuleForm({...moduleForm, showInVertical: e.target.checked})} 
                                   className="w-4 h-4 accent-blue-600"
                                 />
                                 <span className="text-white text-xs font-bold">Lista Vertical (Principal)</span>
                              </label>
                              <label className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] cursor-pointer hover:bg-white/[0.06] transition-colors">
                                 <input 
                                   type="checkbox" 
                                   checked={moduleForm.showInHorizontal === true} // Default false
                                   onChange={e => setModuleForm({...moduleForm, showInHorizontal: e.target.checked})} 
                                   className="w-4 h-4 accent-purple-500"
                                 />
                                 <span className="text-white text-xs font-bold">Lista Horizontal (Mais Aventuras)</span>
                              </label>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase ml-2 block">Capa do Módulo (Banner)</label>
                        <div 
                            onClick={() => bannerInputRef.current?.click()}
                            className="w-full aspect-video bg-black border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative group"
                        >
                            {isUploading && <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
                            {moduleForm.banner ? (
                                <img src={moduleForm.banner} className="w-full h-full object-cover transition-opacity group-hover:opacity-60" />
                            ) : (
                                <div className="text-center"><span className="text-2xl opacity-20 block mb-2">🖼️</span><span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Upload Banner</span></div>
                            )}
                        </div>
                        <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                    </div>
                  </div>

                  <button onClick={saveModule} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl">Salvar Módulo</button>
                </div>
              )}

              <div className="grid gap-4">
                {data.modules.sort((a,b) => a.order - b.order).map(m => (
                  <div key={m.id} className="bg-white/[0.02] rounded-3xl border border-white/[0.05] p-6 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-black overflow-hidden flex items-center justify-center border border-white/[0.1] shadow-inner relative">
                        {m.banner ? <img src={m.banner} className="w-full h-full object-cover" /> : <span className="opacity-10 text-2xl">📚</span>}
                        {/* Indicadores Visuais */}
                        <div className="absolute bottom-0 right-0 p-1 flex gap-0.5">
                           {m.showInVertical !== false && <div className="w-2 h-2 bg-blue-500 rounded-full border border-black" title="Vertical"></div>}
                           {m.showInHorizontal === true && <div className="w-2 h-2 bg-purple-500 rounded-full border border-black" title="Horizontal"></div>}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">{m.title}</h4>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1.5">
                           {m.showInVertical !== false ? 'Vertical' : ''} 
                           {m.showInVertical !== false && m.showInHorizontal ? ' + ' : ''}
                           {m.showInHorizontal ? 'Horizontal' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setModuleForm(m); setEditingModuleId(m.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-3 bg-white/5 rounded-xl hover:text-blue-500 transition-all font-black text-[9px] uppercase">Editar</button>
                        <button onClick={() => { if(confirm('Apagar?')) { api.removeModule(m.id); refresh(); showToast("Removido", "error"); } }} className="p-3 bg-white/5 rounded-xl hover:text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black text-white tracking-tighter">Matrículas</h2>
              <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/[0.05] space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nome da Criança" className="bg-black border border-white/[0.08] rounded-xl p-4 text-white text-sm font-bold outline-none" />
                    <input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="Zap com DDD" className="bg-black border border-white/[0.08] rounded-xl p-4 text-white text-sm font-bold outline-none" />
                 </div>
                 <button onClick={async () => { if(newUser.name && newUser.phone) { await api.addUser(newUser); setNewUser({ name: '', phone: '' }); await refresh(); showToast("Matriculado!"); } }} className="w-full bg-blue-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg">Cadastrar Aluno</button>
              </div>

              <div className="bg-[#050505] rounded-[2rem] border border-white/[0.02] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="text-[9px] font-black uppercase text-slate-700 tracking-widest bg-white/[0.02]">
                        <tr><th className="px-8 py-5">Nome</th><th className="px-8 py-5">Zap</th><th className="px-8 py-5 text-right">Ação</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {data.users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                            <tr key={u.phone} className="hover:bg-white/[0.01]">
                                <td className="px-8 py-5 text-white font-bold text-sm">{u.name}</td>
                                <td className="px-8 py-5 text-slate-500 font-mono text-xs">{u.phone}</td>
                                <td className="px-8 py-5 text-right">
                                    <button onClick={async () => { if(confirm('Excluir?')) { await api.removeUser(u.phone); await refresh(); showToast("Removido", "error"); } }} className="text-red-500/30 hover:text-red-500 text-[9px] font-black uppercase">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex flex-col gap-1">
                 <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Barra de Avisos</span>
                 <h2 className="text-3xl font-black text-white tracking-tighter">Avisos</h2>
               </div>

               <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/[0.05] space-y-6">
                 <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Novo Aviso</h4>
                 <div className="flex gap-4">
                    <input 
                      value={newAnnouncement} 
                      onChange={e => setNewAnnouncement(e.target.value)} 
                      placeholder="Ex: Feliz Natal! 🎄" 
                      className="flex-1 bg-black border border-white/[0.08] rounded-xl p-4 text-white text-sm font-bold outline-none" 
                    />
                    <button onClick={handleAddAnnouncement} className="bg-blue-600 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest text-white shadow-lg hover:scale-105 transition-transform">Adicionar</button>
                 </div>
               </div>

               <div className="space-y-4">
                 {data.announcements.map(ann => (
                   <div key={ann.id} className="bg-white/[0.02] rounded-2xl border border-white/[0.05] p-6 flex flex-col md:flex-row items-center gap-4 group hover:bg-white/[0.04] transition-all">
                     <div className="flex-1 w-full">
                       <input 
                         defaultValue={ann.text}
                         onBlur={(e) => {
                            if (e.target.value !== ann.text) {
                                handleUpdateAnnouncement(ann.id, e.target.value);
                            }
                         }}
                         className="w-full bg-transparent text-white font-bold text-lg outline-none border-b border-transparent focus:border-blue-500/50 pb-1 transition-colors"
                       />
                       <p className="text-[9px] text-slate-600 uppercase mt-1">Criado em: {new Date(ann.date).toLocaleDateString()}</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={async () => { await api.toggleAnnouncement(ann.id); refresh(); }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${ann.active ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}
                        >
                          {ann.active ? 'Ativo' : 'Oculto'}
                        </button>
                        <button 
                          onClick={async () => { if(confirm('Apagar aviso?')) { await api.removeAnnouncement(ann.id); refresh(); } }}
                          className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                     </div>
                   </div>
                 ))}
                 {data.announcements.length === 0 && (
                   <div className="text-center py-10 text-slate-600 text-[10px] uppercase tracking-widest">Nenhum aviso cadastrado.</div>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <h2 className="text-3xl font-black text-white tracking-tighter">Design</h2>
               
               {/* Seção de Tipografia */}
               <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/[0.05] space-y-6">
                 <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Tipografia & Fontes</h4>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                   {FONT_OPTIONS.map((font) => (
                     <button
                        key={font.name}
                        onClick={() => handleUpdateDesign('fontFamily', font.name)}
                        className={`
                          relative p-4 rounded-xl border transition-all text-center group
                          ${data.settings.fontFamily === font.name 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                            : 'bg-white/5 border-transparent hover:border-white/20 text-slate-300'}
                        `}
                     >
                        <div className="text-2xl mb-2" style={{ fontFamily: font.name }}>
                          {font.name}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-60">
                           {font.label}
                        </div>
                        {data.settings.fontFamily === font.name && (
                           <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        )}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/[0.05] space-y-6">
                     <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Logo Principal</h4>
                     <button onClick={() => logoInputRef.current?.click()} className="w-full bg-white/5 border border-white/[0.1] hover:border-blue-500 rounded-xl p-4 text-[10px] font-black uppercase tracking-widest">Trocar Logo</button>
                     <input type="file" ref={logoInputRef} className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => { 
                            // AQUI: Força o formato PNG para garantir transparência
                            const compressed = await compressImage(reader.result as string, 500, 'image/png');
                            await handleUpdateDesign('logoUrl', compressed); 
                          };
                          reader.readAsDataURL(file);
                        }
                     }} />
                     <div className="space-y-4 pt-4 border-t border-white/[0.02]">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest"><span>Tamanho</span><span className="text-blue-500">{data.settings.logoWidth}px</span></div>
                        <input type="range" min="80" max="400" value={data.settings.logoWidth} onChange={e => handleUpdateDesign('logoWidth', parseInt(e.target.value))} className="w-full h-1 bg-white/10 appearance-none accent-blue-600 rounded" />
                     </div>
                  </div>
                  <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/[0.05] space-y-8">
                     <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Cores</h4>
                     <div className="grid grid-cols-2 gap-6">
                        <input type="color" value={data.settings.primaryColor} onChange={e => handleUpdateDesign('primaryColor', e.target.value)} className="w-full h-14 bg-transparent cursor-pointer rounded-2xl border border-white/[0.05]" />
                        <input type="color" value={data.settings.accentColor} onChange={e => handleUpdateDesign('accentColor', e.target.value)} className="w-full h-14 bg-transparent cursor-pointer rounded-2xl border border-white/[0.05]" />
                     </div>
                  </div>
                  <div className="bg-[#050505] p-8 rounded-[2rem] border border-white/[0.05] space-y-6">
                     <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Backup & Segurança</h4>
                     <p className="text-slate-500 text-xs font-medium">Salve seus dados (banners, alunos, cursos) em um arquivo seguro.</p>
                     <div className="flex gap-4">
                        <button onClick={handleDownloadBackup} className="flex-1 bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white border border-green-500/20 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg active:scale-95">
                           ⬇ Baixar Backup
                        </button>
                        <label className="flex-1 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-500/20 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg active:scale-95 text-center cursor-pointer flex items-center justify-center">
                           ⬆ Restaurar Dados
                           <input type="file" className="hidden" accept=".json" onChange={handleRestoreBackup} />
                        </label>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
