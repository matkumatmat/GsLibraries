// src/server/database/WriteGate.js

/**
 * WriteGate
 * Single responsibility: Mengamankan operasi penulisan ke Google Sheets menggunakan LockService.
 * Mencegah race condition ketika multiple user melakukan submit data secara bersamaan.
 */
class WriteGate {
  /**
   * Mengeksekusi fungsi secara synchronous dengan sistem antrean (Lock)
   * @param {Function} fn - Fungsi yang akan dieksekusi (contoh: sheet.appendRow)
   * @param {number} timeoutMs - Batas waktu antre (default 15 detik)
   */
  static execute(fn, timeoutMs = 15000) {
    // getScriptLock() aman untuk script yang dideploy sebagai Web App (mengantrekan semua user)
    const lock = LockService.getScriptLock();
    
    try {
      lock.waitLock(timeoutMs);
      return fn();
    } catch (e) {
      if (e.message.includes('lock')) {
        throw new ConflictError('Sistem sedang sibuk memproses data lain. Silakan coba beberapa saat lagi.');
      }
      throw new DatabaseError(`Operasi database gagal: ${e.message}`);
    } finally {
      // Pastikan gembok selalu dilepas, walau operasi error sekalipun
      lock.releaseLock();
    }
  }

  /**
   * Helper jika butuh retry otomatis sebelum benar-benar gagal
   */
  static executeWithRetry(fn, maxRetries = 3, delayMs = 1000) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return this.execute(fn);
      } catch (e) {
        attempts++;
        if (attempts >= maxRetries) throw e;
        Utilities.sleep(delayMs);
      }
    }
  }
}