// src/server/utils/_InitUtils.js

/**
 * InitUtils
 * Utilitas untuk memancing Google memunculkan Consent Screen (Layar Izin)
 * saat pertama kali aplikasi di-setup oleh Client.
 */
class InitUtils {
  /**
   * Panggil fungsi ini dari main.js (cukup di-run 1x dari editor)
   */
  static triggerPermissions() {
    Logger.info("Memulai inisiasi izin sistem...");
    const results = { sukses: [], dilewati: [] };

    // 1. Identitas User (Wajib)
    try {
      const email = Session.getActiveUser().getEmail();
      results.sukses.push(`User Info (${email})`);
    } catch (e) { results.dilewati.push('User Info'); }

    // 2. Akses Eksternal / Webhook (Wajib jika ada fetch API)
    try {
      UrlFetchApp.fetch("https://google.com");
      results.sukses.push('External Request (UrlFetch)');
    } catch (e) { results.dilewati.push('External Request'); }

    // 3. Script Triggers (Penting untuk sistem Job/Queue)
    try {
      ScriptApp.getProjectTriggers();
      results.sukses.push('Script App (Triggers)');
    } catch (e) { results.dilewati.push('Script App'); }

    // 4. Google Drive
    try {
      DriveApp.getRootFolder();
      results.sukses.push('Google Drive');
    } catch (e) { results.dilewati.push('Google Drive'); }

    // 5. Google Sheets (Hanya jika terikat/dibutuhkan)
    try {
      SpreadsheetApp.getActive();
      results.sukses.push('Google Sheets');
    } catch (e) { results.dilewati.push('Google Sheets'); }

    // 6. Gmail
    try {
      GmailApp.getAliases();
      results.sukses.push('Gmail');
    } catch (e) { results.dilewati.push('Gmail'); }

    Logger.info("Inisiasi selesai.", results);
    return `Inisiasi Izin Selesai!\nBerhasil: ${results.sukses.join(', ')}\nDiabaikan (Tidak masuk scope): ${results.dilewati.join(', ')}`;
  }
}