// src/server/infrastructure/logging/_SheetLogRepository.js

/**
 * SheetLogRepository (Adapter)
 * Implementasi Log Storage menggunakan Google Sheets.
 */
class SheetLogRepository {
  /**
   * @param {Object} sheetDriver - Instance dari infrastructure/database/sheets/_SheetDriver
   * @param {Object} writeGate - Instance dari infrastructure/database/sheets/_WriteGate
   */
  constructor(sheetDriver, writeGate) {
    this.driver = sheetDriver;
    this.writeGate = writeGate;
  }

  write(logEntry) {
    if (!this.driver) return; 

    try {
      this.writeGate.execute(() => {
        // Konversi objek log menjadi array kolom khusus untuk Sheet
        this.driver.append([
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
      console.error('Gagal menulis log ke Sheet:', e);
    }
  }
}