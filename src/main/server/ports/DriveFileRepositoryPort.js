// src/main/server/ports/DriveFileRepositoryPort.js

/**
 * DriveFileRepositoryPort
 * Kontrak (Interface) untuk memanipulasi file di Drive.
 */
class DriveFileRepositoryPort {
  /**
   * @param {Object} fileData - Objek dengan format { base64, fileName, mimeType }
   * @returns {Object} - Metadata file yang berhasil di-upload { id, name, url, size }
   */
  upload(fileData) { throw new Error("Method 'upload' harus diimplementasikan."); }

  /**
   * @param {string} fileId
   * @returns {Object} - Metadata file
   */
  getFileInfo(fileId) { throw new Error("Method 'getFileInfo' harus diimplementasikan."); }

  /**
   * @param {string} fileId
   */
  delete(fileId) { throw new Error("Method 'delete' harus diimplementasikan."); }

  /**
   * Mengambil daftar file
   */
  listFiles() { throw new Error("Method 'listFiles' harus diimplementasikan."); }
}
