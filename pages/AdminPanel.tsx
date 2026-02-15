
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getDb, updateSettings, addModule, updateModule, removeModule, 
    addMedia, removeMedia, addUser, removeUser, updateUser, addAnnouncement, 
    removeAnnouncement, toggleAnnouncement, importData, exportData,
    reorderModule, resetDb
} from '../db';
import { AppData, Module, AppSettings, Announcement, Media, User } from '../types';

// --- UI Components ---

const Badge = ({ children, variant = 'default' }: { children?: React.ReactNode, variant?: 'success' | 'warning' | 'default' }) => {
    const styles = {
        success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        warning: 'bg-orange-50 text-orange-600 border-orange-100',
        default: 'bg-slate-50 text-slate-500 border-slate-100'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[variant]}`}>
            {children}
        </span>
    );
};

const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) => (
  <div className="flex items-center justify-between p-1 cursor-pointer" onClick={() => onChange(!checked)}>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-4' : ''}`} />
    </div>
  </div>
);

const StatCard = ({ label, value, icon, subtext }: { label: string, value: string | number, icon: string, subtext?: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 h-full justify-between hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs">{icon}</span>
            {label}
        </span>
    </div>
    <div className="flex items-end justify-between mt-1">
        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
        {subtext && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{subtext}</span>}
    </div>
  </div>
);

// --- PREMIUM AREA CHART ---
const PremiumChart = ({ data }: { data: { label: string, value: number }[] }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value), 1) * 1.2; // 20% padding top
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const y = 100 - (d.value / maxValue) * 100;
        return `${x},${y}`;
    });

    const polygonPoints = `0,100 ${points.join(' ')} 100,100`;
    const linePoints = points.join(' ');

    return (
        <div className="w-full h-64 relative select-none mt-4">
            {/* Tooltip */}
            {hoveredIndex !== null && data[hoveredIndex] && (
                <div 
                    className="absolute z-10 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xl -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-75"
                    style={{ 
                        left: `${(hoveredIndex / (data.length - 1 || 1)) * 100}%`, 
                        top: `${100 - (data[hoveredIndex].value / maxValue) * 100}%`,
                        marginTop: '-12px'
                    }}
                >
                    {data[hoveredIndex].value} alunos
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
            )}

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="0.5" />

                {/* Area Fill */}
                <polygon points={polygonPoints} fill="url(#chartGradient)" />

                {/* Line */}
                <polyline 
                    points={linePoints} 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="drop-shadow-sm"
                />

                {/* Interactive Points */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = 100 - (d.value / maxValue) * 100;
                    return (
                        <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                            {/* Invisible larger hit area */}
                            <circle cx={x} cy={y} r="6" fill="transparent" className="cursor-pointer" />
                            {/* Visible Dot */}
                            <circle 
                                cx={x} 
                                cy={y} 
                                r={hoveredIndex === i ? 2.5 : 1.5} 
                                fill="white" 
                                stroke="#10B981" 
                                strokeWidth="1.5"
                                className="transition-all duration-200 pointer-events-none"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between mt-2 px-1">
                {data.map((d, i) => (
                    <span key={i} className="text-[9px] font-bold text-slate-300 uppercase w-6 text-center">{d.label}</span>
                ))}
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm mb-8">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-200 transition-all">Excluir</button>
                </div>
            </div>
        </div>
    );
};

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'modules' | 'users' | 'design' | 'announcements' | 'system'>('dashboard');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States for Editing
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({});
  const [mediaForm, setMediaForm] = useState<Partial<Media>>({ type: 'video', title: '', url: '' });
  const [settingsForm, setSettingsForm] = useState<AppSettings | null>(null);
  const [userForm, setUserForm] = useState({ phone: '', name: '' });
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // Dashboard Filter States
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filteredUserCount, setFilteredUserCount] = useState(0);
  const [chartData, setChartData] = useState<{label: string, value: number}[]>([]);

  useEffect(() => { loadDb(); }, []);
  
  useEffect(() => { 
      if (data?.settings) setSettingsForm(data.settings); 
      if (data?.users) processDashboardData();
  }, [data, dateFilter, customStartDate, customEndDate]);

  const loadDb = async () => { setData(await getDb()); };

  const processDashboardData = () => {
      if (!data) return;
      const now = new Date();
      let start = new Date();
      let end = new Date();
      let labels: string[] = [];
      let counts: number[] = [];

      const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = stripTime(now);

      if (dateFilter === 'today') {
          start = today;
          end = new Date(today.getTime() + 86400000);
          labels = ['Hoje'];
      } else if (dateFilter === 'yesterday') {
          start = new Date(today.getTime() - 86400000);
          end = today;
          labels = ['Ontem'];
      } else if (dateFilter === '7days') {
          start = new Date(today.getTime() - (6 * 86400000));
          end = new Date(today.getTime() + 86400000);
          for (let i = 0; i < 7; i++) {
              const d = new Date(start.getTime() + (i * 86400000));
              labels.push(`${d.getDate()}/${d.getMonth()+1}`);
              counts.push(0);
          }
      } else if (dateFilter === 'custom') {
          if (!customStartDate || !customEndDate) return;
          start = new Date(customStartDate);
          end = new Date(new Date(customEndDate).getTime() + 86400000);
          
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const step = Math.ceil(diffDays / 10) || 1; 
          
          for (let i = 0; i < diffDays; i+=step) {
             const d = new Date(start.getTime() + (i * 86400000));
             labels.push(`${d.getDate()}/${d.getMonth()+1}`);
             counts.push(0);
          }
      }

      const filtered = data.users.filter(u => {
          const d = new Date(u.createdAt);
          return d >= start && d < end;
      });

      setFilteredUserCount(filtered.length);

      if (dateFilter === '7days' || dateFilter === 'custom') {
          filtered.forEach(u => {
              const d = new Date(u.createdAt);
              const dayDiff = Math.floor((d.getTime() - start.getTime()) / 86400000);
              const bucket = Math.min(Math.floor(dayDiff / (labels.length > 1 ? (Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 3600 * 24)) / 10) : 1)), labels.length -1);
              if (counts[bucket] !== undefined) counts[bucket]++;
          });
          setChartData(labels.map((l, i) => ({ label: l, value: counts[i] || 0 })));
      } else {
          setChartData([{ label: dateFilter === 'today' ? 'Hoje' : 'Ontem', value: filtered.length }]);
      }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExecuteDelete = async () => {
      if (!confirmDelete) return;
      const { id, type } = confirmDelete;
      if (type === 'module') await removeModule(id);
      else if (type === 'user') await removeUser(id);
      else if (type === 'announcement') await removeAnnouncement(id);
      else if (type === 'media') await removeMedia(id);
      setConfirmDelete(null);
      await loadDb();
      showToast('Item removido com sucesso');
  };

  const handleModuleSave = async () => {
    if (!moduleForm.title) return showToast('Título obrigatório', 'error');
    if (editingModuleId === 'new') {
        await addModule({ 
            ...moduleForm, 
            active: true,
            order: data!.modules.length + 1,
            category: moduleForm.category || 'historias'
        } as any);
    }
    else await updateModule({ ...moduleForm, id: editingModuleId! } as Module);
    setEditingModuleId(null);
    loadDb();
    showToast('Salvo com sucesso');
  };

  const handleAddMedia = async () => {
      if (!editingModuleId || editingModuleId === 'new') return;
      if (!mediaForm.title || !mediaForm.url) return showToast('Preencha título e URL', 'error');
      
      await addMedia({
          moduleId: editingModuleId,
          type: mediaForm.type || 'video',
          title: mediaForm.title,
          url: mediaForm.url,
          description: mediaForm.description
      });
      setMediaForm({ type: 'video', title: '', url: '', description: '' });
      await loadDb();
      showToast('Aula adicionada!');
  };

  const handleAddAnnouncement = async () => {
      if (!newAnnouncement.trim()) return;
      await addAnnouncement(newAnnouncement);
      setNewAnnouncement('');
      await loadDb();
      showToast('Aviso publicado!');
  };

  const handleToggleAnnouncement = async (id: string) => {
      await toggleAnnouncement(id);
      await loadDb();
  };

  const handleImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleImageToBase64(file);
      setModuleForm(prev => ({ ...prev, banner: base64 }));
      showToast('Capa carregada com sucesso!');
    }
  };

  const onLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && settingsForm) {
      const base64 = await handleImageToBase64(file);
      setSettingsForm({ ...settingsForm, logoUrl: base64 });
      showToast('Logo carregado com sucesso!');
    }
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          const content = e.target?.result as string;
          const success = await importData(content);
          if (success) {
              showToast('Backup restaurado!');
              setTimeout(() => window.location.reload(), 1000);
          } else {
              showToast('Arquivo inválido.', 'error');
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  if (!data) return null;

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: '📊', category: 'Marketing' },
    { id: 'users', label: 'Gestão de Alunos', icon: '👥', category: 'Marketing' },
    { id: 'modules', label: 'Módulos & Aulas', icon: '📚', category: 'Conteúdo' },
    { id: 'announcements', label: 'Avisos do Topo', icon: '📢', category: 'Conteúdo' },
    { id: 'design', label: 'Personalização', icon: '🎨', category: 'Ajustes' },
    { id: 'system', label: 'Infraestrutura', icon: '⚙️', category: 'Ajustes' },
  ];

  const themes = [
      { id: 'modern-glass', name: 'Modern Glass (Padrão)', bg: '#FFFBEB' },
      { id: 'playful-kids', name: 'Playful Kids', bg: '#FFFAFA' },
      { id: 'cinema-dark', name: 'Cinema Dark', bg: '#111827' },
      { id: 'minimal-list', name: 'Minimal List', bg: '#FFFFFF' },
      { id: 'gamer-grid', name: 'Gamer Grid', bg: '#0F172A' }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans selection:bg-emerald-100 overflow-hidden relative">
      
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        title="Confirmar Exclusão?" 
        message="Esta ação removerá permanentemente o item." 
        onConfirm={handleExecuteDelete} 
        onCancel={() => setConfirmDelete(null)} 
      />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <input type="file" ref={bannerInputRef} onChange={onBannerFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={onLogoFileChange} accept="image/*" className="hidden" />

      <aside className={`fixed md:relative z-[200] h-full w-72 bg-slate-900 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-hidden`}>
          <div className="p-8 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-900/40">K</div>
              <div>
                  <h2 className="text-white font-black text-lg tracking-tight">KidsEnglish</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Admin Hub</p>
              </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto hide-scrollbar">
              {['Marketing', 'Conteúdo', 'Ajustes'].map(cat => (
                  <div key={cat}>
                      <p className="px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">{cat}</p>
                      <div className="space-y-1">
                          {navItems.filter(item => item.category === cat).map(item => (
                              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                  <span className="text-lg">{item.icon}</span>
                                  {item.label}
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
          </nav>
          <div className="p-4 border-t border-slate-800 shrink-0">
              <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/admin-login'); }} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"><span>🚪</span> Sair</button>
          </div>
      </aside>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] md:hidden"></div>}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 shrink-0">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">☰</button>
                  <h3 className="hidden sm:block text-xl font-black text-slate-800 tracking-tight capitalize">{activeTab}</h3>
              </div>
              <button onClick={() => navigate('/dashboard?preview=true')} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20">Ver App Aluno</button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 hide-scrollbar">
              <div className="max-w-6xl mx-auto space-y-10">
                  {notification && (
                      <div className={`fixed top-24 right-6 md:right-10 z-[300] px-6 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-4 ${notification.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest">{notification.msg}</span>
                      </div>
                  )}

                  {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard label="Total Alunos" value={data.users.length} icon="👥" />
                            <StatCard label="Módulos" value={data.modules.length} icon="📚" />
                            <StatCard label="Aulas" value={data.media.length} icon="▶️" />
                            <StatCard label="Avisos" value={data.announcements.length} icon="📢" />
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Crescimento de Alunos</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-1">Acompanhe novos cadastros por período</p>
                                </div>
                                <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-xl">
                                    {[{ id: 'today', label: 'Hoje' },{ id: 'yesterday', label: 'Ontem' },{ id: '7days', label: '7 Dias' },{ id: 'custom', label: 'Personalizado' }].map(filter => (
                                        <button key={filter.id} onClick={() => setDateFilter(filter.id as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${dateFilter === filter.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{filter.label}</button>
                                    ))}
                                </div>
                            </div>
                            {dateFilter === 'custom' && (
                                <div className="flex gap-4 mb-6 animate-in slide-in-from-top-2">
                                    <div className="flex flex-col gap-1"><label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Início</label><input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none" /></div>
                                    <div className="flex flex-col gap-1"><label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fim</label><input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none" /></div>
                                </div>
                            )}
                            <div className="flex flex-col lg:flex-row gap-10 items-center">
                                <div className="w-full lg:w-1/3"><StatCard label="No Período" value={`+${filteredUserCount}`} icon="📈" subtext="Novos Cadastros"/></div>
                                <div className="w-full lg:w-2/3">
                                    {/* Using Premium Chart */}
                                    <PremiumChart data={chartData} />
                                </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {activeTab === 'modules' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {editingModuleId ? (
                            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-10 max-w-4xl mx-auto shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <button onClick={() => setEditingModuleId(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100">←</button>
                                    <h4 className="text-xl font-black text-slate-800 tracking-tight">Configurar Módulo</h4>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                                    <div className="space-y-6">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título</label><input value={moduleForm.title || ''} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none" /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição</label><textarea value={moduleForm.description || ''} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none h-32 resize-none" /></div>
                                        <div onClick={() => bannerInputRef.current?.click()} className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden group">
                                            {moduleForm.banner ? <img src={moduleForm.banner} className="w-full aspect-video rounded-xl object-cover mb-4" /> : <div className="py-8"><div className="text-3xl mb-3">🖼️</div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Alterar Capa</p></div>}
                                        </div>
                                        <div className="space-y-3 pt-4">
                                            <ToggleSwitch checked={moduleForm.active ?? true} onChange={v => setModuleForm({...moduleForm, active: v})} label="Módulo Ativo" />
                                            <ToggleSwitch checked={moduleForm.showInVertical ?? true} onChange={v => setModuleForm({...moduleForm, showInVertical: v})} label="Lista Vertical" />
                                            <ToggleSwitch checked={moduleForm.showInHorizontal ?? false} onChange={v => setModuleForm({...moduleForm, showInHorizontal: v})} label="Carrossel Horizontal" />
                                        </div>
                                    </div>
                                    {/* Módulo de Gestão de Aulas */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Adicionar Aula</h5>
                                            <div className="space-y-3">
                                                <select value={mediaForm.type} onChange={e => setMediaForm({...mediaForm, type: e.target.value as any})} className="w-full bg-white px-4 py-3 rounded-xl text-xs font-bold border-none outline-none"><option value="video">Vídeo (YouTube)</option><option value="image">Imagem</option><option value="link">Link Externo</option></select>
                                                <input placeholder="Título da Aula" value={mediaForm.title} onChange={e => setMediaForm({...mediaForm, title: e.target.value})} className="w-full bg-white px-4 py-3 rounded-xl text-xs font-bold border-none outline-none" />
                                                <input placeholder="URL do Conteúdo" value={mediaForm.url} onChange={e => setMediaForm({...mediaForm, url: e.target.value})} className="w-full bg-white px-4 py-3 rounded-xl text-xs font-bold border-none outline-none" />
                                                <textarea placeholder="Descrição curta (opcional)" value={mediaForm.description || ''} onChange={e => setMediaForm({...mediaForm, description: e.target.value})} className="w-full bg-white px-4 py-3 rounded-xl text-xs font-bold border-none outline-none resize-none h-20" />
                                                <button onClick={handleAddMedia} className="w-full bg-slate-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700">Adicionar Aula</button>
                                            </div>
                                        </div>
                                        {editingModuleId !== 'new' && (
                                            <div className="space-y-2">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-2">Aulas Existentes</h5>
                                                {data.media.filter(m => m.moduleId === editingModuleId).map((media, idx) => (
                                                    <div key={media.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">{idx+1}</span>
                                                            <div className="truncate"><p className="text-xs font-bold text-slate-700 truncate">{media.title}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{media.type}</p></div>
                                                        </div>
                                                        <button onClick={() => setConfirmDelete({ id: media.id, type: 'media' })} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg">🗑️</button>
                                                    </div>
                                                ))}
                                                {data.media.filter(m => m.moduleId === editingModuleId).length === 0 && <p className="text-center text-[10px] text-slate-400 py-4">Nenhuma aula cadastrada.</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={handleModuleSave} className="w-full mt-10 bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">Salvar Módulo</button>
                            </div>
                        ) : (
                            <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">Conteúdos</h4>
                                <button onClick={() => { setEditingModuleId('new'); setModuleForm({ showInVertical: true, active: true }); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold w-full sm:w-auto">+ Novo Módulo</button>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Módulo</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Status</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Aulas</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Ações</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.modules.map(module => (
                                            <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-6 flex items-center gap-4"><div className="w-10 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">{module.banner && <img src={module.banner} className="w-full h-full object-cover" />}</div><span className="text-sm font-bold text-slate-800 truncate">{module.title}</span></td>
                                                <td className="px-8 py-6"><Badge variant={module.active !== false ? 'success' : 'default'}>{module.active !== false ? 'Ativo' : 'Oculto'}</Badge></td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">{data.media.filter(m => m.moduleId === module.id).length} aulas</td>
                                                <td className="px-8 py-6 text-right"><div className="flex justify-end gap-2"><button onClick={() => { setEditingModuleId(module.id); setModuleForm(module); }} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs">✎</button><button onClick={() => setConfirmDelete({ id: module.id, type: 'module' })} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-rose-500">🗑️</button></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            </>
                        )}
                    </div>
                  )}

                  {activeTab === 'announcements' && (
                     <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                            <h5 className="text-[10px] font-black text-slate-400 mb-6 uppercase">Novo Aviso</h5>
                            <div className="flex gap-4">
                                <input 
                                    placeholder="Digite o texto do aviso (ex: Bem-vindos!)" 
                                    className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 text-xs font-bold outline-none text-slate-700" 
                                    value={newAnnouncement} 
                                    onChange={e => setNewAnnouncement(e.target.value)} 
                                />
                                <button onClick={handleAddAnnouncement} className="bg-slate-900 text-white px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">Publicar</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Avisos Ativos</h5>
                            {data.announcements.length === 0 && <p className="text-center text-xs text-slate-400 py-10">Nenhum aviso cadastrado.</p>}
                            {data.announcements.map(ann => (
                                <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className={`text-sm font-bold ${ann.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{ann.text}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Postado em {new Date(ann.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <ToggleSwitch checked={ann.active} onChange={() => handleToggleAnnouncement(ann.id)} label={ann.active ? 'Ativo' : 'Inativo'} />
                                        <button onClick={() => setConfirmDelete({ id: ann.id, type: 'announcement' })} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 text-rose-500 transition-colors">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'design' && settingsForm && (
                      <div className="space-y-10 animate-in fade-in duration-300">
                          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 space-y-10">
                              <div className="grid md:grid-cols-2 gap-10">
                                  <div className="space-y-6">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo e Identidade</label>
                                      <div onClick={() => logoInputRef.current?.click()} className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                                          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden">{settingsForm.logoUrl ? <img src={settingsForm.logoUrl} className="w-full h-full object-contain" /> : <span className="text-2xl grayscale opacity-30">🖼️</span>}</div>
                                          <div className="space-y-1"><button className="text-[10px] font-black uppercase text-emerald-500">Alterar Logo</button><p className="text-[8px] text-slate-400 font-bold uppercase">Click para trocar</p></div>
                                      </div>
                                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                          <div className="flex justify-between items-center mb-4"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tamanho da Logo: {settingsForm.logoWidth}px</label><input type="range" min="50" max="300" value={settingsForm.logoWidth} onChange={(e) => setSettingsForm({...settingsForm, logoWidth: parseInt(e.target.value)})} className="accent-emerald-500"/></div>
                                          <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-inner border border-slate-200" style={{ backgroundColor: settingsForm.backgroundColor || '#FFFFFF' }}>
                                              <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-center">{settingsForm.logoUrl ? (<img src={settingsForm.logoUrl} style={{ width: `${settingsForm.logoWidth}px` }} alt="Preview" />) : (<span className="font-logo text-2xl" style={{ color: settingsForm.primaryColor }}>Kids<span style={{ color: settingsForm.accentColor }}>English</span></span>)}</div>
                                              <div className="absolute bottom-2 right-2 text-[8px] font-black bg-black/10 text-black/50 px-2 py-1 rounded uppercase">Preview Área do Aluno</div>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="space-y-6">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Temas Premium & Layout</label>
                                      <div className="grid grid-cols-1 gap-4">
                                          {themes.map(theme => (
                                              <div key={theme.id} onClick={() => setSettingsForm({...settingsForm, moduleDesignTheme: theme.id as any})} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${settingsForm.moduleDesignTheme === theme.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                  <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-lg shadow-sm border border-black/5" style={{ background: theme.bg }}></div>
                                                      <span className="text-xs font-bold text-slate-700">{theme.name}</span>
                                                  </div>
                                                  {settingsForm.moduleDesignTheme === theme.id && <span className="text-emerald-500 text-lg">✓</span>}
                                              </div>
                                          ))}
                                      </div>
                                      <div className="bg-slate-900 p-6 rounded-2xl text-center">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visualizador do Tema</p>
                                          <div className="w-full h-32 rounded-xl overflow-hidden relative shadow-2xl transform scale-95 origin-center" style={{ background: themes.find(t => t.id === (settingsForm.moduleDesignTheme || 'modern-glass'))?.bg }}>
                                              <div className="absolute top-4 left-4 right-4 h-8 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse"></div>
                                              <div className="absolute top-16 left-4 w-1/2 h-12 bg-white/40 rounded-lg shadow-sm"></div>
                                              <div className="absolute top-16 right-4 w-1/3 h-12 bg-white/40 rounded-lg shadow-sm"></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="border-t border-slate-100 pt-10">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Personalização das Telas de Login</h5>
                                  <div className="grid md:grid-cols-2 gap-10">
                                      <div className="space-y-6 p-6 bg-slate-50 rounded-3xl">
                                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Login do Aluno</p>
                                          <input value={settingsForm.loginTitle} onChange={e => setSettingsForm({...settingsForm, loginTitle: e.target.value})} className="w-full bg-white px-5 py-4 rounded-xl font-bold border-none" placeholder="Título do Login" />
                                          <input value={settingsForm.loginSubtitle} onChange={e => setSettingsForm({...settingsForm, loginSubtitle: e.target.value})} className="w-full bg-white px-5 py-4 rounded-xl font-bold border-none" placeholder="Subtítulo do Login" />
                                          <ToggleSwitch checked={settingsForm.showAdminLink ?? true} onChange={v => setSettingsForm({...settingsForm, showAdminLink: v})} label="Mostrar link Admin no Login" />
                                      </div>
                                      <div className="space-y-6 p-6 bg-slate-900 rounded-3xl">
                                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Login do Administrador</p>
                                          <input value={settingsForm.adminLoginTitle} onChange={e => setSettingsForm({...settingsForm, adminLoginTitle: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-xl font-bold border-none" placeholder="Título Admin Login" />
                                          <input value={settingsForm.adminLoginSubtitle || ''} onChange={e => setSettingsForm({...settingsForm, adminLoginSubtitle: e.target.value})} className="w-full bg-white/5 text-white px-5 py-4 rounded-xl font-bold border-none" placeholder="Subtítulo Admin Login" />
                                      </div>
                                  </div>
                              </div>
                              <div className="pt-4 border-t border-slate-100"><button onClick={async () => { await updateSettings(settingsForm); loadDb(); showToast('Tudo Salvo!'); }} className="w-full sm:w-auto bg-emerald-500 text-white px-12 py-4 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 active:scale-95 transition-all">Aplicar Personalização</button></div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                            <h5 className="text-[10px] font-black text-slate-400 mb-6 uppercase">Cadastro Rápido</h5>
                            <div className="flex flex-col md:flex-row gap-4">
                                <input placeholder="WhatsApp (DDD)" className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 text-xs font-bold outline-none" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} />
                                <input placeholder="Nome" className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 text-xs font-bold outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                                <button onClick={async () => { await addUser({ phone: userForm.phone.replace(/\D/g, ''), name: userForm.name || 'Aluno', active: true }); setUserForm({ phone: '', name: '' }); loadDb(); showToast('Aluno cadastrado!'); }} className="bg-emerald-500 text-white px-10 py-4 rounded-xl text-xs font-bold">Cadastrar</button>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                            <table className="w-full text-left min-w-[400px]">
                                <thead className="bg-slate-50/50 border-b border-slate-100"><tr><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Aluno</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">WhatsApp</th><th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Ações</th></tr></thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.users.map(user => (
                                        <tr key={user.phone}><td className="px-8 py-6 text-sm font-bold text-slate-800">{user.name}</td><td className="px-8 py-6 text-xs font-bold text-slate-500 font-mono">{user.phone}</td><td className="px-8 py-6 text-right"><button onClick={() => setConfirmDelete({ id: user.phone, type: 'user' })} className="text-xs font-bold text-rose-500">Remover</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  )}

                  {activeTab === 'system' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                <div><h5 className="text-xs font-black text-slate-400 uppercase mb-2">Exportar Dados</h5><p className="text-[10px] text-slate-400 font-bold mb-8 leading-relaxed">Baixe uma cópia JSON de todos os seus módulos e alunos.</p></div>
                                <button onClick={async () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await exportData()], {type:'application/json'})); a.download=`kidsenglish_db.json`; a.click(); }} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs">Baixar Backup</button>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                <div><h5 className="text-xs font-black text-emerald-500 uppercase mb-2">Importar Dados</h5><p className="text-[10px] text-slate-400 font-bold mb-8 leading-relaxed">Restaure um backup anterior para a plataforma.</p></div>
                                <button onClick={handleImportClick} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-xs">Subir Backup</button>
                            </div>
                            <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                <div><h5 className="text-xs font-black text-rose-500 uppercase mb-2">Resetar</h5><p className="text-[10px] text-rose-400 font-bold mb-8 leading-relaxed">Apaga todos os seus dados e volta aos dados iniciais.</p></div>
                                <button onClick={async () => { if (prompt('CUIDADO: Isso apagará TUDO. Digite "RESETAR" para confirmar:') === 'RESETAR') { await resetDb(); window.location.reload(); } }} className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-xs">Resetar Tudo</button>
                            </div>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      </main>
    </div>
  );
};
