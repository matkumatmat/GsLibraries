// src/main/server/config/SetupScript.js

/**
 * STEP 2: Inisialisasi Environment & Database (Framework-Native)
 */
function SETUP_2_DATABASE_INIT() {
  // 1. Buat Spreadsheet Baru
  const ss = SpreadsheetApp.create(AppConfig.app.name + " _DB");
  const ssId = ss.getId();

  // 2. Gunakan ConfigManager untuk menyuntikkan data ke PropertiesService
  // ConfigManager.set akan memastikan data tersimpan secara permanen
  ConfigManager.set('APP_ENV', 'dev');
  ConfigManager.set('AUTH_SALT', 'R4h4s14B4ng3t2026');
  ConfigManager.set('SHEET_DB_ID', ssId);
  ConfigManager.set('LOG_SHEET_ID', ssId);
  ConfigManager.set('CACHE_VER_GLOBAL_MASTER', '1');

  Logger.info(`Config diset via ConfigManager. Spreadsheet: ${ss.getUrl()}`);

  // 3. Jalankan Migrasi
  // SheetDriver sekarang bisa mengambil ID dari ConfigManager secara otomatis
  const migrationDriver = new SheetDriver(ssId); 
  const runner = new MigrationRunner(migrationDriver);
  
  runner.addMigration(new CreateAssetsTable());
  runner.run();

  Logger.info("Migrasi database sukses menggunakan infrastruktur framework.");
}