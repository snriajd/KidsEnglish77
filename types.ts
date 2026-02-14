
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
  dripDays?: number; // Dias após cadastro para liberar
  showInVertical?: boolean; // Exibir na lista principal
  showInHorizontal?: boolean; // Exibir na lista "Mais Aventuras"
}

export interface Media {
  id: string;
  moduleId: string;
  type: 'video' | 'image' | 'link';
  url: string;
  title: string;
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
  headerSpacing: number;
}

export interface AppData {
  users: User[];
  modules: Module[];
  media: Media[];
  settings: AppSettings;
  announcements: Announcement[];
}
