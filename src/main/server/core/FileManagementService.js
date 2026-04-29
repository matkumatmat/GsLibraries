// src/main/server/core/FileManagementService.js

/**
 * FileManagementService
 * Orchestrator (Core Domain) yang mengimplementasikan Use Cases.
 * Service ini menghubungkan Port Drive, Port Log, dan Utilitas Email (_Mailer).
 */
class FileManagementService {
  constructor(driveRepo, logRepo) {
    this.driveRepo = driveRepo;
    this.logRepo = logRepo;
  }

  /**
   * Mengunggah file, mencatat di log, dan mengirim email notifikasi.
   * @param {Object} fileData - { base64, fileName, mimeType }
   */
  uploadFile(fileData) {
    // 1. Upload file ke Drive
    const fileResult = this.driveRepo.upload(fileData);

    // 2. Logging
    const logEntry = {
      action: 'UPLOAD',
      fileId: fileResult.id,
      fileName: fileResult.name,
      timestamp: new Date().toISOString(),
      url: fileResult.url,
      size: fileResult.size || 0
    };
    this.logRepo.logAction(logEntry);

    // 3. Notifikasi via _Mailer (mengambil email admin dari AppConfig)
    const adminEmail = AppConfig.get('email.adminAddress', 'admin@example.com');
    const prefix = AppConfig.get('email.logSubjectPrefix', '[DRIVE LOG]');

    // (Dalam konteks testing, kita cek apakah kita berjalan di dalam GAS. Jika iya, Mailer akan bekerja)
    if (typeof Mailer !== 'undefined') {
      try {
        Mailer.send({
          to: adminEmail,
          subject: `${prefix} File Uploaded: ${fileResult.name}`,
          body: `File baru telah diunggah ke Workspace Drive.\n\nNama: ${fileResult.name}\nID: ${fileResult.id}\nURL: ${fileResult.url}\nWaktu: ${logEntry.timestamp}`
        });
      } catch (e) {
         // Silently catch email error untuk mencegah transaksi gagal karena masalah mailer
         if (typeof Logger !== 'undefined') Logger.warn("Gagal mengirim email notifikasi", e);
      }
    }

    return fileResult;
  }

  /**
   * Menghapus file dan mencatatnya.
   * @param {string} fileId
   */
  deleteFile(fileId) {
    // 1. Dapatkan info file sebelum dihapus (agar kita tau nama file-nya)
    let fileInfo;
    try {
      fileInfo = this.driveRepo.getFileInfo(fileId);
    } catch(e) {
      throw new Error(`File dengan ID ${fileId} tidak ditemukan.`);
    }

    // 2. Hapus file
    this.driveRepo.delete(fileId);

    // 3. Logging
    const logEntry = {
      action: 'DELETE',
      fileId: fileInfo.id,
      fileName: fileInfo.name,
      timestamp: new Date().toISOString(),
      url: '-',
      size: 0
    };
    this.logRepo.logAction(logEntry);

    // 4. Notifikasi
    const adminEmail = AppConfig.get('email.adminAddress', 'admin@example.com');
    const prefix = AppConfig.get('email.logSubjectPrefix', '[DRIVE LOG]');

    if (typeof Mailer !== 'undefined') {
      try {
        Mailer.send({
          to: adminEmail,
          subject: `${prefix} File Deleted: ${fileInfo.name}`,
          body: `File telah dihapus dari Workspace Drive.\n\nNama: ${fileInfo.name}\nID: ${fileInfo.id}\nWaktu: ${logEntry.timestamp}`
        });
      } catch(e) {
        if (typeof Logger !== 'undefined') Logger.warn("Gagal mengirim email notifikasi", e);
      }
    }

    return { success: true, message: "File berhasil dihapus" };
  }

  listFiles() {
    return this.driveRepo.listFiles();
  }
}
