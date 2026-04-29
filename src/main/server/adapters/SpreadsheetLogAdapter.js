// src/main/server/adapters/SpreadsheetLogAdapter.js

/**
 * SpreadsheetLogAdapter
 * Mengimplementasikan FileLogRepositoryPort.
 * Menyimpan data log di dalam Spreadsheet yang diletakkan di dalam target folder Drive.
 * Jika file Spreadsheet belum ada, maka akan otomatis dibuat (Initial Migration).
 */
class SpreadsheetLogAdapter {
  constructor() {
    this.targetFolderId = AppConfig.get('workspace.drive.targetFolderId');
    this.logFileName = AppConfig.get('workspace.spreadsheet.logFileName', 'Application_File_Logs');
    this.spreadsheetId = this._initSpreadsheet();
  }

  /**
   * Mengecek apakah spreadsheet log sudah ada di folder. Jika belum, buat baru.
   */
  _initSpreadsheet() {
    if (!this.targetFolderId) throw new Error("Folder ID tidak dikonfigurasi.");

    // Cari file dengan nama logFileName di target folder
    const folder = DriveManager.getFolder(this.targetFolderId);
    const files = folder.searchFiles(`title = '${this.logFileName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);

    if (files.hasNext()) {
      return files.next().getId();
    } else {
      // Buat spreadsheet baru
      const ss = SpreadsheetApp.create(this.logFileName);
      const fileId = ss.getId();

      // Setup Header (Migration)
      const sheet = ss.getActiveSheet();
      sheet.setName("Logs");
      sheet.appendRow(["Timestamp", "Action", "File ID", "File Name", "URL", "Size"]);
      sheet.getRange("A1:F1").setFontWeight("bold");

      // Pindahkan ke target folder (karena SpreadsheetApp.create menyimpannya di root)
      DriveManager.moveItem(fileId, this.targetFolderId, true);

      return fileId;
    }
  }

  logAction(logData) {
    const ss = SpreadsheetApp.openById(this.spreadsheetId);
    const sheet = ss.getSheetByName("Logs") || ss.getActiveSheet();

    // Append row: ["Timestamp", "Action", "File ID", "File Name", "URL", "Size"]
    sheet.appendRow([
      logData.timestamp,
      logData.action,
      logData.fileId,
      logData.fileName,
      logData.url || "-",
      logData.size || 0
    ]);
  }

  getLogs() {
    const ss = SpreadsheetApp.openById(this.spreadsheetId);
    const sheet = ss.getSheetByName("Logs") || ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return []; // Hanya header

    const logs = [];
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      logs.push({
        timestamp: data[i][0],
        action: data[i][1],
        fileId: data[i][2],
        fileName: data[i][3],
        url: data[i][4],
        size: data[i][5]
      });
    }
    return logs;
  }
}
