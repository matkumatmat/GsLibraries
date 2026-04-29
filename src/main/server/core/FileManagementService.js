// src/main/server/core/FileManagementService.js

class FileManagementService {
  constructor(driveRepo, logRepo) {
    this.driveRepo = driveRepo;
    this.logRepo = logRepo;
  }

  uploadFile(fileData) {
    const fileResult = this.driveRepo.upload(fileData);

    const logEntry = {
      action: 'UPLOAD',
      fileId: fileResult.id,
      fileName: fileResult.name,
      timestamp: new Date().toISOString(),
      url: fileResult.url,
      size: fileResult.size || 0
    };
    this.logRepo.logAction(logEntry);

    const adminEmail = ConfigManager.get('EMAIL_ADMIN', 'admin@example.com');
    const prefix = ConfigManager.get('EMAIL_LOG_PREFIX', '[DRIVE LOG]');
    
    if (typeof Mailer !== 'undefined') {
      try {
        Mailer.send({
          to: adminEmail,
          subject: `${prefix} File Uploaded: ${fileResult.name}`,
          body: `File baru telah diunggah ke Workspace Drive.\n\nNama: ${fileResult.name}\nID: ${fileResult.id}\nURL: ${fileResult.url}\nWaktu: ${logEntry.timestamp}`
        });
      } catch (e) {
         if (typeof Logger !== 'undefined') Logger.warn("Gagal mengirim email notifikasi", e);
      }
    }

    return fileResult;
  }

  deleteFile(fileId) {
    let fileInfo;
    try {
      fileInfo = this.driveRepo.getFileInfo(fileId);
    } catch(e) {
      throw new Error(`File dengan ID ${fileId} tidak ditemukan.`);
    }

    this.driveRepo.delete(fileId);

    const logEntry = {
      action: 'DELETE',
      fileId: fileInfo.id,
      fileName: fileInfo.name,
      timestamp: new Date().toISOString(),
      url: '-',
      size: 0
    };
    this.logRepo.logAction(logEntry);

    const adminEmail = ConfigManager.get('EMAIL_ADMIN', 'admin@example.com');
    const prefix = ConfigManager.get('EMAIL_LOG_PREFIX', '[DRIVE LOG]');
    
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
