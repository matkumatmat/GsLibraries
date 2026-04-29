// src/main/main.js

// ==========================================
// 1. BOOTSTRAPPING (Menghidupkan Mesin)
// ==========================================
function bootApp() {
  // Kernel.boot akan otomatis membaca PostRegistry (karena GAS menggabungkan semua scope)
  const router = Kernel.boot([
    // 1. Dependency Injection setup
    () => {
      if (typeof Container !== 'undefined') {
        Container.singleton('DriveAdapter', () => new DriveAdapter());
        Container.singleton('SpreadsheetLogAdapter', () => new SpreadsheetLogAdapter());

        Container.singleton('FileManagementService', () => {
          const driveRepo = Container.make('DriveAdapter');
          const logRepo = Container.make('SpreadsheetLogAdapter');
          return new FileManagementService(driveRepo, logRepo);
        });

        Container.singleton('FileController', () => {
          const service = Container.make('FileManagementService');
          return new FileController(service);
        });
      }
    },

    // 2. Routing Setup
    () => {
      if (typeof Router !== 'undefined') {
        Router.post('upload', 'FileController', [], []);
        // Kita menggunakan factory custom untuk method controller tertentu
        Router._postRoutes.set('delete', { factory: () => Container.make('FileController'), method: 'delete' });

        // Router default GET method='execute', jadi kita inject custom factory untuk list()
        Router._getRoutes.set('list', { factory: () => Container.make('FileController'), method: 'list' });
      }
    },

    // 3. Event Listener setup (jika ada)
    () => {
      if (typeof EventRegistry !== 'undefined' && typeof EventBus !== 'undefined') {
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
    return router.dispatchGet(e);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const router = bootApp();
    return router.dispatchPost(e);
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