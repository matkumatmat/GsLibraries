// src/server/_EnvConfig.js
class EnvConfig {
  static _load() {
    if (!EnvConfig._config) {
      // Prioritas 1: Runtime Config (misal di-inject via JSON saat boot)
      let customConfig = {};
      if (EnvConfig._runtimeConfig) {
        customConfig = EnvConfig._runtimeConfig;
      }

      // Prioritas 2: Script Properties (Native GAS)
      const props = PropertiesService.getScriptProperties().getProperties();
      
      // Prioritas 3: Defaults
      const defaults = {
        APP_ENV: 'dev',
        AUTH_SALT: 'default_framework_salt_999'
      };

      // Gabungkan. customConfig akan me-replace props, props me-replace defaults
      EnvConfig._config = Object.assign({}, defaults, props, customConfig);
    }
  }

  // Fungsi baru untuk mendukung visimu menginjeksi JSON config di runtime
  static loadFromJson(jsonObject) {
     EnvConfig._runtimeConfig = jsonObject;
     this.reload(); // Paksa build ulang config
  }

  // Fungsi reload untuk mensupport ConfigManager
  static reload() {
      EnvConfig._config = null; // Clear state
      this._load(); // Build ulang
  }

  static get(key, fallback = null) {
    EnvConfig._load();
    const val = EnvConfig._config[key];
    return (val !== undefined && val !== '') ? val : fallback;
  }

  static all() {
    EnvConfig._load();
    return EnvConfig._config;
  }
}
EnvConfig._config = null; 
EnvConfig._runtimeConfig = null; // Tambahan state untuk menyimpan custom JSON