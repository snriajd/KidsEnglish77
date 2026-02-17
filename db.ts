
import { AppData, User, Module, Media, AppSettings, Announcement } from './types';
import { supabase } from './supabaseClient';

// --- Mappers (Snake Case DB -> Camel Case App) ---

const mapUser = (u: any): User => ({
  phone: u.phone,
  name: u.name,
  active: u.active,
  createdAt: u.created_at,
  lastLogin: u.last_login
});

const mapModule = (m: any): Module => ({
  id: m.id,
  title: m.title,
  category: m.category || 'geral', // Default fallback
  order: m.order_index,
  active: m.active,
  icon: m.icon,
  description: m.description,
  banner: m.banner,
  bannerSize: m.banner_size,
  dripDays: m.drip_days,
  showInVertical: m.show_in_vertical,
  showInHorizontal: m.show_in_horizontal
});

const mapMedia = (m: any): Media => ({
  id: m.id,
  moduleId: m.module_id,
  type: m.type,
  url: m.url,
  title: m.title,
  description: m.description
});

const mapAnnouncement = (a: any): Announcement => ({
  id: a.id,
  text: a.text,
  active: a.active,
  date: a.date
});

const mapSettings = (s: any): AppSettings => ({
  appName: s.app_name,
  logoUrl: s.logo_url,
  logoWidth: s.logo_width || 180,
  fontFamily: s.font_family || 'Lilita One',
  titleAlignment: s.title_alignment || 'start',
  primaryColor: s.primary_color || '#1A237E',
  accentColor: s.accent_color || '#3D5AFE',
  backgroundColor: s.background_color || '#FFFFFF',
  headerSpacing: s.header_spacing || 48,
  loginTitle: s.login_title || 'Acesso Exclusivo',
  loginSubtitle: s.login_subtitle || 'Premium Education',
  adminLoginTitle: s.admin_login_title || 'Console Admin',
  adminLoginSubtitle: s.admin_login_subtitle || 'Segurança Nível 1',
  showAdminLink: s.show_admin_link !== false,
  maintenanceMode: s.maintenance_mode || false,
  horizontalSectionTitle: s.horizontal_section_title || 'Mais Aventuras',
  footerText: s.footer_text || 'KIDSENGLISH PREMIUM',
  moduleDesignTheme: s.module_design_theme || 'modern-glass'
});

const defaultSettings: AppSettings = {
  appName: "KidsEnglish",
  logoWidth: 180,
  fontFamily: 'Lilita One',
  titleAlignment: 'start',
  primaryColor: "#1A237E",
  accentColor: "#3D5AFE",
  backgroundColor: "#FFFFFF",
  headerSpacing: 48,
  loginTitle: "Acesso Exclusivo",
  loginSubtitle: "Premium Education",
  adminLoginTitle: "Console Admin",
  adminLoginSubtitle: "Segurança Nível 1",
  showAdminLink: true,
  maintenanceMode: false,
  horizontalSectionTitle: "Mais Aventuras",
  footerText: "KIDSENGLISH PREMIUM",
  moduleDesignTheme: 'modern-glass'
};

// --- CORE FUNCTIONS ---

export const getDb = async (): Promise<AppData> => {
  const [users, modules, media, announcements, settingsRes] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('modules').select('*').order('order_index', { ascending: true }),
    supabase.from('media').select('*'),
    supabase.from('announcements').select('*').order('date', { ascending: false }),
    supabase.from('settings').select('*').limit(1).single()
  ]);

  return {
    users: (users.data || []).map(mapUser),
    modules: (modules.data || []).map(mapModule),
    media: (media.data || []).map(mapMedia),
    announcements: (announcements.data || []).map(mapAnnouncement),
    settings: settingsRes.data ? mapSettings(settingsRes.data) : defaultSettings
  };
};

export const findUser = async (phone: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).single();
    if (error || !data) return null;
    return mapUser(data);
};

export const updateSettings = async (settings: AppSettings) => {
    const dbSettings = {
        app_name: settings.appName,
        logo_url: settings.logoUrl,
        logo_width: settings.logoWidth,
        font_family: settings.fontFamily,
        title_alignment: settings.titleAlignment,
        primary_color: settings.primaryColor,
        accent_color: settings.accentColor,
        background_color: settings.backgroundColor,
        header_spacing: settings.headerSpacing,
        login_title: settings.loginTitle,
        login_subtitle: settings.loginSubtitle,
        admin_login_title: settings.adminLoginTitle,
        admin_login_subtitle: settings.adminLoginSubtitle,
        show_admin_link: settings.showAdminLink,
        maintenance_mode: settings.maintenanceMode,
        horizontal_section_title: settings.horizontalSectionTitle,
        footer_text: settings.footerText,
        module_design_theme: settings.moduleDesignTheme
    };

    const { data } = await supabase.from('settings').select('id').limit(1);
    
    if (data && data.length > 0) {
        await supabase.from('settings').update(dbSettings).eq('id', data[0].id);
    } else {
        await supabase.from('settings').insert(dbSettings);
    }
};

export const addModule = async (module: any) => {
    const dbModule = {
        title: module.title,
        category: module.category || 'geral',
        order_index: module.order,
        active: module.active,
        description: module.description,
        banner: module.banner,
        show_in_vertical: module.showInVertical,
        show_in_horizontal: module.showInHorizontal
    };
    await supabase.from('modules').insert(dbModule);
};

export const updateModule = async (module: Module) => {
     const dbModule = {
        title: module.title,
        category: module.category || 'geral',
        order_index: module.order,
        active: module.active,
        description: module.description,
        banner: module.banner,
        show_in_vertical: module.showInVertical,
        show_in_horizontal: module.showInHorizontal
    };
    await supabase.from('modules').update(dbModule).eq('id', module.id);
};

export const removeModule = async (id: string) => {
    await supabase.from('modules').delete().eq('id', id);
};

export const addMedia = async (media: any) => {
    const dbMedia = {
        module_id: media.moduleId,
        type: media.type,
        url: media.url,
        title: media.title,
        description: media.description
    };
    await supabase.from('media').insert(dbMedia);
};

export const removeMedia = async (id: string) => {
    await supabase.from('media').delete().eq('id', id);
};

export const addUser = async (user: any) => {
    const dbUser = {
        phone: user.phone,
        name: user.name,
        active: user.active,
        created_at: new Date().toISOString()
    };
    await supabase.from('users').insert(dbUser);
};

export const removeUser = async (phone: string) => {
    await supabase.from('users').delete().eq('phone', phone);
};

export const updateUser = async (user: User) => {
    await supabase.from('users').update({ name: user.name, active: user.active }).eq('phone', user.phone);
};

export const addAnnouncement = async (text: string) => {
    await supabase.from('announcements').insert({
        text,
        active: true,
        date: new Date().toISOString()
    });
};

export const removeAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
};

export const toggleAnnouncement = async (id: string) => {
    const { data } = await supabase.from('announcements').select('active').eq('id', id).single();
    if (data) {
        await supabase.from('announcements').update({ active: !data.active }).eq('id', id);
    }
};

export const reorderModule = async (moduleId: string, newIndex: number) => {
    await supabase.from('modules').update({ order_index: newIndex }).eq('id', moduleId);
};

export const resetDb = async () => {
    if (confirm('Atenção: Isso limpará TODOS os dados do banco (Módulos, Alunos, Aulas). Configurações serão mantidas. Continuar?')) {
        await supabase.from('media').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('users').delete().neq('phone', '0');
        await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
};

export const exportData = async (): Promise<string> => {
    const db = await getDb();
    return JSON.stringify(db, null, 2);
};

export const importData = async (jsonContent: string): Promise<boolean> => {
    try {
        const data = JSON.parse(jsonContent) as AppData;
        
        // 1. Settings
        if (data.settings) await updateSettings(data.settings);

        // 2. Users (Upsert)
        if (data.users && data.users.length > 0) {
            const usersPayload = data.users.map(u => ({
                phone: u.phone,
                name: u.name,
                active: u.active,
                created_at: u.createdAt
            }));
            await supabase.from('users').upsert(usersPayload, { onConflict: 'phone' });
        }

        // 3. Modules (Upsert)
        if (data.modules && data.modules.length > 0) {
             const modulesPayload = data.modules.map(m => ({
                id: m.id,
                title: m.title,
                category: m.category || 'geral',
                order_index: m.order,
                active: m.active,
                description: m.description,
                banner: m.banner,
                show_in_vertical: m.showInVertical,
                show_in_horizontal: m.showInHorizontal
            }));
            await supabase.from('modules').upsert(modulesPayload, { onConflict: 'id' });
        }
        
        // 4. Media (Upsert)
        if (data.media && data.media.length > 0) {
            const mediaPayload = data.media.map(m => ({
                id: m.id,
                module_id: m.moduleId,
                type: m.type,
                url: m.url,
                title: m.title,
                description: m.description
            }));
             await supabase.from('media').upsert(mediaPayload, { onConflict: 'id' });
        }

        // 5. Announcements
        if (data.announcements && data.announcements.length > 0) {
             const annPayload = data.announcements.map(a => ({
                id: a.id,
                text: a.text,
                active: a.active,
                date: a.date
            }));
            await supabase.from('announcements').upsert(annPayload, { onConflict: 'id' });
        }
        
        return true;
    } catch (e) {
        console.error("Import Error", e);
        return false;
    }
};
