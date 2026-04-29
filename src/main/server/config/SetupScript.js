// src/main/server/config/SetupScript.js

/**
 * STEP 2: Inisialisasi Environment & Database (Framework-Native)
 */
function SETUP_2_DATABASE_INIT() {
  const appName = ConfigManager.get('APP_NAME', 'MyApp');
  
  // 1. Buat Spreadsheet Baru (Akan berada di Root My Drive)
  const ss = SpreadsheetApp.create(appName + " _DB");
  const ssId = ss.getId();

  // 2. Pindahkan ke Folder Target agar tidak "hilang" di root
  const targetFolderId = "15EJnHvEXvm9a0cGgzR8ZAR4E56ce3iwT";
  DriveManager.moveItem(ssId, targetFolderId, true);

  // 3. Gunakan ConfigManager untuk menyuntikkan data ke PropertiesService
  ConfigManager.set('APP_ENV', 'dev');
  ConfigManager.set('AUTH_SALT', 'R4h4s14B4ng3t2026');
  ConfigManager.set('SHEET_DB_ID', ssId);
  ConfigManager.set('LOG_SHEET_ID', ssId);
  ConfigManager.set('CACHE_VER_GLOBAL_MASTER', '1');

  Logger.info(`Config diset via ConfigManager. Spreadsheet: ${ss.getUrl()}`);

  // 4. Jalankan Migrasi (Statis)
  MigrationRunner.run([
    CreateAssetsTable
  ]);

  Logger.info("Migrasi database sukses menggunakan infrastruktur framework.");
}