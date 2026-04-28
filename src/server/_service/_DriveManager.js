// src/server/_services/_DriveManager.js

/**
 * DriveManager
 * Single responsibility: Abstraksi agnostik untuk operasi Google Drive.
 */
class DriveManager {
  /**
   * Mengambil folder berdasarkan ID, atau fallback ke ROOT jika tidak ada.
   */
  static getFolder(folderId) {
    if (!folderId) return DriveApp.getRootFolder();
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      throw new AppError(`Folder dengan ID ${folderId} tidak ditemukan`, 'DRIVE_ERROR', 500);
    }
  }

  /**
   * Upload file base64 ke Drive
   */
  static uploadBase64(base64Data, fileName, folderId = null) {
    try {
      // Split header data:image/png;base64,
      const splitBase = base64Data.split(',');
      const isBase64 = splitBase.length > 1;
      const contentType = isBase64 ? splitBase[0].split(';')[0].split(':')[1] : 'application/octet-stream';
      const rawBase64 = isBase64 ? splitBase[1] : base64Data;
      
      const blob = Utilities.newBlob(Utilities.base64Decode(rawBase64), contentType, fileName);
      const folder = this.getFolder(folderId);
      const file = folder.createFile(blob);
      
      return {
        id: file.getId(),
        url: file.getUrl(),
        downloadUrl: file.getDownloadUrl()
      };
    } catch (e) {
      throw new AppError(`Gagal upload file: ${e.message}`, 'DRIVE_UPLOAD_ERROR', 500);
    }
  }

  /**
   * Mendapatkan URL gambar thumbnail yang bisa di-embed di tag <img> (Tanpa auth rintangan)
   */
  static getThumbnailUrl(fileId, size = 'w800') {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }
}