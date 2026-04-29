// src/main/server/adapters/migrations/CreateAssetsTable.js

class CreateAssetsTable extends BaseMigration {
  /**
   * Nama sheet yang akan dibuat
   */
  get tableName() {
    return 'ASSETS';
  }

  /**
   * Definisi kolom-kolomnya
   */
  get columns() {
    return [
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
  }
}