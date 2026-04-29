// src/main.js

function SETUP_PERMISSIONS() {
  const status = InitUtils.triggerPermissions();
  console.log(status);
}
// 1. Eksekusi Booting Kernel (Inject Dependencies)
function initializeApp() {
  // Inject LogRepository ke Logger agar Bug #4 & Arch #2 teratasi
  const logDriver = new SheetDriver(EnvConfig.get('SHEET_ID_LOGS'), 'SYSTEM_LOGS');
  const logRepo = new LogRepository(logDriver, WriteGate);
  Logger.setRepository(logRepo);
  
  Kernel.boot();
}

// 2. Entry Point GET murni via Router (Fix Bug #3)
// main.js (Di luar _module)
function doGet(e) {
  const router = Kernel.boot([
    () => EventBootstrapper.boot(), // Register event
    () => registerDependencies(),   // Register Container.bind(...)
    () => registerRoutes()          // Register Router.get(...)
  ]);
  return router.dispatchGet(e);
}

// 3. Entry Point POST murni via Router (Fix Bug #3)
function doPost(e) {
  const router = Kernel.boot([
    () => EventBootstrapper.boot(), // Register event
    () => registerDependencies(),   // Register Container.bind(...)
    () => registerRoutes()          // Register Router.post(...)
  ]);
  return router.dispatchPost(e);
}

// Job Entry Trigger
function jobEntryTrigger(e) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'jobEntryTrigger') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}