// src/server/infrasctructure/cache/_CacheManager.js

/**
 * CacheManager
 * Single responsibility: Pengelola caching level bisnis (Versioning, Prefix, Invalidation).
 */
class CacheManager {
  /**
   * Menghasilkan key yang unik dengan mempertimbangkan versi dari suatu grup.
   */
  static _generateKey(group, identifier) {
    // Tarik versi dari PropertiesService. Jika belum ada, anggap versi 1.
    const version = EnvConfig.get(`CACHE_VER_${group.toUpperCase()}`, '1');
    return `FW_${group}_V${version}_${identifier}`;
  }

  static get(group, identifier) {
    return CacheDriver.get(this._generateKey(group, identifier));
  }

  static set(group, identifier, value, ttl) {
    CacheDriver.set(this._generateKey(group, identifier), value, ttl);
  }

  static delete(group, identifier) {
    CacheDriver.delete(this._generateKey(group, identifier));
  }

  /**
   * Membatalkan (Invalidate) semua cache dalam suatu grup dengan cara menaikkan versinya.
   * Sangat efisien, O(1) time complexity.
   */
  static invalidate(group) {
    const propKey = `CACHE_VER_${group.toUpperCase()}`;
    const currentVersion = parseInt(EnvConfig.get(propKey, '1'));
    
    // Tulis langsung ke PropertiesService untuk bump versi
    PropertiesService.getScriptProperties().setProperty(propKey, (currentVersion + 1).toString());
    
    // Reset cache EnvConfig agar membaca properties terbaru
    EnvConfig._config = null; 
  }

  /**
   * Bump master version untuk menghancurkan SEMUA cache dalam framework.
   */
  static flush() {
    this.invalidate('GLOBAL_MASTER');
  }
}