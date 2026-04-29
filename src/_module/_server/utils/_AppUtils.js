// src/server/utils/_AppUtils.js

/**
 * AppUtils
 * Single responsibility: Kumpulan fungsi utilitas umum (Swiss Army Knife) 
 * untuk memanipulasi tipe data dasar di GAS.
 */
class AppUtils {
  /**
   * Generate UUID v4 yang aman
   */
  static generateUUID() {
    return Utilities.getUuid();
  }

  /**
   * Parse JSON dengan aman. Kalau gagal, balikin string aslinya.
   * Mencegah aplikasi crash cuma gara-gara salah format kurung.
   */
  static safeParseJson(value) {
    if (typeof value !== 'string') return value;
    try {
      if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
        return JSON.parse(value);
      }
      return value;
    } catch (e) {
      return value; // Fallback ke raw string
    }
  }

  /**
   * Mapping Array of Arrays (dari Spreadsheet) jadi Array of Objects 
   * berdasarkan keys yang dikasih.
   */
  static mapArrayToObject(rawArray, keys) {
    if (!rawArray || !Array.isArray(rawArray)) return [];
    
    return rawArray.map(row => {
      let obj = {};
      keys.forEach((key, index) => {
        let value = row[index];
        if (typeof value === 'string') value = value.trim();
        obj[key] = (value !== undefined && value !== '') ? value : null;
      });
      return obj;
    });
  }

  /**
   * Jeda eksekusi (Sleep) dalam milidetik.
   * Berguna untuk menghindari Rate Limit API eksternal.
   */
  static sleep(ms) {
    Utilities.sleep(ms);
  }
}