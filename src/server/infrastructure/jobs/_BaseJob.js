// src/server/infrastructure/jobs/_BaseJob.js

/**
 * BaseJob
 * Single responsibility: Cetak biru untuk semua Background Job.
 * Memaksa pembuatan metode getData (sumber data) dan handle (pemrosesan per item).
 */
class BaseJob {
  /**
   * Nama unik untuk Job ini (digunakan sebagai ID di penyimpanan state)
   */
  static get jobName() {
    throw new AppError('jobName must be overridden', 'JOB_ERROR', 500);
  }

  /**
   * Mengambil array data mentah yang akan diproses.
   * @param {Object} state - State dari job saat ini
   * @returns {Array}
   */
  static getData(state) {
    throw new AppError('getData() must be overridden', 'JOB_ERROR', 500);
  }

  /**
   * Memproses satu per satu item dari array getData.
   * @param {*} item - Satu elemen dari array data
   * @param {Object} state - State dari job saat ini (bisa dimodifikasi untuk simpan kalkulasi)
   */
  static handle(item, state) {
    throw new AppError('handle() must be overridden', 'JOB_ERROR', 500);
  }

  /**
   * Dieksekusi otomatis ketika semua data sudah selesai diproses 100%
   */
  static onComplete(state) {
    // Opsional: Bisa di-override untuk kirim email notif atau rekap
    Logger.info(`Job ${this.jobName} telah selesai seluruhnya.`);
  }
}