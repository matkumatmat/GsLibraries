// // src/main/main.js

// // ==========================================
// // 1. SETUP & PERMISSIONS
// // ==========================================
// /**
//  * Jalankan fungsi ini 1x dari Editor Apps Script saat deploy pertama
//  * untuk memancing semua pop-up izin (Drive, Gmail, dll).
//  */
// function SETUP_PERMISSIONS() {
//   const status = InitUtils.triggerPermissions();
//   console.log(status);
// }

// // ==========================================
// // 2. BOOTSTRAPPING (Menghidupkan Mesin)
// // ==========================================
// /**
//  * Fungsi internal untuk merakit framework sebelum request diproses.
//  */
// function bootApp() {
//   // Kernel.boot akan membaca DomainRegistry, PostRegistry, dan EventRegistry
//   // Lalu mengembalikan instance Router yang sudah siap tempur.
//   const router = Kernel.boot([
//     () => EventBootstrapper.boot() // Mendaftarkan semua Listener ke EventBus
//   ]);
  
//   return router;
// }

// // ==========================================
// // 3. HTTP HANDLERS (Titik Masuk API/Web)
// // ==========================================
// /**
//  * Menangkap request GET (Read data atau Load HTML)
//  */
// function doGet(e) {
//   try {
//     const router = bootApp();
//     return router.handleGet(e);
//   } catch (error) {
//     // Fallback darurat jika mesin gagal hidup
//     return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
//       .setMimeType(ContentService.MimeType.JSON);
//   }
// }

// /**
//  * Menangkap request POST (Mutasi data / API)
//  */
// function doPost(e) {
//   try {
//     const router = bootApp();
//     return router.handlePost(e);
//   } catch (error) {
//     return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
//       .setMimeType(ContentService.MimeType.JSON);
//   }
// }

// // ==========================================
// // 4. BACKGROUND JOBS HANDLER (Titik Masuk Trigger)
// // ==========================================
// /**
//  * Dipanggil otomatis oleh Time-driven trigger GAS saat melakukan "Resume"
//  * karena hampir menabrak limit 6 menit.
//  */
// function jobEntryTrigger() {
//   const props = PropertiesService.getScriptProperties();
//   const activeJobName = props.getProperty(JobRunner.ACTIVE_JOB_KEY);
  
//   // JobRegistry.js adalah file buatanmu sendiri di folder main/ 
//   // yang memetakan nama string ke Class Job-nya
//   if (activeJobName && JobRegistry[activeJobName]) {
//     JobRunner.execute(JobRegistry[activeJobName]);
//   }
// }