/**
 * Mini Game Arcade - Core Database Engine & Storage Adapter
 * Multi-layer persistence supporting IndexedDB with fallback to localStorage.
 */

class ArcadeDatabase {
  constructor(dbName = 'ArcadeStorageDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.isReady = false;
    this.readyPromise = this.init();
  }

  async init() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isReady = true;
      return null;
    }

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('game_sessions')) {
            const sessionsStore = db.createObjectStore('game_sessions', { keyPath: 'sessionId' });
            sessionsStore.createIndex('gameId', 'gameId', { unique: false });
            sessionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains('contact_inquiries')) {
            const contactStore = db.createObjectStore('contact_inquiries', { keyPath: 'inquiryId' });
            contactStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        req.onsuccess = (e) => {
          this.db = e.target.result;
          this.isReady = true;
          resolve(this.db);
        };

        req.onerror = () => {
          this.isReady = true;
          resolve(null);
        };
      } catch (err) {
        this.isReady = true;
        resolve(null);
      }
    });
  }

  async saveSession(record) {
    await this.readyPromise;
    const session = {
      sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      gameId: record.gameId || 'arcade-game',
      score: Number(record.score) || 0,
      durationSeconds: Number(record.duration) || 0,
      difficulty: record.difficulty || 'standard',
      moves: Number(record.moves) || 0,
      stars: Number(record.stars) || 0,
      deviceViewport: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1200 ? 'tablet' : 'desktop',
      timestamp: new Date().toISOString()
    };

    if (this.db) {
      try {
        const tx = this.db.transaction('game_sessions', 'readwrite');
        tx.objectStore('game_sessions').add(session);
      } catch (e) {}
    }

    try {
      const key = `arcade_sessions_${session.gameId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(session);
      if (existing.length > 50) existing.length = 50;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {}

    return session;
  }

  async saveInquiry(inquiry) {
    await this.readyPromise;
    const doc = {
      inquiryId: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: (inquiry.name || '').trim(),
      email: (inquiry.email || '').trim(),
      subject: (inquiry.subject || '').trim(),
      message: (inquiry.message || '').trim(),
      status: 'received',
      timestamp: new Date().toISOString()
    };

    if (this.db) {
      try {
        const tx = this.db.transaction('contact_inquiries', 'readwrite');
        tx.objectStore('contact_inquiries').add(doc);
      } catch (e) {}
    }

    try {
      const existing = JSON.parse(localStorage.getItem('arcade_inquiries') || '[]');
      existing.unshift(doc);
      localStorage.setItem('arcade_inquiries', JSON.stringify(existing));
    } catch (e) {}

    return doc;
  }

  async getAllSessions() {
    await this.readyPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction('game_sessions', 'readonly');
          const store = tx.objectStore('game_sessions');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this._getLocalStorageSessions());
        } catch (e) {
          resolve(this._getLocalStorageSessions());
        }
      });
    }
    return this._getLocalStorageSessions();
  }

  _getLocalStorageSessions() {
    const list = [];
    ['fruit-slice', 'memory-match'].forEach(id => {
      try {
        const items = JSON.parse(localStorage.getItem(`arcade_sessions_${id}`) || '[]');
        list.push(...items);
      } catch (e) {}
    });
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getAllInquiries() {
    await this.readyPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction('contact_inquiries', 'readonly');
          const req = tx.objectStore('contact_inquiries').getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this._getLocalStorageInquiries());
        } catch (e) {
          resolve(this._getLocalStorageInquiries());
        }
      });
    }
    return this._getLocalStorageInquiries();
  }

  _getLocalStorageInquiries() {
    try {
      return JSON.parse(localStorage.getItem('arcade_inquiries') || '[]');
    } catch (e) {
      return [];
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArcadeDatabase;
}

