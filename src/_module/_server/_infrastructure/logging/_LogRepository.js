// src/server/infrastructure/logging/_LogRepository.js

/**
 * LogRepository
 * Single responsibility: Menyimpan entri log ke medium penyimpanan.
 * (100% Decoupled: Driver dan Gate di-inject dari luar)
 */
class LogRepository {
  constructor(driver, writeGate) {
    this.driver = driver;         // Abstraksi DB (SheetDriver)
    this.writeGate = writeGate;   // Abstraksi Concurrency (WriteGate)
  }

  write(logEntry) {
    // Kalau driver ga di-inject (misal fitur log lagi dimatiin), skip aja
    if (!this.driver) return; 

    try {
      this.writeGate.execute(() => {
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
      console.error('Gagal menulis log ke sistem:', e);
    }
  }
}