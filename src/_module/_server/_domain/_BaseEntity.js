// src/server/domain/_BaseEntity.js

/**
 * BaseEntity
 * Fondasi dasar untuk semua model domain.
 * Menjamin keberadaan id, createdAt, updatedAt, dan deletedAt secara universal.
 */
class BaseEntity {
  constructor(data = {}) {
    // Jika data.id tidak ada (data baru), generate UUID
    this.id = data.id || AppUtils.generateUUID(); 
    
    // Set createdAt saat pertama kali dibuat, jangan diubah setelahnya
    this.createdAt = data.createdAt || new Date().toISOString();
    
    // Set updatedAt, akan selalu diperbarui saat ada mutasi
    this.updatedAt = data.updatedAt || this.createdAt;
    
    // deletedAt diisi hanya jika terjadi soft delete
    this.deletedAt = data.deletedAt || null;
  }

  /**
   * Panggil metode ini sebelum menyimpan perubahan ke database
   */
  markAsUpdated() {
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Panggil metode ini saat melakukan soft delete
   */
  markAsDeleted() {
    this.deletedAt = new Date().toISOString();
  }

  /**
   * Mengembalikan representasi objek murni dari entity ini
   */
  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      // Properti tambahan akan di-merge oleh subclass
    };
  }
}