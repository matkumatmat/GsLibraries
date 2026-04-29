// src/main/server/adapters/DriveAdapter.js

/**
 * DriveAdapter
 * Mengimplementasikan operasi Drive menggunakan `_DriveManager` bawaan module.
 */
class DriveAdapter {
  constructor() {
    // Memanggil ConfigManager module
    this.targetFolderId = ConfigManager.get('DRIVE_TARGET_FOLDER_ID');
  }

  upload(fileData) {
    if (!this.targetFolderId) throw new Error("Folder ID tidak dikonfigurasi.");
    return DriveManager.uploadBase64(fileData.base64, fileData.fileName, this.targetFolderId);
  }

  getFileInfo(fileId) {
    return DriveManager.getFileInfo(fileId);
  }

  delete(fileId) {
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
