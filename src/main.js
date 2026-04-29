// src/main/main.js

// ==========================================
// 1. BOOTSTRAPPING (Menghidupkan Mesin)
// ==========================================
function bootApp() {
  // Kernel.boot akan otomatis membaca PostRegistry (karena GAS menggabungkan semua scope)
  const router = Kernel.boot([
    // Fungsi ini mendaftarkan semua listener dari EventRegistry ke EventBus
    () => {
      if (typeof EventRegistry !== 'undefined') {
        for (const [eventName, listeners] of Object.entries(EventRegistry)) {
          listeners.forEach(ListenerClass => EventBus.on(eventName, ListenerClass));
        }
      }
    }
  ]);
  
  return router;
}

// ==========================================
// 2. HTTP HANDLERS (Titik Masuk API/Web)
// ==========================================
function doGet(e) {
  try {
    const router = bootApp();
    return router.handleGet(e);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const router = bootApp();
    return router.handlePost(e);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. BACKGROUND JOBS HANDLER
// ==========================================
function jobEntryTrigger() {
  const props = PropertiesService.getScriptProperties();
  const activeJobName = props.getProperty(JobRunner.ACTIVE_JOB_KEY);
  
  // (Nanti buat JobRegistry di folder ports/ kalau kamu butuh fitur Background Job)
  if (activeJobName && typeof JobRegistry !== 'undefined' && JobRegistry[activeJobName]) {
    JobRunner.execute(JobRegistry[activeJobName]);
  }
}