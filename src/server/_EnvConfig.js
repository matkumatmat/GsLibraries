// src/server/infrastructure/EnvConfig.js

/**
 * EnvConfig
 * Single responsibility: Membaca dan men-cache SEMUA konfigurasi dari PropertiesService GAS.
 * Bersifat dinamis. Tidak ada hardcode key. Tambah key di UI GAS = langsung bisa dipakai.
 */
class EnvConfig {
  static _config = null;

  /**
   * Melakukan lazy-load semua properties dari GAS dalam satu kali panggil.
   */
  static _load() {
    if (!this._config) {
      // Tarik SEMUA key-value dari server Google sekaligus
      const props = PropertiesService.getScriptProperties().getProperties();
      
      // Default framework fallbacks (akan tertimpa kalau key ada di properties)
      const defaults = {
        APP_ENV: 'dev',
        AUTH_SALT: 'default_framework_salt_999'
      };

      this._config = Object.assign(defaults, props);
    }
  }

  /**
   * Mengambil value berdasarkan key. Mendukung unlimited key tanpa perlu hardcode.
   * @param {string} key - Nama property (contoh: 'MAIN_SHEET_ID')
   * @param {*} fallback - Nilai default jika key tidak ditemukan
   */
  static get(key, fallback = null) {
    this._load();
    return this._config[key] !== undefined && this._config[key] !== '' ? this._config[key] : fallback;
  }

  /**
   * Mengembalikan seluruh object konfigurasi (berguna untuk debugging)
   */
  static all() {
    this._load();
    return this._config;
  }
}