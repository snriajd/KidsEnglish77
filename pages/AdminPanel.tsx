
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
        warning: 'bg-amber-50 text-amber-600 border-amber-100',
        default: 'bg-slate-50 text-slate-500 border-slate-100'
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${styles[variant]}`}>
            {children}
        </span>
    );
};

const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 cursor-pointer group transition-all" onClick={() => onChange(!checked)}>
    <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
    <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 shadow-inner shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${checked ? 'translate-x-4' : ''}`} />
    </div>
  </div>
);

const StatCard = ({ label, value, icon, subtext, color = 'indigo' }: { label: string, value: string | number, icon: any, subtext?: string, color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' }) => {
  const colors = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', iconBg: 'bg-indigo-50' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-50' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-50' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-50' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-50' }
  };
  const c = colors[color];

  return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
            <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">{label}</span>
                <h4 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h4>
            </div>
            <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.text} flex items-center justify-center text-lg`}>
                {icon}
            </div>
        </div>
        {subtext && (
            <div className="flex items-center gap-2">
                 <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`}></span>
                 <span className="text-[10px] font-medium text-slate-400">{subtext}</span>
            </div>
        )}
      </div>
  );
};

// --- CHART COMPONENT ---
const PremiumChart = ({ data }: { data: { label: string, value: number }[] }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data.map(d => d.value), 1) * 1.2; 
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const y = 100 - (d.value / maxValue) * 100;
        return `${x},${y}`;
    });
    const linePath = `M ${points.map(p => p.replace(',', ' ')).join(' L ')}`;
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    return (
        <div className="w-full h-64 relative select-none mt-4 font-sans">
            {hoveredIndex !== null && data[hoveredIndex] && (
                <div 
                    className="absolute z-10 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xl -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-150 transform scale-105"
                    style={{ 
                        left: `${(hoveredIndex / (data.length - 1 || 1)) * 100}%`, 
                        top: `${100 - (data[hoveredIndex].value / maxValue) * 100}%`,
                        marginTop: '-16px'
                    }}
                >
                    {data[hoveredIndex].value} Alunos
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
            )}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="0" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="0" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="0" />
                <path d={areaPath} fill="url(#chartGradient)" />
                <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = 100 - (d.value / maxValue) * 100;
                    return (
                        <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                            <circle cx={x} cy={y} r="8" fill="transparent" className="cursor-pointer" /> 
                            <circle cx={x} cy={y} r={hoveredIndex === i ? 4 : 0} fill="white" stroke="#6366f1" strokeWidth="2" className="transition-all duration-200 pointer-events-none shadow-sm" />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between mt-4 px-1 border-t border-slate-50 pt-3">
                {data.map((d, i) => (
                    <span key={i} className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${hoveredIndex === i ? 'text-indigo-600' : 'text-slate-400'}`}>{d.label}</span>
                ))}
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors uppercase tracking-wider">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition-all uppercase tracking-wider">Confirmar</button>
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

  const compressImage = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 1024; 
                  const scaleSize = MAX_WIDTH / img.width;
                  const newWidth = (scaleSize < 1) ? MAX_WIDTH : img.width;
                  const newHeight = (scaleSize < 1) ? img.height * scaleSize : img.height;
                  canvas.width = newWidth;
                  canvas.height = newHeight;
                  const ctx = canvas.getContext('2d');
                  ctx?.clearRect(0, 0, newWidth, newHeight);
                  ctx?.drawImage(img, 0, 0, newWidth, newHeight);
                  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                  resolve(canvas.toDataURL(outputType, 0.8));
              };
              img.onerror = (error) => reject(error);
          };
          reader.onerror = (error) => reject(error);
      });
  };

  const handleModuleSave = async () => {
    if (!moduleForm.title) return showToast('Título obrigatório', 'error');
    try {
        if (editingModuleId === 'new') {
            await addModule({ 
                ...moduleForm, 
                active: true,
                order: data!.modules.length + 1,
                category: 'geral', // Categoria padrão (não usada na UI)
                // Default to vertical if undefined for new modules
                showInVertical: moduleForm.showInVertical !== false,
                showInHorizontal: moduleForm.showInHorizontal || false
            } as any);
        }
        else await updateModule({ ...moduleForm, category: 'geral', id: editingModuleId! } as Module);
        setEditingModuleId(null);
        await loadDb();
        showToast('Salvo com sucesso');
    } catch (e) {
        console.error(e);
        showToast('Erro ao salvar. A imagem pode ser muito grande.', 'error');
    }
  };

  const handleAddMedia = async () => {
      if (!editingModuleId || editingModuleId === 'new') return;
      if (!mediaForm.title || !mediaForm.url) return showToast('Preencha título e URL', 'error');
      
      try {
          await addMedia({
              moduleId: editingModuleId,
              type: mediaForm.type || 'video',
              title: mediaForm.title,
              url: mediaForm.url,
              description: mediaForm.description
          });
          setMediaForm({ type: 'video', title: '', url: '', description: '' });
          await loadDb();
          showToast('Conteúdo adicionado!');
      } catch (e) {
          showToast('Erro ao salvar aula.', 'error');
      }
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

  const onBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const base64 = await compressImage(file);
          setModuleForm(prev => ({ ...prev, banner: base64 }));
          showToast('Capa processada e carregada!');
      } catch (e) {
          showToast('Erro ao processar imagem', 'error');
      }
    }
  };

  const onLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && settingsForm) {
      try {
          const base64 = await compressImage(file);
          setSettingsForm({ ...settingsForm, logoUrl: base64 });
          showToast('Logo processado e carregado!');
      } catch (e) {
          showToast('Erro ao processar logo', 'error');
      }
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
    { id: 'dashboard', label: 'Dashboard', icon: '📊', category: 'Visão Geral' },
    { id: 'users', label: 'Alunos', icon: '👥', category: 'Visão Geral' },
    { id: 'modules', label: 'Módulos', icon: '📚', category: 'Gestão' },
    { id: 'announcements', label: 'Avisos', icon: '📢', category: 'Gestão' },
    { id: 'design', label: 'Aparência', icon: '🎨', category: 'Configuração' },
    { id: 'system', label: 'Sistema', icon: '⚙️', category: 'Configuração' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 overflow-hidden relative">
      
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        title="Tem certeza?" 
        message="Esta ação é permanente e não poderá ser desfeita." 
        onConfirm={handleExecuteDelete} 
        onCancel={() => setConfirmDelete(null)} 
      />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <input type="file" ref={bannerInputRef} onChange={onBannerFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={onLogoFileChange} accept="image/*" className="hidden" />

      {/* --- SIDEBAR --- */}
      <aside className={`fixed md:relative z-[200] h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-xl md:shadow-none`}>
          <div className="p-8 flex items-center gap-3 shrink-0 border-b border-slate-50">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-100">K</div>
              <div>
                  <h2 className="text-slate-900 font-bold text-base leading-tight">KidsEnglish</h2>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Admin Pro</p>
              </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto hide-scrollbar">
              {['Visão Geral', 'Gestão', 'Configuração'].map(cat => (
                  <div key={cat}>
                      <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 opacity-80">{cat}</p>
                      <div className="space-y-1">
                          {navItems.filter(item => item.category === cat).map(item => (
                              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                  <span className="text-lg">{item.icon}</span>
                                  {item.label}
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
          </nav>
          <div className="p-4 border-t border-slate-100 shrink-0">
              <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/admin-login'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <span>🚪</span> 
                  Sair
              </button>
          </div>
      </aside>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[150] md:hidden"></div>}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F8FAFC]">
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 md:px-10 shrink-0 z-10 sticky top-0">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">☰</button>
                  <h3 className="hidden sm:block text-xl font-bold text-slate-800 tracking-tight">{navItems.find(i => i.id === activeTab)?.label}</h3>
              </div>
              <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end mr-2">
                      <span className="text-xs font-bold text-slate-700">Administrador</span>
                  </div>
                  <button onClick={() => navigate('/dashboard?preview=true')} className="bg-white border border-slate-200 text-slate-700 hover:border-indigo-200 hover:text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2">
                      <span>👁️</span> <span className="hidden sm:inline">Visualizar App</span>
                  </button>
              </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 hide-scrollbar">
              <div className="max-w-6xl mx-auto space-y-8 pb-10">
                  {notification && (
                      <div className={`fixed bottom-6 right-6 z-[300] px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-bottom-4 flex items-center gap-4 ${notification.type === 'error' ? 'bg-white border-rose-100 text-rose-600' : 'bg-slate-900 border-slate-800 text-white'}`}>
                           <span className="text-xl">{notification.type === 'error' ? '⚠️' : '✨'}</span>
                          <span className="text-xs font-bold uppercase tracking-wide">{notification.msg}</span>
                      </div>
                  )}

                  {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Total Alunos" value={data.users.length} icon="👥" subtext="Ativos" color="indigo" />
                            <StatCard label="Módulos" value={data.modules.length} icon="📚" subtext="Publicados" color="emerald" />
                            <StatCard label="Aulas" value={data.media.length} icon="▶️" subtext="Conteúdo" color="blue" />
                            <StatCard label="Avisos" value={data.announcements.length} icon="📢" subtext="Postados" color="amber" />
                        </div>
                        
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 tracking-tight">Novos Alunos</h4>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Acompanhamento de registros</p>
                                    </div>
                                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                        {[{ id: '7days', label: '7 Dias' },{ id: 'today', label: 'Hoje' },{ id: 'custom', label: 'Data' }].map(filter => (
                                            <button key={filter.id} onClick={() => setDateFilter(filter.id as any)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${dateFilter === filter.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{filter.label}</button>
                                        ))}
                                    </div>
                                </div>
                                
                                {dateFilter === 'custom' && (
                                    <div className="flex gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                                        <div className="flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Início</label><input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500" /></div>
                                        <div className="flex flex-col gap-1"><label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Fim</label><input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500" /></div>
                                    </div>
                                )}
                                
                                <PremiumChart data={chartData} />
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl font-black transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform">📈</div>
                                    <div className="relative z-10">
                                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-2">Novos neste período</p>
                                        <p className="text-5xl font-bold tracking-tighter mb-6">+{filteredUserCount}</p>
                                        <div className="inline-flex items-center gap-2 bg-indigo-500/30 px-3 py-1.5 rounded-lg border border-indigo-400/30">
                                            <span className="text-xs">🚀</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Crescimento</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex-1 flex flex-col justify-center">
                                    <h5 className="text-sm font-bold text-slate-800 mb-4">Ações Rápidas</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => { setEditingModuleId('new'); setModuleForm({ showInVertical: true, active: true }); setActiveTab('modules'); }} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-transparent hover:border-slate-200">
                                            <span className="text-xl block mb-2 group-hover:scale-110 transition-transform origin-left">✨</span>
                                            <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-slate-800">Add Módulo</span>
                                        </button>
                                        <button onClick={() => setActiveTab('users')} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left group border border-transparent hover:border-slate-200">
                                            <span className="text-xl block mb-2 group-hover:scale-110 transition-transform origin-left">👤</span>
                                            <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-slate-800">Add Aluno</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {activeTab === 'modules' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {editingModuleId ? (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                                <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingModuleId(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">←</button>
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{editingModuleId === 'new' ? 'Novo Módulo' : 'Editando Módulo'}</h4>
                                    </div>
                                    <button onClick={handleModuleSave} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Salvar Alterações</button>
                                </div>
                                <div className="p-8 grid lg:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        {/* Coluna 1: Informações Básicas */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Módulo</label>
                                                <input 
                                                    value={moduleForm.title || ''} 
                                                    onChange={e => setModuleForm({...moduleForm, title: e.target.value})} 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                                                    placeholder="Ex: Unit 1 - Introdução"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição Curta</label>
                                                <textarea 
                                                    value={moduleForm.description || ''} 
                                                    onChange={e => setModuleForm({...moduleForm, description: e.target.value})} 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-semibold text-slate-700 outline-none h-32 resize-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                                                    placeholder="O que os alunos vão aprender?"
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capa do Módulo</label>
                                                <div onClick={() => bannerInputRef.current?.click()} className="group relative w-full h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 cursor-pointer overflow-hidden transition-all flex items-center justify-center hover:bg-indigo-50/10">
                                                    {moduleForm.banner ? (
                                                        <>
                                                        <img src={moduleForm.banner} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"><span className="text-white opacity-0 group-hover:opacity-100 font-bold text-xs uppercase tracking-widest border border-white px-4 py-2 rounded-full backdrop-blur-sm">Trocar Imagem</span></div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center">
                                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-xl">🖼️</div>
                                                            <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-indigo-500 transition-colors">Arraste ou Clique</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                                <div className="flex items-center justify-between pb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração de Exibição</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <ToggleSwitch checked={moduleForm.active ?? true} onChange={v => setModuleForm({...moduleForm, active: v})} label="Módulo Ativo" />
                                                    <ToggleSwitch checked={moduleForm.showInVertical !== false} onChange={v => setModuleForm({...moduleForm, showInVertical: v})} label="Exibir na Lista Vertical" />
                                                    <ToggleSwitch checked={moduleForm.showInHorizontal ?? false} onChange={v => setModuleForm({...moduleForm, showInHorizontal: v})} label="Exibir no Destaque Horizontal" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {/* Coluna 2: Conteúdo (Aulas) */}
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">Adicionar Aula</h5>
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <select value={mediaForm.type} onChange={e => setMediaForm({...mediaForm, type: e.target.value as any})} className="bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold outline-none w-1/3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"><option value="video">Vídeo</option><option value="image">Imagem</option><option value="link">Link</option></select>
                                                    <input placeholder="Título da Aula" value={mediaForm.title} onChange={e => setMediaForm({...mediaForm, title: e.target.value})} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none flex-1 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                                                </div>
                                                <input placeholder="URL do conteúdo (YouTube, Imagem, Link)" value={mediaForm.url} onChange={e => setMediaForm({...mediaForm, url: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" />
                                                <button onClick={handleAddMedia} className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Adicionar Conteúdo</button>
                                            </div>
                                        </div>
                                        
                                        {editingModuleId !== 'new' && (
                                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                                 <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                                                     <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Conteúdo ({data.media.filter(m => m.moduleId === editingModuleId).length})</span>
                                                 </div>
                                                 <div className="max-h-[400px] overflow-y-auto p-2">
                                                    {data.media.filter(m => m.moduleId === editingModuleId).length === 0 ? (
                                                        <div className="p-8 text-center text-xs text-slate-400">Nenhuma aula adicionada.</div>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {data.media.filter(m => m.moduleId === editingModuleId).map((media, idx) => (
                                                                <li key={media.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <span className="w-6 h-6 rounded-md bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-500">{idx+1}</span>
                                                                        <div className="truncate">
                                                                            <p className="text-xs font-bold text-slate-700 truncate">{media.title}</p>
                                                                            <p className="text-[9px] text-slate-400 uppercase">{media.type}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={() => setConfirmDelete({ id: media.id, type: 'media' })} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">×</button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                 </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 tracking-tight">Gerenciar Módulos</h4>
                                    <p className="text-xs text-slate-400 font-medium mt-1">Organize o conteúdo do aplicativo.</p>
                                </div>
                                <button onClick={() => { setEditingModuleId('new'); setModuleForm({ showInVertical: true, active: true }); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    <span>+</span> Novo Módulo
                                </button>
                            </div>
                            
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest w-16">#</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest">Módulo</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest">Exibição</th>
                                            <th className="px-6 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest text-right">Opções</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.modules.length === 0 && <tr><td colSpan={5} className="px-8 py-16 text-center text-xs text-slate-400 font-bold">Nenhum módulo criado.</td></tr>}
                                        {data.modules.map((module, i) => (
                                            <tr key={module.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 text-xs font-bold text-slate-300">{i+1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">{module.banner && <img src={module.banner} className="w-full h-full object-cover" />}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{module.title}</p>
                                                            <p className="text-[9px] text-slate-400 uppercase tracking-wide">{data.media.filter(m => m.moduleId === module.id).length} aulas</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><Badge variant={module.active !== false ? 'success' : 'default'}>{module.active !== false ? 'Ativo' : 'Oculto'}</Badge></td>
                                                <td className="px-6 py-4">
                                                     <div className="flex gap-2">
                                                         {module.showInVertical !== false && <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">Lista</span>}
                                                         {module.showInHorizontal && <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 uppercase">Destaque</span>}
                                                     </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingModuleId(module.id); setModuleForm(module); }} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase hover:bg-indigo-100 transition-colors">Editar</button>
                                                        <button onClick={() => setConfirmDelete({ id: module.id, type: 'module' })} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold uppercase hover:bg-rose-100 transition-colors">Excluir</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            </>
                        )}
                    </div>
                  )}

                  {/* Users and Announcements Tabs omitted for brevity as they haven't changed */}
                  {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm h-fit sticky top-6">
                                <h5 className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Novo Aluno</h5>
                                <div className="space-y-5">
                                    <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">Nome</label><input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all focus:bg-white" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="Nome completo" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">WhatsApp</label><input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all focus:bg-white" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} placeholder="Apenas números" /></div>
                                    <button onClick={async () => { await addUser({ phone: userForm.phone.replace(/\D/g, ''), name: userForm.name || 'Aluno', active: true }); setUserForm({ phone: '', name: '' }); loadDb(); showToast('Aluno cadastrado!'); }} className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all mt-2">Salvar</button>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Alunos ({data.users.length})</h5>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[600px]">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50/50 sticky top-0 z-10"><tr><th className="px-8 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest">Aluno</th><th className="px-8 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest">Login</th><th className="px-8 py-4 text-[9px] font-bold uppercase text-slate-400 tracking-widest text-right">Ação</th></tr></thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {data.users.map(user => (
                                                <tr key={user.phone} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-4"><div className="flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black shadow-sm">{user.name?.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{user.name}</span></div></td>
                                                    <td className="px-8 py-4 text-xs font-mono font-bold text-slate-500">{user.phone}</td>
                                                    <td className="px-8 py-4 text-right"><button onClick={() => setConfirmDelete({ id: user.phone, type: 'user' })} className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-colors uppercase tracking-wider">Remover</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}
                  
                  {activeTab === 'announcements' && (
                     <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
                        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                            <h5 className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Novo Comunicado</h5>
                            <div className="flex gap-4">
                                <input 
                                    placeholder="Escreva o aviso aqui..." 
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-xs font-bold outline-none text-slate-700 focus:border-indigo-500 transition-all focus:bg-white" 
                                    value={newAnnouncement} 
                                    onChange={e => setNewAnnouncement(e.target.value)} 
                                />
                                <button onClick={handleAddAnnouncement} className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Publicar</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {data.announcements.length === 0 && <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">Nenhum aviso no histórico.</div>}
                            {data.announcements.map(ann => (
                                <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                    <div className="flex gap-5 items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${ann.active ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>📢</div>
                                        <div>
                                            <p className={`text-sm font-bold ${ann.active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{ann.text}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Postado em {new Date(ann.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <ToggleSwitch checked={ann.active} onChange={() => handleToggleAnnouncement(ann.id)} label={ann.active ? 'Ativo' : 'Inativo'} />
                                        <button onClick={() => setConfirmDelete({ id: ann.id, type: 'announcement' })} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'design' && settingsForm && (
                      <div className="space-y-8 animate-in fade-in duration-500">
                          <div className="bg-white rounded-2xl border border-slate-100 p-10 shadow-sm">
                              <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-8 pb-6 border-b border-slate-50">Identidade Visual</h4>
                              
                              <div className="grid md:grid-cols-2 gap-16">
                                  <div className="space-y-8">
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Logotipo Principal</label>
                                          <div onClick={() => logoInputRef.current?.click()} className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-white transition-all group">
                                              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                  {settingsForm.logoUrl ? <img src={settingsForm.logoUrl} className="w-full h-full object-contain p-3" /> : <span className="text-3xl grayscale opacity-30">🖼️</span>}
                                              </div>
                                              <div>
                                                  <button className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">Selecionar Arquivo</button>
                                                  <p className="text-[9px] text-slate-400 font-medium">PNG sem fundo</p>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div>
                                          <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tamanho da Logo ({settingsForm.logoWidth}px)</label></div>
                                          <input type="range" min="50" max="300" value={settingsForm.logoWidth} onChange={(e) => setSettingsForm({...settingsForm, logoWidth: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                                      </div>
                                  </div>

                                  <div className="space-y-8">
                                       <div>
                                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Texto da Seção Horizontal</label>
                                           <input 
                                                value={settingsForm.horizontalSectionTitle || ''} 
                                                onChange={e => setSettingsForm({...settingsForm, horizontalSectionTitle: e.target.value})} 
                                                placeholder="Ex: Destaques, Novidades"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500 transition-all focus:bg-white"
                                            />
                                       </div>

                                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tema do App</label>
                                       <div className="grid grid-cols-1 gap-4">
                                          {[
                                              { id: 'modern-glass', name: 'Modern Glass (Light)', bg: '#FFFBEB' },
                                              { id: 'playful-kids', name: 'Playful Kids (Colorido)', bg: '#FFFAFA' },
                                              { id: 'cinema-dark', name: 'Cinema Dark (Escuro)', bg: '#111827' },
                                          ].map(theme => (
                                              <div key={theme.id} onClick={() => setSettingsForm({...settingsForm, moduleDesignTheme: theme.id as any})} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${settingsForm.moduleDesignTheme === theme.id ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                                                  <div className="flex items-center gap-4">
                                                      <div className="w-8 h-8 rounded-lg border border-black/5 shadow-sm" style={{ background: theme.bg }}></div>
                                                      <span className="text-sm font-bold text-slate-700">{theme.name}</span>
                                                  </div>
                                                  {settingsForm.moduleDesignTheme === theme.id && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
                                              </div>
                                          ))}
                                       </div>
                                  </div>
                              </div>
                          </div>

                          <div className="flex justify-end pt-4">
                              <button onClick={async () => { await updateSettings(settingsForm); loadDb(); showToast('Configurações salvas!'); }} className="bg-slate-900 text-white px-12 py-4 rounded-xl text-xs font-bold shadow-xl shadow-slate-200 hover:-translate-y-1 transition-all uppercase tracking-widest">Salvar Tudo</button>
                          </div>
                      </div>
                  )}

                  {activeTab === 'system' && (
                    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
                        <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8 border-b border-slate-50 pb-6">Manutenção & Dados</h4>
                            <div className="grid md:grid-cols-3 gap-8">
                                <button onClick={async () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await exportData()], {type:'application/json'})); a.download=`kidsenglish_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); }} className="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all group">
                                    <span className="text-3xl mb-3 group-hover:-translate-y-1 transition-transform">📥</span>
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">Backup</span>
                                </button>
                                <button onClick={handleImportClick} className="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl transition-all group">
                                    <span className="text-3xl mb-3 group-hover:-translate-y-1 transition-transform">📤</span>
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">Restaurar</span>
                                </button>
                                <button onClick={async () => { if (prompt('Digite "DELETAR" para apagar todos os dados:') === 'DELETAR') { await resetDb(); window.location.reload(); } }} className="flex flex-col items-center justify-center p-8 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 rounded-2xl transition-all group">
                                    <span className="text-3xl mb-3 group-hover:-translate-y-1 transition-transform">🔥</span>
                                    <span className="text-xs font-bold text-rose-600 group-hover:text-rose-800">Resetar</span>
                                </button>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-mono text-slate-300">KidsEnglish System v2.3 • Secure Admin Environment</p>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      </main>
    </div>
  );
};
