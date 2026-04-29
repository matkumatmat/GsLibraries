// src/main.js

function bootApp() {
  const router = Kernel.boot([
    // 1. Dependency Injection setup
    () => {
      if (typeof Container !== 'undefined') {
        Container.bind('DriveAdapter', () => new DriveAdapter());
        Container.bind('SpreadsheetLogAdapter', () => new SpreadsheetLogAdapter());
        
        Container.bind('FileManagementService', () => {
          const driveRepo = Container.make('DriveAdapter');
          const logRepo = Container.make('SpreadsheetLogAdapter');
          return new FileManagementService(driveRepo, logRepo);
        });

        // Karena _Router Anda butuh class yang punya fungsi execute(),
        // kita pecah controllernya menjadi 3 class mungil
        Container.bind('UploadController', () => {
          const service = Container.make('FileManagementService');
          return { execute: (payload) => (new FileController(service)).upload(payload) };
        });

        Container.bind('DeleteController', () => {
          const service = Container.make('FileManagementService');
          return { execute: (payload) => (new FileController(service)).delete(payload) };
        });

        Container.bind('ListController', () => {
          const service = Container.make('FileManagementService');
          return { execute: () => (new FileController(service)).list() };
        });
      }
    },
    
    // 2. Routing Setup (Menggunakan fungsi native dari _Router, jangan di-bypass)
    () => {
      if (typeof Router !== 'undefined') {
        Router.post('upload', 'UploadController', [], []);
        Router.post('delete', 'DeleteController', [], []);
        Router.get('list', 'ListController', []);
      }
    },

    // 3. Event Listener setup
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

function jobEntryTrigger() {
  const props = PropertiesService.getScriptProperties();
  const activeJobName = props.getProperty(JobRunner.ACTIVE_JOB_KEY);
  
  if (activeJobName && typeof JobRegistry !== 'undefined' && JobRegistry[activeJobName]) {
    JobRunner.execute(JobRegistry[activeJobName]);
  }
}