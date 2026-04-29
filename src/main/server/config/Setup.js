// src/main/server/config/Setup.js

/**
 * Setup.js
 * Inisialisasi awal. Akan menyuntikkan ID dan konfigurasi 
 * menggunakan ConfigManager bawaan dari _module.
 */
function initDriveProperties() {
  // Gunakan metode native dari _ConfigManager module
  ConfigManager.setMultiple({
    'DRIVE_TARGET_FOLDER_ID': '15EJnHvEXvm9a0cGgzR8ZAR4E56ce3iwT',
    'DRIVE_LOG_FILE_NAME': 'Application_File_Logs',
    'EMAIL_ADMIN': Session.getEffectiveUser().getEmail() || 'admin@example.com',
    'EMAIL_LOG_PREFIX': '[DRIVE LOG]'
  });

  Logger.info("✅ Konfigurasi Workspace Drive sukses disimpan via ConfigManager!");
}