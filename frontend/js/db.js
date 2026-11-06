/**
 * Mini Game Arcade - Local Database & Data Export Manager
 * Saves contact submissions, gameplay stats, high scores, and provides 1-click JSON/CSV export.
 */

class ArcadeDatabase {
  constructor() {
    this.CONTACTS_KEY = 'arcade_db_contacts';
    this.SCORES_KEY = 'arcade_db_scores';
    this.SETTINGS_KEY = 'arcade_db_settings';
  }

  // --- Contact Submissions ---

  saveContact(data) {
    const contacts = this.getContacts();
    const newEntry = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: data.name || 'Anonymous',
      email: data.email || 'N/A',
      topic: data.topic || 'General',
      message: data.message || '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    contacts.unshift(newEntry);
    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
    return newEntry;
  }

  getContacts() {
    try {
      return JSON.parse(localStorage.getItem(this.CONTACTS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  // --- Game Stats & History ---

  recordScore(gameId, score, extraData = {}) {
    const scores = this.getScores();
    const entry = {
      id: 'score_' + Date.now(),
      gameId: gameId,
      score: score,
      details: extraData,
      timestamp: new Date().toISOString()
    };
    scores.unshift(entry);
    // Keep last 100 games
    if (scores.length > 100) scores.pop();
    localStorage.setItem(this.SCORES_KEY, JSON.stringify(scores));
    return entry;
  }

  getScores() {
    try {
      return JSON.parse(localStorage.getItem(this.SCORES_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  // --- Export Full Database (JSON) ---

  exportAllAsJSON() {
    const fullData = {
      exportDate: new Date().toISOString(),
      app: 'Mini Game Arcade',
      version: '2.0.0',
      contacts: this.getContacts(),
      scores: this.getScores(),
      highScores: {
        fruitBlade: parseInt(localStorage.getItem('fruit_slice_highscore') || '0', 10),
        memoryMatchEasy: parseInt(localStorage.getItem('mem_best_easy') || '0', 10),
        memoryMatchMedium: parseInt(localStorage.getItem('mem_best_medium') || '0', 10),
        memoryMatchHard: parseInt(localStorage.getItem('mem_best_hard') || '0', 10)
      }
    };

    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arcade_database_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Export Contacts as CSV ---

  exportContactsCSV() {
    const contacts = this.getContacts();
    if (contacts.length === 0) {
      alert('No contact messages found to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Name', 'Email', 'Topic', 'Message'];
    const rows = contacts.map(c => [
      `"${c.id}"`,
      `"${c.timestamp}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.topic || '').replace(/"/g, '""')}"`,
      `"${(c.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arcade_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear all data with confirmation
  clearAllData() {
    if (confirm('Are you sure you want to reset all stored arcade data?')) {
      localStorage.removeItem(this.CONTACTS_KEY);
      localStorage.removeItem(this.SCORES_KEY);
      localStorage.removeItem('fruit_slice_highscore');
      localStorage.removeItem('mem_best_easy');
      localStorage.removeItem('mem_best_medium');
      localStorage.removeItem('mem_best_hard');
      alert('All local database records cleared.');
      location.reload();
    }
  }
}

window.arcadeDB = new ArcadeDatabase();

