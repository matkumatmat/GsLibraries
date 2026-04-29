// // src/main/server/config/AppConfig.js

// /**
//  * AppConfig
//  * Menyimpan hierarki konfigurasi layaknya YAML/JSON,
//  * namun secara dinamis dibaca dari PropertiesService untuk menghindari hardcode.
//  */
// class AppConfig {
//   static get(key, defaultValue = null) {
//     try {
//       const props = PropertiesService.getScriptProperties();
//       // Seluruh app config disimpan sebagai 1 string JSON pada key APP_CONFIG
//       const configStr = props.getProperty('APP_CONFIG');
//       if (!configStr) return defaultValue;

//       const config = JSON.parse(configStr);

//       // Mendukung dot-notation untuk nested key (misal: "workspace.drive.folderId")
//       const keys = key.split('.');
//       let current = config;
//       for (const k of keys) {
//         if (current === undefined || current === null) return defaultValue;
//         current = current[k];
//       }
//       return current !== undefined ? current : defaultValue;
//     } catch (e) {
//       Logger.error("Gagal membaca AppConfig", e);
//       return defaultValue;
//     }
//   }

//   static all() {
//     try {
//       const props = PropertiesService.getScriptProperties();
//       const configStr = props.getProperty('APP_CONFIG');
//       return configStr ? JSON.parse(configStr) : {};
//     } catch (e) {
//       return {};
//     }
//   }
// }
