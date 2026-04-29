// src/server/domain/_BaseDto.js

/**
 * BaseDto
 * Single responsibility: Cetak biru untuk Data Transfer Object.
 * Mengisolasi bentuk data request/response agar tidak terikat langsung dengan skema database.
 */
class BaseDto {
  /**
   * Mengubah payload mentah dari request menjadi object DTO yang bersih.
   */
  static fromRequest(payload) {
    return payload; // Override di subclass
  }

  /**
   * Mengubah entity/model database menjadi format response yang aman untuk UI.
   */
  static toResponse(entity) {
    return entity; // Override di subclass (Misal: hide password, format tanggal)
  }

  /**
   * Format response untuk list/array of entities.
   */
  static toResponseList(entities) {
    return entities.map(entity => this.toResponse(entity));
  }
}