
export interface User {
  phone: string;
  active: boolean;
  name?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Module {
  id: string;
  title: string;
  category: 'historias' | 'videos' | 'jogos' | 'musicas';
  order: number;
  active: boolean;
  icon?: string;
  description?: string;
  banner?: string; 
  bannerSize?: string;
  dripDays?: number;
  showInVertical?: boolean;
  showInHorizontal?: boolean;
}

export interface Media {
  id: string;
  moduleId: string;
  type: 'video' | 'image' | 'link';
  url: string;
  title: string;
  description?: string;
}

export interface Announcement {
  id: string;
  text: string;
  active: boolean;
  date: string;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  logoWidth: number;
  fontFamily: 'Fredoka' | 'Lilita One' | 'Quicksand' | 'Nunito' | 'Comic Neue' | 'Bubblegum Sans' | 'Outfit' | 'Baloo 2' | 'sans-serif';
  titleAlignment: 'start' | 'center' | 'end';
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headerSpacing: number;
  loginTitle: string;
  loginSubtitle: string;
  adminLoginTitle: string;
  maintenanceMode: boolean;
  horizontalSectionTitle: string; 
  footerText: string; // Nova propriedade para frase do rodapé
}

export interface AppData {
  users: User[];
  modules: Module[];
  media: Media[];
  settings: AppSettings;
  announcements: Announcement[];
}
