// src/server/infrasctructure/cache/_CacheStrategy.js

/**
 * CacheStrategy
 * Single responsibility: Menyimpan kebijakan TTL (Time-To-Live) cache secara terpusat.
 * Mencegah tersebarnya angka "magic number" di dalam file service.
 */
class CacheStrategy {
  // Dalam detik (Seconds)
  static get VERY_SHORT() { return 60; }         // 1 Menit
  static get SHORT()      { return 300; }        // 5 Menit
  static get MEDIUM()     { return 3600; }       // 1 Jam
  static get LONG()       { return 10800; }      // 3 Jam
  static get MAX()        { return 21600; }      // 6 Jam (Batas maksimal GAS)

  /**
   * Helper untuk mengembalikan strategi default berdasarkan nama grup
   */
  static getTtlForGroup(groupName) {
    switch (groupName.toUpperCase()) {
      case 'AUTH_SESSIONS':
        return this.MAX;
      case 'MASTER_DATA':
        return this.LONG;
      case 'DASHBOARD_STATS':
        return this.SHORT;
      case 'RATE_LIMITS':
        return this.VERY_SHORT;
      default:
        return this.MEDIUM;
    }
  }
}