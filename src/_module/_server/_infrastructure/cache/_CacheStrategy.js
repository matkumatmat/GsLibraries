// src/server/infrastructure/cache/_CacheStrategy.js
class CacheStrategy {
  // Constants
  static get VERY_SHORT() { return 60; }
  static get SHORT()      { return 300; }
  static get MEDIUM()     { return 3600; }
  static get LONG()       { return 10800; }
  static get MAX()        { return 21600; }

  // Static map untuk custom rules dari project
  static _customRules = new Map();

  /**
   * Mengizinkan project spesifik untuk mendaftarkan aturan TTL sendiri di main.js
   */
  static registerGroupTtl(groupName, ttlInSeconds) {
    this._customRules.set(groupName.toUpperCase(), ttlInSeconds);
  }

  static getTtlForGroup(groupName) {
    const key = groupName.toUpperCase();
    
    // Cek apakah ada custom rule yang didaftarkan
    if (this._customRules.has(key)) {
      return this._customRules.get(key);
    }

    // Fallback ke bawaan framework
    switch (key) {
      case 'AUTH_SESSIONS': return this.MAX;
      case 'MASTER_DATA': return this.LONG;
      case 'DASHBOARD_STATS': return this.SHORT;
      case 'RATE_LIMITS': return this.VERY_SHORT;
      default: return this.MEDIUM;
    }
  }
}2