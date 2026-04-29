// src/server/database/migrations/_MigrationRunner.js

/**
 * MigrationRunner
 * Single responsibility: Mengeksekusi antrean migrasi secara berurutan
 * dan mencatat versinya di PropertiesService agar tidak dijalankan dua kali.
 */
class MigrationRunner {
  static get STATE_KEY() { return 'MIGRATION_BATCH_VERSION'; }

  static run(migrationsArray) {
    const props = PropertiesService.getScriptProperties();
    const currentVersion = parseInt(props.getProperty(this.STATE_KEY) || '0');
    
    let successCount = 0;

    for (let i = currentVersion; i < migrationsArray.length; i++) {
      const MigrationClass = migrationsArray[i];
      try {
        Logger.info(`Menjalankan migrasi: ${MigrationClass.name}`);
        MigrationClass.up();
        
        // Catat keberhasilan
        successCount++;
        props.setProperty(this.STATE_KEY, (i + 1).toString());
      } catch (e) {
        Logger.error(`Gagal menjalankan migrasi ${MigrationClass.name}`, {}, e);
        throw new DatabaseError(`Migrasi berhenti di ${MigrationClass.name} karena error: ${e.message}`);
      }
    }

    return Result.ok(`Berhasil menjalankan ${successCount} migrasi baru.`);
  }

  static reset() {
    PropertiesService.getScriptProperties().deleteProperty(this.STATE_KEY);
    Logger.info('Status migrasi telah di-reset ke 0.');
  }
}