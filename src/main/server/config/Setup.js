// src/main/server/config/Setup.js

/**
 * Setup.js
 * Skrip ini ditujukan untuk dijalankan SATU KALI oleh admin (via GAS Editor)
 * untuk menyimpan konfigurasi ke PropertiesService, sehingga kode aplikasi
 * tidak mengandung hardcoded credentials/ID.
 */
function initProperties() {
  const config = {
    workspace: {
      drive: {
        targetFolderId: "15EJnHvEXvm9a0cGgzR8ZAR4E56ce3iwT"
      },
      spreadsheet: {
        logFileName: "Application_File_Logs" // Nama file log yang akan di-generate jika belum ada
      }
    },
    email: {
      adminAddress: Session.getEffectiveUser().getEmail() || "admin@example.com",
      logSubjectPrefix: "[DRIVE LOG]"
    }
  };

  PropertiesService.getScriptProperties().setProperty('APP_CONFIG', JSON.stringify(config));
  Logger.log("✅ AppConfig berhasil di-set ke PropertiesService!");
}
