/**
 * Omnintellx — Storage Provider Abstraction
 * Supports both Version A (IndexedDB browser-only) and Version B (PHP backend).
 * Enables seamless switching between local IndexedDB and InfinityFree intellx.php.
 */

import { Project, ChatSession, Checkpoint, ProviderConfig, AppSettings, EditorPrefs } from '../types';

export type SyncStatus = 'LOCAL_ONLY' | 'SYNC_PENDING' | 'SYNCED' | 'SYNC_FAILED';

export interface UserActivityLog {
  id: string;
  userId?: string;
  type: string;
  projectId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface IStorageProvider {
  name: string;
  isBackendConnected(): Promise<boolean>;
  loadProjects(): Promise<Project[]>;
  saveProjects(projects: Project[]): Promise<boolean>;
  loadChatSessions(): Promise<ChatSession[]>;
  saveChatSessions(sessions: ChatSession[]): Promise<boolean>;
  logActivity(activity: Omit<UserActivityLog, 'id' | 'timestamp'>): Promise<boolean>;
  loadActivities(): Promise<UserActivityLog[]>;
  saveIdea(idea: { id: string; title: string; description: string }): Promise<boolean>;
  loadIdeas(): Promise<Array<{ id: string; title: string; description: string; createdAt: string }>>;
  getSyncStatus(): SyncStatus;
}

const DB_NAME = 'omnintellx_virtual_db';
const DB_VERSION = 1;

/**
 * 1. IndexedDB Browser-Native Storage Provider (Version A)
 */
export class IndexedDBStorageProvider implements IStorageProvider {
  name = 'IndexedDBStorageProvider (Browser Native)';
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chatSessions')) {
          db.createObjectStore('chatSessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ideas')) {
          db.createObjectStore('ideas', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async isBackendConnected(): Promise<boolean> {
    return false; // Browser-only
  }

  getSyncStatus(): SyncStatus {
    return 'LOCAL_ONLY';
  }

  async loadProjects(): Promise<Project[]> {
    try {
      const db = await this.getDB();
      return new Promise<Project[]>((resolve) => {
        const tx = db.transaction('projects', 'readonly');
        const store = tx.objectStore('projects');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          if (list.length > 0) resolve(list);
          else {
            // Fallback to localStorage
            const local = localStorage.getItem('omnintellx.projects');
            resolve(local ? JSON.parse(local) : []);
          }
        };
        req.onerror = () => {
          const local = localStorage.getItem('omnintellx.projects');
          resolve(local ? JSON.parse(local) : []);
        };
      });
    } catch {
      const local = localStorage.getItem('omnintellx.projects');
      return local ? JSON.parse(local) : [];
    }
  }

  async saveProjects(projects: Project[]): Promise<boolean> {
    try {
      // Sync to localStorage as backup
      localStorage.setItem('omnintellx.projects', JSON.stringify(projects));
      const db = await this.getDB();
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      store.clear();
      for (const p of projects) {
        store.put(p);
      }
      return true;
    } catch {
      return false;
    }
  }

  async loadChatSessions(): Promise<ChatSession[]> {
    try {
      const db = await this.getDB();
      return new Promise<ChatSession[]>((resolve) => {
        const tx = db.transaction('chatSessions', 'readonly');
        const store = tx.objectStore('chatSessions');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      const local = localStorage.getItem('omnintellx.chatSessions');
      return local ? JSON.parse(local) : [];
    }
  }

  async saveChatSessions(sessions: ChatSession[]): Promise<boolean> {
    try {
      localStorage.setItem('omnintellx.chatSessions', JSON.stringify(sessions));
      const db = await this.getDB();
      const tx = db.transaction('chatSessions', 'readwrite');
      const store = tx.objectStore('chatSessions');
      store.clear();
      for (const s of sessions) {
        store.put(s);
      }
      return true;
    } catch {
      return false;
    }
  }

  async logActivity(activity: Omit<UserActivityLog, 'id' | 'timestamp'>): Promise<boolean> {
    const entry: UserActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...activity
    };
    try {
      const db = await this.getDB();
      const tx = db.transaction('activities', 'readwrite');
      tx.objectStore('activities').put(entry);
      return true;
    } catch {
      return false;
    }
  }

  async loadActivities(): Promise<UserActivityLog[]> {
    try {
      const db = await this.getDB();
      return new Promise<UserActivityLog[]>((resolve) => {
        const tx = db.transaction('activities', 'readonly');
        const req = tx.objectStore('activities').getAll();
        req.onsuccess = () => resolve((req.result || []).reverse().slice(0, 100));
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async saveIdea(idea: { id: string; title: string; description: string }): Promise<boolean> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('ideas', 'readwrite');
      tx.objectStore('ideas').put({
        ...idea,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch {
      return false;
    }
  }

  async loadIdeas(): Promise<Array<{ id: string; title: string; description: string; createdAt: string }>> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('ideas', 'readonly');
        const req = tx.objectStore('ideas').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

/**
 * 2. PHP InfinityFree Backend Storage Provider (Version B)
 */
export class PhpStorageProvider implements IStorageProvider {
  name = 'PhpStorageProvider (InfinityFree intellx.php)';
  private apiEndpoint: string;
  private localFallback = new IndexedDBStorageProvider();
  private syncState: SyncStatus = 'LOCAL_ONLY';

  constructor(endpoint = '/intellx.php') {
    this.apiEndpoint = endpoint;
  }

  async isBackendConnected(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiEndpoint}?action=system.ping`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        this.syncState = 'SYNCED';
        return true;
      }
    } catch {}
    this.syncState = 'LOCAL_ONLY';
    return false;
  }

  getSyncStatus(): SyncStatus {
    return this.syncState;
  }

  async loadProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${this.apiEndpoint}?action=project.list`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          this.syncState = 'SYNCED';
          // Cache locally
          this.localFallback.saveProjects(json.data);
          return json.data;
        }
      }
    } catch {}
    this.syncState = 'SYNC_FAILED';
    return this.localFallback.loadProjects();
  }

  async saveProjects(projects: Project[]): Promise<boolean> {
    await this.localFallback.saveProjects(projects);
    try {
      const res = await fetch(`${this.apiEndpoint}?action=project.save_all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        this.syncState = 'SYNCED';
        return true;
      }
    } catch {}
    this.syncState = 'SYNC_PENDING';
    return false;
  }

  async loadChatSessions(): Promise<ChatSession[]> {
    try {
      const res = await fetch(`${this.apiEndpoint}?action=chat.list`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {}
    return this.localFallback.loadChatSessions();
  }

  async saveChatSessions(sessions: ChatSession[]): Promise<boolean> {
    await this.localFallback.saveChatSessions(sessions);
    try {
      const res = await fetch(`${this.apiEndpoint}?action=chat.save_all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
        signal: AbortSignal.timeout(6000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async logActivity(activity: Omit<UserActivityLog, 'id' | 'timestamp'>): Promise<boolean> {
    await this.localFallback.logActivity(activity);
    try {
      const res = await fetch(`${this.apiEndpoint}?action=activity.log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async loadActivities(): Promise<UserActivityLog[]> {
    try {
      const res = await fetch(`${this.apiEndpoint}?action=activity.list`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {}
    return this.localFallback.loadActivities();
  }

  async saveIdea(idea: { id: string; title: string; description: string }): Promise<boolean> {
    await this.localFallback.saveIdea(idea);
    try {
      const res = await fetch(`${this.apiEndpoint}?action=idea.save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea),
        signal: AbortSignal.timeout(4000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async loadIdeas(): Promise<Array<{ id: string; title: string; description: string; createdAt: string }>> {
    try {
      const res = await fetch(`${this.apiEndpoint}?action=idea.list`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {}
    return this.localFallback.loadIdeas();
  }
}
