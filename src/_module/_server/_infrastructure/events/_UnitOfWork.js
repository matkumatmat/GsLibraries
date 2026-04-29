// src/server/application/_UnitOfWork.js

/**
 * UnitOfWork
 * Single responsibility: Menjamin konsistensi transaksi (Database selesai DULU, baru Event jalan).
 * Menampung domain events di memori, dan hanya me-release-nya jika DB operation sukses.
 */
class UnitOfWork {
  /**
   * @param {Object} transactionAdapter - Objek dari infrastruktur yang punya method untuk locking (misal: WriteGate)
   */
  constructor(transactionAdapter) {
    if (!transactionAdapter || typeof transactionAdapter.execute !== 'function') {
      throw new AppError('Transaction adapter dengan method execute() harus di-inject ke UoW', 'SYS_ERROR', 500);
    }
    
    this.transactionAdapter = transactionAdapter;
    this.pendingEvents = [];
  }

  /**
   * Mendaftarkan event ke dalam memori antrean (belum benar-benar di-emit)
   */
  registerEvent(eventName, payload) {
    this.pendingEvents.push({ eventName, payload });
  }

  /**
   * Mengeksekusi blok kode (biasanya berisi multiple repo.create / repo.update)
   * di dalam lingkup transaksi yang aman.
   */
  commit(workFn) {
    try {
      // 1. Jalankan operasi mutasi database di dalam adapter (misal: dikunci oleh WriteGate)
      const result = this.transactionAdapter.execute(() => {
        return workFn();
      });

      // 2. JIKA SUKSES (tidak ada error throw dari database), rilis semua event yang tertunda
      for (const evt of this.pendingEvents) {
        // Gunakan emitSafe agar jika 1 listener gagal, tidak membatalkan HTTP Response
        EventBus.emitSafe(evt.eventName, evt.payload);
      }

      // 3. Bersihkan antrean
      this.pendingEvents = [];
      
      return result;

    } catch (error) {
      // JIKA DATABASE GAGAL: Bersihkan antrean event agar tidak pernah terkirim!
      this.pendingEvents = [];
      throw error; // Lempar kembali error-nya agar ditangkap oleh Router/Client
    }
  }
}