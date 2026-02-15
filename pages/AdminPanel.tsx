
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

const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
    <div className="flex items-center justify-between">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-xs">{icon}</span>
            {label}
        </span>
    </div>
    <div className="flex items-end justify-between mt-1">
        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
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

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({});
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

      <aside className={`fixed md:relative z-[200] h-full w-72 bg-slate-900 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-8 flex items-center gap-3">
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
          <div className="p-4 border-t border-slate-800">
              <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/admin-login'); }} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"><span>🚪</span> Sair</button>
          </div>
      </aside>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] md:hidden"></div>}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10">
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
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard label="Alunos" value={data.users.length} icon="👥" />
                            <StatCard label="Módulos" value={data.modules.length} icon="📚" />
                            <StatCard label="Aulas" value={data.media.length} icon="▶️" />
                            <StatCard label="Avisos" value={data.announcements.length} icon="📢" />
                        </div>
                    </div>
                  )}

                  {activeTab === 'modules' && (
                    <div className="space-y-8">
                        {editingModuleId ? (
                            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 md:p-10 max-w-4xl mx-auto shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <button onClick={() => setEditingModuleId(null)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100">←</button>
                                    <h4 className="text-xl font-black text-slate-800 tracking-tight">Configurar Módulo</h4>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título</label>
                                            <input value={moduleForm.title || ''} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição</label>
                                            <textarea value={moduleForm.description || ''} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-bold text-slate-700 outline-none h-32 resize-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div 
                                          onClick={() => bannerInputRef.current?.click()}
                                          className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden group"
                                        >
                                            {moduleForm.banner ? (
                                              <>
                                                <img src={moduleForm.banner} className="w-full aspect-video rounded-xl object-cover mb-4" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest transition-opacity">Trocar Capa</div>
                                              </>
                                            ) : (
                                              <div className="py-8">
                                                <div className="text-3xl mb-3">🖼️</div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Alterar Capa</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Formatos: JPG, PNG, WEBP</p>
                                              </div>
                                            )}
                                        </div>
                                        <div className="space-y-3 pt-4">
                                            <ToggleSwitch checked={moduleForm.showInVertical ?? true} onChange={v => setModuleForm({...moduleForm, showInVertical: v})} label="Lista Vertical" />
                                            <ToggleSwitch checked={moduleForm.showInHorizontal ?? false} onChange={v => setModuleForm({...moduleForm, showInHorizontal: v})} label="Carrossel Horizontal" />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleModuleSave} className="w-full mt-10 bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">Salvar Alterações</button>
                            </div>
                        ) : (
                            <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">Conteúdos</h4>
                                <button onClick={() => { setEditingModuleId('new'); setModuleForm({ showInVertical: true }); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold w-full sm:w-auto">+ Novo Módulo</button>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Módulo</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Aulas</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.modules.map(module => (
                                            <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-6 flex items-center gap-4">
                                                    <div className="w-10 h-8 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                                                        {module.banner && <img src={module.banner} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 truncate">{module.title}</span>
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

                  {activeTab === 'design' && settingsForm && (
                      <div className="space-y-10 animate-in fade-in duration-300">
                          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 space-y-10">
                              <div className="grid md:grid-cols-2 gap-10">
                                  <div className="space-y-6">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo e Identidade</label>
                                      <div 
                                        onClick={() => logoInputRef.current?.click()}
                                        className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                                      >
                                          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden">
                                              {settingsForm.logoUrl ? <img src={settingsForm.logoUrl} className="w-full h-full object-contain" /> : <span className="text-2xl grayscale opacity-30">🖼️</span>}
                                          </div>
                                          <div className="space-y-1">
                                              <button className="text-[10px] font-black uppercase text-emerald-500">Alterar Logo</button>
                                              <p className="text-[8px] text-slate-400 font-bold uppercase">Click para trocar</p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="space-y-6">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Configurações Gerais</label>
                                      <input value={settingsForm.appName} onChange={e => setSettingsForm({...settingsForm, appName: e.target.value})} className="w-full bg-slate-50 px-5 py-4 rounded-xl font-bold border-none outline-none" placeholder="Nome do App" />
                                      <input value={settingsForm.footerText} onChange={e => setSettingsForm({...settingsForm, footerText: e.target.value})} className="w-full bg-slate-50 px-5 py-4 rounded-xl font-bold border-none outline-none" placeholder="Rodapé (Membros)" />
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
                              
                              <div className="pt-4 border-t border-slate-100">
                                  <button onClick={async () => { await updateSettings(settingsForm); loadDb(); showToast('Tudo Salvo!'); }} className="w-full sm:w-auto bg-emerald-500 text-white px-12 py-4 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 active:scale-95 transition-all">Aplicar Personalização</button>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-8">
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
                                                <button onClick={() => setConfirmDelete({ id: user.phone, type: 'user' })} className="text-xs font-bold text-rose-500">Remover</button>
                                            </td>
                                        </tr>
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
