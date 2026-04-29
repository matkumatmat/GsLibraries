// tests/mock_gas_test.js

/**
 * Ini adalah script Node.js sederhana untuk membuktikan arsitektur port/adapter bekerja
 * dengan melakukan mock pada fungsi GAS global yang tidak ada di Node.
 */

global.Logger = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => {
      if (key === 'APP_CONFIG') {
        return JSON.stringify({
          workspace: {
            drive: { targetFolderId: "15EJnHvEXvm9a0cGgzR8ZAR4E56ce3iwT" },
            spreadsheet: { logFileName: "Mock_Logs" }
          },
          email: { adminAddress: "admin@example.com", logSubjectPrefix: "[MOCK]" }
        });
      }
      return null;
    }
  })
};

// Mock _DriveManager
global.DriveManager = {
  uploadBase64: (base64, fileName, folderId) => {
    console.log(`[MOCK] Uploading ${fileName} to folder ${folderId}`);
    return { id: "mock_id_123", name: fileName, url: "http://mock-url", size: 1024 };
  },
  getFileInfo: (fileId) => ({ id: fileId, name: "mock_file.txt" }),
  trashItem: (fileId, isFile) => { console.log(`[MOCK] Trashing ${fileId}`); return true; },
  getFolder: (folderId) => ({
    getFiles: () => {
      let count = 0;
      return {
        hasNext: () => count++ < 1,
        next: () => ({
          getId: () => "mock_id_123",
          getName: () => "mock_file.txt",
          getUrl: () => "http://mock-url",
          getSize: () => 1024,
          getLastUpdated: () => ({ toISOString: () => new Date().toISOString() })
        })
      };
    },
    searchFiles: () => ({ hasNext: () => true, next: () => ({ getId: () => "mock_ss_id" }) })
  }),
  moveItem: () => {}
};

// Mock SpreadsheetApp
global.SpreadsheetApp = {
  openById: () => ({
    getSheetByName: () => ({
      appendRow: (row) => console.log(`[MOCK SS] Append row: ${row}`),
      getDataRange: () => ({ getValues: () => [ ["Header"], ["Log1"] ] })
    }),
    getActiveSheet: () => ({ appendRow: () => {} })
  }),
  create: () => ({ getId: () => "mock_ss_id", getActiveSheet: () => ({ setName:()=>{}, appendRow:()=>{}, getRange:()=>({setFontWeight:()=>{}}) }) })
};

// Mock Mailer
global.Mailer = {
  send: (params) => {
    console.log(`[MOCK MAILER] Mengirim email ke ${params.to} dengan subject: ${params.subject}`);
  }
};

const fs = require('fs');
const vm = require('vm');

// Buat context khusus
const context = vm.createContext(global);

// Jalankan file-file secara berurutan dalam context yang sama
const files = [
  './src/main/server/config/AppConfig.js',
  './src/main/server/ports/DriveFileRepositoryPort.js',
  './src/main/server/ports/FileLogRepositoryPort.js',
  './src/main/server/core/FileManagementService.js',
  './src/main/server/adapters/DriveAdapter.js',
  './src/main/server/adapters/SpreadsheetLogAdapter.js',
  './src/main/server/controllers/FileController.js'
];

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  vm.runInContext(code, context, { filename: file });
});

// Test Instansiasi dan Logic
vm.runInContext(`
  try {
    console.log("=== MEMULAI TEST ===");
    const driveRepo = new DriveAdapter();
    const logRepo = new SpreadsheetLogAdapter();
    const service = new FileManagementService(driveRepo, logRepo);
    const controller = new FileController(service);

    console.log("\\n--- TEST UPLOAD ---");
    const uploadRes = controller.upload({
      base64: "data:text/plain;base64,aGFsbw==",
      fileName: "hello.txt",
      mimeType: "text/plain"
    });
    console.log(uploadRes);

    console.log("\\n--- TEST LIST ---");
    const listRes = controller.list();
    console.log(listRes);

    console.log("\\n--- TEST DELETE ---");
    const deleteRes = controller.delete({ fileId: "mock_id_123" });
    console.log(deleteRes);

    console.log("\\n=== TEST BERHASIL ===");
  } catch (e) {
    console.error("Test Gagal:", e);
  }
`, context);
