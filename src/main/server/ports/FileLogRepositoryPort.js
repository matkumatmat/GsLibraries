// src/main/server/ports/FileLogRepositoryPort.js

/**
 * FileLogRepositoryPort
 * Kontrak (Interface) untuk pencatatan log manipulasi file.
 */
class FileLogRepositoryPort {
  /**
   * @param {Object} logData - { action, fileId, fileName, timestamp, user }
   */
  logAction(logData) { throw new Error("Method 'logAction' harus diimplementasikan."); }

  /**
   * @returns {Array<Object>} - Daftar history log
   */
  getLogs() { throw new Error("Method 'getLogs' harus diimplementasikan."); }
}
