// src/main/server/adapters/SpreadsheetLogAdapter.js

/**
 * SpreadsheetLogAdapter
 * Menyimpan data log di dalam Spreadsheet yang diletakkan di dalam target folder Drive.
 */
class SpreadsheetLogAdapter {
  constructor() {
    this.targetFolderId = ConfigManager.get('DRIVE_TARGET_FOLDER_ID');
    this.logFileName = ConfigManager.get('DRIVE_LOG_FILE_NAME', 'Application_File_Logs');
    this.spreadsheetId = this._initSpreadsheet();
  }

  _initSpreadsheet() {
    if (!this.targetFolderId) throw new Error("Folder ID tidak dikonfigurasi.");
    
    const folder = DriveManager.getFolder(this.targetFolderId);
    const files = folder.searchFiles(`title = '${this.logFileName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    
    if (files.hasNext()) {
      return files.next().getId();
    } else {
      const ss = SpreadsheetApp.create(this.logFileName);
      const fileId = ss.getId();
      
      const sheet = ss.getActiveSheet();
      sheet.setName("Logs");
      sheet.appendRow(["Timestamp", "Action", "File ID", "File Name", "URL", "Size"]);
      sheet.getRange("A1:F1").setFontWeight("bold");
      
      DriveManager.moveItem(fileId, this.targetFolderId, true);
      return fileId;
    }
  }

  logAction(logData) {
    const ss = SpreadsheetApp.openById(this.spreadsheetId);
    const sheet = ss.getSheetByName("Logs") || ss.getActiveSheet();
    
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
    
    if (data.length <= 1) return []; 
    
    const logs = [];
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