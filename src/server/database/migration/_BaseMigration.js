// src/server/database/migrations/_BaseMigration.js

/**
 * BaseMigration
 * Single responsibility: Cetak biru untuk semua file migrasi database.
 */
class BaseMigration {
  /**
   * Dieksekusi saat migrasi dijalankan (Membuat tabel/sheet, dsb)
   */
  static up() {
    throw new AppError('Metode up() harus diimplementasikan di subclass', 'MIGRATION_ERROR', 500);
  }

  /**
   * Dieksekusi saat rollback (Menghapus tabel/sheet, dsb)
   */
  static down() {
    throw new AppError('Metode down() harus diimplementasikan di subclass', 'MIGRATION_ERROR', 500);
  }

  /**
   * Helper untuk membuat Sheet baru beserta headernya
   */
  static createTable(spreadsheetId, sheetName, headers) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Set headers di baris pertama
      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
        sheet.setFrozenRows(1);
      }
      Logger.info(`Tabel/Sheet ${sheetName} berhasil dibuat.`);
    }
    return sheet;
  }

  /**
   * Helper untuk menghapus Sheet
   */
  static dropTable(spreadsheetId, sheetName) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      ss.deleteSheet(sheet);
      Logger.info(`Tabel/Sheet ${sheetName} berhasil dihapus.`);
    }
  }
}