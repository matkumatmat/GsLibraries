// src/server/infrastructure/config/_ConfigManager.js

class ConfigManager {
  static set(key, value) {
    PropertiesService.getScriptProperties().setProperty(key, value);
    // Panggil method reload di EnvConfig yang kita bikin di Bagian 1
    if (typeof EnvConfig.reload === 'function') {
      EnvConfig.reload();
    }
  }

  static get(key, fallback = null) {
    return EnvConfig.get(key, fallback);
  }

  static delete(key) {
    PropertiesService.getScriptProperties().deleteProperty(key);
    if (typeof EnvConfig.reload === 'function') {
      EnvConfig.reload();
    }
  }

  static setMultiple(propertiesObj) {
    PropertiesService.getScriptProperties().setProperties(propertiesObj);
    if (typeof EnvConfig.reload === 'function') {
      EnvConfig.reload();
    }
  }
}