// src/main/server/adapters/DriveAdapter.js

/**
 * DriveAdapter
 * Mengimplementasikan DriveFileRepositoryPort menggunakan `_DriveManager` bawaan module.
 */
class DriveAdapter extends DriveFileRepositoryPort {
  constructor() {
    super();
    // Ambil target folder ID dari AppConfig
    this.targetFolderId = AppConfig.get('workspace.drive.targetFolderId');
  }

  upload(fileData) {
    if (!this.targetFolderId) throw new Error("Folder ID tidak dikonfigurasi di AppConfig.");
    // `_DriveManager.uploadBase64` butuh format yang tepat (prefix data URI jika ada)
    // Jika data tidak memiliki prefix, _DriveManager akan menanganinya asalkan diberi argumen yang pas
    const result = DriveManager.uploadBase64(fileData.base64, fileData.fileName, this.targetFolderId);
    return result;
  }

  getFileInfo(fileId) {
    return DriveManager.getFileInfo(fileId);
  }

  delete(fileId) {
    // Trashing file dari drive. Menggunakan isFile = true
    return DriveManager.trashItem(fileId, true);
  }

  listFiles() {
    if (!this.targetFolderId) throw new Error("Folder ID tidak dikonfigurasi.");
    const folder = DriveManager.getFolder(this.targetFolderId);
    const files = folder.getFiles();
    const result = [];
    while (files.hasNext()) {
      const file = files.next();
      result.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        size: file.getSize(),
        lastUpdated: file.getLastUpdated().toISOString()
      });
    }
    return result;
  }
}
