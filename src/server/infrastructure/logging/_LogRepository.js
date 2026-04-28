// src/server/infrastructure/logging/_LogRepository.js

/**
 * LogRepository
 * Single responsibility: Menyimpan entri log ke dalam Google Sheets secara aman.
 * Menggunakan SheetDriver dan WriteGate secara internal.
 */
class LogRepository {
  static write(logEntry) {
    // Ambil ID Sheet khusus log dari environment variables (bisa dipisah atau gabung DB utama)
    const logSheetId = EnvConfig.get('LOG_SHEET_ID'); 
    
    // Kalau nggak di-setting, abaikan aja nulis log ke sheet (biar dev env ga numpuk)
    if (!logSheetId) return;

    try {
      const driver = new SheetDriver(logSheetId, 'SYS_LOGS');
      
      // Menggunakan WriteGate agar penulisan log tidak tabrakan antar user
      WriteGate.execute(() => {
        driver.append([
          logEntry.id,
          logEntry.timestamp,
          logEntry.severity,
          logEntry.actor,
          logEntry.action,
          logEntry.message,
          JSON.stringify(logEntry.context || {}),
          logEntry.stack
        ]);
      });
    } catch (e) {
      // Fallback ke console bawaan Google jika gagal nulis ke Sheet
      console.error('Gagal menulis log ke Sheet:', e);
    }
  }
}