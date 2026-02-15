
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
  <div className="flex items-center justify-between p-1">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  </div>
);

const StatCard = ({ label, value, trend, icon }: { label: string, value: string | number, trend: string, icon: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
    <div className="flex items-center justify-between">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs">{icon}</span>
            {label}
        </span>
    </div>
    <div className="flex items-end justify-between mt-1">
        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
        <span className={`text-[10px] font-bold flex items-center gap-1 ${trend.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.includes('+') ? '↗' : '↘'} {trend}
        </span>
    </div>
  </div>
);

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

// --- Main Admin Panel ---

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'modules' | 'users' | 'design' | 'announcements' | 'system'>('dashboard');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: string } | null>(null);

  // States for Editing
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({});
  const [mediaForm, setMediaForm] = useState<Partial<Media>>({ type: 'video' });
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [settingsForm, setSettingsForm] = useState<AppSettings | null>(null);
  const [userForm, setUserForm] = useState({ phone: '', name: '' });
  const [newAnnouncement, setNewAnnouncement] = useState('');

  useEffect(() => { loadDb(); }, []);
  useEffect(() => { if (data?.settings) setSettingsForm(data.settings); }, [data]);

  const loadDb = async () => { setData(await getDb()); };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExecuteDelete = async () => {
      if (!confirmDelete) return;
      const { id, type } = confirmDelete;
      if (type === 'module') await removeModule(id);
      else if (type === 'user') await removeUser(id);
      else if (type === 'media') await removeMedia(id);
      else if (type === 'announcement') await removeAnnouncement(id);
      
      setConfirmDelete(null);
      await loadDb();
      showToast('Item removido com sucesso');
  };

  const handleModuleSave = async () => {
    if (!moduleForm.title) return showToast('Título obrigatório', 'error');
    if (editingModuleId === 'new') await addModule(moduleForm as any);
    else await updateModule({ ...moduleForm, id: editingModuleId! } as Module);
    setEditingModuleId(null);
    loadDb();
    showToast('Salvo com sucesso');
  };

  const handleAddAnnouncement = async () => {
      if (!newAnnouncement.trim()) return showToast('Digite um texto para o aviso', 'error');
      await addAnnouncement(newAnnouncement);
      setNewAnnouncement('');
      await loadDb();
      showToast('Aviso publicado!');
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          const content = e.target?.result as string;
          const success = await importData(content);
          if (success) {
              showToast('Backup restaurado com sucesso!');
              setTimeout(() => window.location.reload(), 1000);
          } else {
              showToast('Arquivo de backup inválido.', 'error');
          }
      };
      reader.readAsText(file);
      event.target.value = '';
  };

  if (!data) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans selection:bg-emerald-100 overflow-hidden">
      
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        title="Confirmar Exclusão?" 
        message="Esta ação é permanente e removerá todos os dados vinculados." 
        onConfirm={handleExecuteDelete} 
        onCancel={() => setConfirmDelete(null)} 
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />

      {/* --- SIDEBAR 1: ICON BAR --- */}
      <aside className="w-[72px] bg-slate-900 flex flex-col items-center py-8 gap-8 border-r border-slate-800 z-50">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-900/40 cursor-pointer" onClick={() => setActiveTab('dashboard')}>K</div>
          <nav className="flex flex-col gap-4">
              {[
                {id: 'dashboard', icon: '📊'},
                {id: 'modules', icon: '📚'},
                {id: 'users', icon: '👥'},
                {id: 'design', icon: '🎨'},
                {id: 'announcements', icon: '📢'},
                {id: 'system', icon: '⚙️'}
              ].map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === item.id ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-800'}`}>
                    <span className="text-xl">{item.icon}</span>
                </button>
              ))}
          </nav>
          <div className="mt-auto">
              <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/admin-login'); }} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition-colors">🚪</button>
          </div>
      </aside>

      {/* --- SIDEBAR 2: CONTEXT BAR --- */}
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col">
          <div className="p-6">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">KidsEnglish</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Management Hub</p>
          </div>
          <div className="flex-1 px-4 py-2 space-y-6">
              <div>
                  <p className="px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Marketing & Alunos</p>
                  <div className="space-y-1">
                      <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>📈 Visão Geral</button>
                      <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>👥 Gestão de Alunos</button>
                  </div>
              </div>
              <div>
                  <p className="px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Conteúdo</p>
                  <div className="space-y-1">
                      <button onClick={() => setActiveTab('modules')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'modules' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>📚 Módulos & Aulas</button>
                      <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'announcements' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>📢 Avisos do Topo</button>
                  </div>
              </div>
              <div>
                  <p className="px-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Customização</p>
                  <div className="space-y-1">
                      <button onClick={() => setActiveTab('design')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'design' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>🎨 Design do App</button>
                      <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'system' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>⚙️ Configurações</button>
                  </div>
              </div>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-lg shadow-sm border border-white">👤</div>
                  <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">Admin João</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Super User</p>
                  </div>
              </div>
          </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10">
              <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight capitalize">{activeTab}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Admin / {activeTab}</p>
              </div>
              <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/dashboard?preview=true')} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">Ver App Aluno</button>
              </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 hide-scrollbar">
              <div className="max-w-6xl mx-auto space-y-10">
                  {notification && (
                      <div className={`fixed top-24 right-10 z-[100] px-6 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-4 ${notification.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest">{notification.msg}</span>
                      </div>
                  )}

                  {/* DASHBOARD TAB */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard label="Alunos Ativos" value={data.users.length} trend="+2.5%" icon="👥" />
                            <StatCard label="Módulos" value={data.modules.length} trend="0.0%" icon="📚" />
                            <StatCard label="Aulas" value={data.media.length} trend="+12%" icon="▶️" />
                            <StatCard label="Avisos" value={data.announcements.length} icon="📢" trend="-" />
                        </div>
                    </div>
                  )}

                  {/* MODULES TAB */}
                  {activeTab === 'modules' && (
                    <div className="space-y-8">
                        {editingModuleId ? (
                            <div className="bg-white rounded-[2rem] border border-slate-100 p-10 max-w-4xl mx-auto shadow-sm">
                                <div className="flex items-center gap-4 mb-10">
                                    <button onClick={() => setEditingModuleId(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">←</button>
                                    <h4 className="text-xl font-black text-slate-800 tracking-tight">Configurar Módulo</h4>
                                </div>
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título da Aventura</label>
                                            <input value={moduleForm.title || ''} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição</label>
                                            <textarea value={moduleForm.description || ''} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none h-32 resize-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center">
                                            {moduleForm.banner ? <img src={moduleForm.banner} className="w-full aspect-video rounded-xl object-cover mb-4" /> : <div className="text-2xl mb-2 opacity-20">🖼️</div>}
                                            <div className="space-y-1">
                                                <button className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Alterar Capa</button>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                                    Vertical: 1200x514 | Horizontal: 800x600
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <ToggleSwitch checked={moduleForm.showInVertical ?? true} onChange={v => setModuleForm({...moduleForm, showInVertical: v})} label="Lista Vertical" />
                                            <ToggleSwitch checked={moduleForm.showInHorizontal ?? false} onChange={v => setModuleForm({...moduleForm, showInHorizontal: v})} label="Carrossel Horizontal" />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleModuleSave} className="w-full mt-10 bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20 transition-all">Salvar Módulo</button>
                            </div>
                        ) : (
                            <>
                            <div className="flex justify-between items-end">
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">Conteúdos</h4>
                                <button onClick={() => { setEditingModuleId('new'); setModuleForm({ showInVertical: true }); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02]">+ Novo Módulo</button>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Módulo</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aulas</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.modules.map(module => (
                                            <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-6 flex items-center gap-4">
                                                    <div className="w-10 h-8 rounded bg-slate-100 overflow-hidden">
                                                        {module.banner && <img src={module.banner} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{module.title}</span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-slate-500">{data.media.filter(m => m.moduleId === module.id).length} aulas</td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => { setEditingModuleId(module.id); setModuleForm(module); }} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs">✎</button>
                                                        <button onClick={() => setConfirmDelete({ id: module.id, type: 'module' })} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs text-rose-500">🗑️</button>
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

                  {/* USERS TAB */}
                  {activeTab === 'users' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                            <h5 className="text-[10px] font-black uppercase text-slate-400 mb-6">Cadastro Rápido</h5>
                            <div className="flex flex-col md:flex-row gap-4">
                                <input placeholder="WhatsApp (DDD)" className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 text-xs font-bold outline-none" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} />
                                <input placeholder="Nome" className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 text-xs font-bold outline-none" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                                <button onClick={async () => { await addUser({ phone: userForm.phone.replace(/\D/g, ''), name: userForm.name || 'Aluno', active: true }); setUserForm({ phone: '', name: '' }); loadDb(); showToast('Aluno cadastrado!'); }} className="bg-emerald-500 text-white px-10 py-4 rounded-xl text-xs font-bold">Cadastrar</button>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Aluno</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">WhatsApp</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.users.map(user => (
                                        <tr key={user.phone}>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-800">{user.name}</td>
                                            <td className="px-8 py-6 text-xs font-bold text-slate-500 font-mono">{user.phone}</td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => setConfirmDelete({ id: user.phone, type: 'user' })} className="text-xs font-bold text-rose-500 hover:underline">Remover</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  )}

                  {/* SYSTEM TAB */}
                  {activeTab === 'system' && (
                    <div className="space-y-8">
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">Infraestrutura & Segurança</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-4 flex flex-col justify-between">
                                <div>
                                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Download Backup</h5>
                                    <p className="text-[10px] text-slate-400 font-bold mb-6">Baixe seus dados para segurança extra ou migração.</p>
                                </div>
                                <button onClick={async () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([await exportData()], {type:'application/json'})); a.download=`kidsenglish_backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); }} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-900/10">Baixar Agora</button>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-4 flex flex-col justify-between">
                                <div>
                                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Upload Backup</h5>
                                    <p className="text-[10px] text-slate-400 font-bold mb-6">Suba um arquivo de backup para restaurar dados.</p>
                                </div>
                                <button onClick={handleImportClick} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/10">Subir Backup</button>
                            </div>

                            <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 space-y-4 flex flex-col justify-between">
                                <div>
                                    <h5 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-2">Reset da Fábrica</h5>
                                    <p className="text-[10px] text-rose-400 font-bold mb-6">CUIDADO: Apaga tudo e volta aos dados iniciais.</p>
                                </div>
                                <button onClick={async () => { if (prompt('Isso apagará TUDO. Digite "RESETAR" para confirmar:') === 'RESETAR') { await resetDb(); window.location.reload(); } }} className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-xs">Resetar Tudo</button>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* ANNOUNCEMENTS & DESIGN TABS (Resumidas para brevidade) */}
                  {activeTab === 'announcements' && (
                      <div className="space-y-4">
                          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4">
                              <input placeholder="Novo Aviso..." className="flex-1 bg-slate-50 px-5 py-4 rounded-xl text-xs font-bold outline-none" value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} />
                              <button onClick={handleAddAnnouncement} className="bg-emerald-500 text-white px-8 py-4 rounded-xl text-xs font-bold">Postar</button>
                          </div>
                          {data.announcements.map(ann => (
                              <div key={ann.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                  <p className="text-sm font-bold text-slate-800">{ann.text}</p>
                                  <div className="flex items-center gap-4">
                                      <ToggleSwitch checked={ann.active} onChange={() => { toggleAnnouncement(ann.id); loadDb(); }} label={ann.active ? "Ativo" : "Off"} />
                                      <button onClick={() => setConfirmDelete({id: ann.id, type: 'announcement'})} className="text-rose-500">🗑️</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  {activeTab === 'design' && settingsForm && (
                      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 space-y-8">
                          <div className="grid md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase">Nome do App</label>
                                  <input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full bg-slate-50 px-5 py-4 rounded-xl font-bold" />
                              </div>
                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase">Rodapé da Área do Membro</label>
                                  <input value={settingsForm.footerText} onChange={e => setSettingsForm({...settingsForm, footerText: e.target.value})} className="w-full bg-slate-50 px-5 py-4 rounded-xl font-bold" />
                              </div>
                          </div>
                          <button onClick={async () => { await updateSettings(settingsForm); loadDb(); showToast('Estilo Salvo!'); }} className="bg-emerald-500 text-white px-10 py-4 rounded-xl text-xs font-bold">Salvar Estética</button>
                      </div>
                  )}
              </div>
          </div>
      </main>
    </div>
  );
};
