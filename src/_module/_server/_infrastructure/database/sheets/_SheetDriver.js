// src/server/database/SheetDriver.js

/**
 * SheetDriver
 * Single responsibility: Melakukan operasi CRUD mentah (Raw) ke satu spesifik Google Sheet.
 * Tidak tahu menahu soal skema, bisnis logik, atau bentuk domain object.
 */
class SheetDriver {
  constructor(spreadsheetId, sheetName) {
    if (!spreadsheetId || !sheetName) {
      throw new AppError("Spreadsheet ID dan Sheet Name wajib diisi di SheetDriver", "DB_INIT_ERROR", 500);
    }
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
  }

  _getSheet() {
    try {
      const ss = SpreadsheetApp.openById(this.spreadsheetId);
      const sheet = ss.getSheetByName(this.sheetName);
      if (!sheet) throw new Error(`Sheet ${this.sheetName} tidak ditemukan`);
      return sheet;
    } catch (e) {
      throw new DatabaseError(`Gagal mengakses database: ${e.message}`);
    }
  }

  /**
   * Menarik semua data mentah (Array of Arrays)
   */
  readRaw() {
    const sheet = this._getSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return []; // Kosong (hanya header)
    
    return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }

  /**
   * Menarik data dengan pagination (Sangat berguna untuk limit memory V8)
   */
  readPage(page = 1, limit = 100) {
    const sheet = this._getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const startRow = 2 + ((page - 1) * limit);
    if (startRow > lastRow) return [];

    const rowsAvailable = (lastRow - startRow) + 1;
    const rowsToFetch = Math.min(limit, rowsAvailable);
    const lastCol = sheet.getLastColumn();

    return sheet.getRange(startRow, 1, rowsToFetch, lastCol).getValues();
  }

  /**
   * Insert data baru (Bungkus pakai WriteGate agar thread-safe)
   */
  append(rowData) {
    return WriteGate.execute(() => {
      const sheet = this._getSheet();
      sheet.appendRow(rowData);
      return sheet.getLastRow();
    });
  }

  /**
   * Menimpa spesifik baris (Full update baris)
   */
  updateRow(rowNumber, rowData) {
    return WriteGate.execute(() => {
      const sheet = this._getSheet();
      sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
      return true;
    });
  }
}