// src/server/utils/_DateUtils.js

/**
 * DateUtils
 * Single responsibility: Membantu manipulasi dan format tanggal 
 * dengan Timezone yang terikat pada akun Google Workspace.
 */
class DateUtils {
  /**
   * Ambil Timezone default dari script/akun
   */
  static getTimezone() {
    return Session.getScriptTimeZone();
  }

  /**
   * Format Date object ke string (Ala moment.js)
   * Contoh: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
   */
  static format(date, formatString = 'yyyy-MM-dd HH:mm:ss') {
    if (!date) return null;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return Utilities.formatDate(d, this.getTimezone(), formatString);
    } catch (e) {
      return date; // Kembalikan raw jika error
    }
  }

  /**
   * Menambahkan/Mengurangi Hari
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Cek apakah suatu tanggal sudah lewat dari hari ini
   */
  static isExpired(targetDate) {
    if (!targetDate) return false;
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    return target < now;
  }

  /**
   * Menghitung sisa hari (selisih) dari hari ini
   */
  static getDaysRemaining(targetDate) {
    if (!targetDate) return 0;
    const target = new Date(targetDate);
    const today = new Date();
    
    // Normalisasi jam biar akurat per hari
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}