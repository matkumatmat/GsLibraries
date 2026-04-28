// src/server/testing/_MockSheetDriver.js

/**
 * MockSheetDriver
 * Menggantikan SheetDriver asli untuk keperluan Unit Test.
 * Menyimpan data mentah di dalam memori (Array).
 */
class MockSheetDriver {
  constructor(initialData = []) {
    // initialData simulasi dari array of arrays
    this.data = initialData; 
  }

  readRaw() {
    return this.data;
  }

  readPage(page = 1, limit = 100) {
    const startRow = (page - 1) * limit;
    return this.data.slice(startRow, startRow + limit);
  }

  append(rowData) {
    this.data.push(rowData);
    return this.data.length + 1; // Simulasi nomor baris (asumsi header ada di row 1)
  }

  updateRow(rowNumber, rowData) {
    const arrayIndex = rowNumber - 2; // Asumsi row 2 = index 0 di raw data
    if (this.data[arrayIndex]) {
      this.data[arrayIndex] = rowData;
      return true;
    }
    throw new Error('Baris tidak ditemukan di MockSheet');
  }
}