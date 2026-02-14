
import { AppData, User, Module, Media, AppSettings, Announcement } from './types';

const DB_NAME = 'KidsEnglishDB_v3'; // Versão incrementada para forçar atualização no deploy
const STORE_NAME = 'app_data';
const DATA_KEY = 'root_data';

const initialData: AppData = {
  users: [
    { phone: "98988650771", active: true, name: "Admin João", createdAt: new Date().toISOString() }
  ],
  modules: [
    { id: "1", title: "Welcome Stories", category: "historias", order: 1, active: true, icon: "📚", description: "First steps into English adventures!", banner: "" },
  ],
  media: [
    { id: "m1", moduleId: "1", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Let's Begin!", description: "Watch this video to start your journey." }
  ],
  announcements: [
    { id: "a1", text: "Welcome to KidsEnglish! 🚀", active: true, date: new Date().toISOString() }
  ],
  settings: {
    appName: "KidsEnglish",
    logoWidth: 180,
    fontFamily: 'Lilita One',
    titleAlignment: 'start',
    primaryColor: "#1A237E",
    accentColor: "#3D5AFE",
    headerSpacing: 48
  }
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const getDb = async (): Promise<AppData> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DATA_KEY);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as AppData);
        } else {
          saveDb(initialData).then(() => resolve(initialData));
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Erro IndexedDB, retornando initialData", e);
    return initialData;
  }
};

export const saveDb = async (data: AppData): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, DATA_KEY);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return false;
  }
};

export const updateSettings = async (settings: AppSettings) => {
  const db = await getDb();
  db.settings = settings;
  await saveDb(db);
};

export const addAnnouncement = async (text: string) => {
  const db = await getDb();
  db.announcements.push({ id: Date.now().toString(), text, active: true, date: new Date().toISOString() });
  await saveDb(db);
};

export const removeAnnouncement = async (id: string) => {
  const db = await getDb();
  db.announcements = db.announcements.filter(a => a.id !== id);
  await saveDb(db);
};

export const updateAnnouncement = async (id: string, text: string) => {
  const db = await getDb();
  const ann = db.announcements.find(a => a.id === id);
  if (ann) {
    ann.text = text;
    await saveDb(db);
  }
};

export const toggleAnnouncement = async (id: string) => {
  const db = await getDb();
  const ann = db.announcements.find(a => a.id === id);
  if (ann) {
    ann.active = !ann.active;
    await saveDb(db);
  }
};

export const addModule = async (module: Omit<Module, 'id'>) => {
  const db = await getDb();
  const newModule = { ...module, id: Date.now().toString() };
  db.modules.push(newModule);
  await saveDb(db);
  return true;
};

export const updateModule = async (updatedModule: Module) => {
  const db = await getDb();
  db.modules = db.modules.map(m => m.id === updatedModule.id ? updatedModule : m);
  await saveDb(db);
  return true;
};

export const removeModule = async (id: string) => {
  const db = await getDb();
  db.modules = db.modules.filter(m => m.id !== id);
  db.media = db.media.filter(m => m.moduleId !== id); 
  await saveDb(db);
};

export const addUser = async (user: Omit<User, 'createdAt'>) => {
  const db = await getDb();
  if (!db.users.find(u => u.phone === user.phone)) {
    db.users.push({ ...user, createdAt: new Date().toISOString() });
    await saveDb(db);
  }
};

export const removeUser = async (phone: string) => {
  const db = await getDb();
  db.users = db.users.filter(u => u.phone !== phone);
  await saveDb(db);
};

export const findUser = async (phone: string): Promise<User | undefined> => {
  const db = await getDb();
  const user = db.users.find(u => u.phone === phone && u.active);
  if (user) {
    user.lastLogin = new Date().toISOString();
    await saveDb(db);
  }
  return user;
};

export const exportData = async (): Promise<string> => {
  const db = await getDb();
  return JSON.stringify(db);
};

export const importData = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString) as AppData;
    if (!data.users || !data.modules || !data.settings) return false;
    await saveDb(data);
    return true;
  } catch (e) {
    return false;
  }
};
