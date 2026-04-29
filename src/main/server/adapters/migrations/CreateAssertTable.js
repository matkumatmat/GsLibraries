// src/main/server/adapters/migrations/CreateAssetsTable.js

class CreateAssetsTable extends BaseMigration {
  /**
   * Mengeksekusi migrasi (membuat tabel ASSETS)
   */
  static up() {
    // 1. Ambil ID Spreadsheet dari ConfigManager (karena di _BaseMigration butuh ssId)
    const ssId = ConfigManager.get('SHEET_DB_ID');
    if (!ssId) throw new Error("SHEET_DB_ID belum di-set di ConfigManager");

    // 2. Definisi nama tabel dan kolom-kolomnya
    const tableName = 'ASSETS';
    const columns = [
      'id', 
      'fileId', 
      'fileName', 
      'url', 
      'uploader', 
      'size', 
      'status', 
      'createdAt', 
      'updatedAt'
    ];

    // 3. Panggil method helper statis dari BaseMigration untuk membuat sheet & header
    this.createTable(ssId, tableName, columns);
  }

  /**
   * Rollback migrasi (menghapus tabel ASSETS)
   */
  static down() {
    const ssId = ConfigManager.get('SHEET_DB_ID');
    if (!ssId) return;
    this.dropTable(ssId, 'ASSETS');
  }
}