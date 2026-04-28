// server/_EnvConfig.gs
class EnvConfig {
  static _load() {
    if (!EnvConfig._config) {
      const props = PropertiesService.getScriptProperties().getProperties();
      const defaults = {
        APP_ENV: 'dev',
        AUTH_SALT: 'default_framework_salt_999'
      };
      EnvConfig._config = Object.assign(defaults, props);
    }
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
EnvConfig._config = null; // <-- inisialisasi di luar class