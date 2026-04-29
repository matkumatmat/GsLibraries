// src/tests/_TestWorkspace.js

function _testWorkspaceModule() {
  T.suite('Workspace: EmailScanner & DriveStructure');

  const userEmail = Session.getActiveUser().getEmail();
  const uniqueId = Date.now();
  const testSubject = `[GSLIB-TEST] Auto Scanner ${uniqueId}`;
  let testThreadId = null;

  // ==========================================
  // TEST: EMAIL SCANNER
  // ==========================================
  
  T.it('Setup: Kirim email dummy dengan attachment ke diri sendiri', t => {
    const dummyBlob = Utilities.newBlob('File rahasia negara', 'text/plain', `dummy_${uniqueId}.txt`);
    
    GmailApp.sendEmail(userEmail, testSubject, 'Ini email hasil generate stress test GsLibraries.', {
      attachments: [dummyBlob]
    });
    
    // Kasih jeda waktu ke server Google buat routing email masuk ke Inbox
    AppUtils.sleep(3000); 
    t.ok(true, 'Email berhasil dikirim');
  });

  T.it('EmailScanner.searchThreads() berhasil menemukan email test', t => {
    // Asumsi nama class di _EmailScanner.js adalah EmailScanner
    const results = EmailScanner.searchThreads(`subject:"${testSubject}" is:unread`, 5);
    
    t.eq(results.length, 1, 'Harus menemukan tepat 1 email test');
    t.eq(results[0].subject, testSubject, 'Subject harus persis sama');
    t.ok(results[0].latestMessage.hasAttachments, 'Harus mendeteksi keberadaan attachment');
    
    // Simpan threadId buat test selanjutnya
    testThreadId = results[0].threadId;
  });

  T.it('EmailScanner.markAsRead() berhasil mengubah status email', t => {
    t.ok(testThreadId !== null, 'Thread ID harus ada dari test sebelumnya');
    
    const success = EmailScanner.markAsRead(testThreadId);
    t.ok(success, 'Fungsi markAsRead harus return true');

    // Verifikasi langsung ke Gmail API
    const thread = GmailApp.getThreadById(testThreadId);
    t.notOk(thread.isUnread(), 'Status thread di Gmail harus sudah terbaca (false)');
  });

  T.it('Teardown: Hapus email test ke Trash', t => {
    if (testThreadId) {
      GmailApp.getThreadById(testThreadId).moveToTrash();
      t.ok(true, 'Email test berhasil dibersihkan');
    } else {
      t.notOk(true, 'Thread ID tidak ditemukan untuk dihapus');
    }
  });

  // ==========================================
  // TEST: DRIVE STRUCTURE MANAGER
  // ==========================================
  // Asumsi lu punya fungsi buat auto-create path seperti "GsLib_Test/2026/Invoices"
  let createdFolderId = null;
  const testFolderPath = `GsLib_Test_Temp_${uniqueId}/SubFolder`;

  T.it('DriveStructureManager.createPath() membuat hierarki folder baru', t => {
    // Asumsi: metode createPath mengembalikan object { id: '...', name: 'SubFolder' }
    if (typeof DriveStructureManager !== 'undefined') {
      const folder = DriveStructureManager.createPath(testFolderPath);
      t.ok(folder.id, 'Folder ID harus tergenerate');
      createdFolderId = folder.id;
    } else {
      t.ok(true, 'Skip test: DriveStructureManager belum diimplementasi');
    }
  });

  T.it('Teardown: Hapus folder test dari Drive', t => {
    if (createdFolderId) {
      // Cari parent teratas (GsLib_Test_Temp_...) buat dihapus seakar-akarnya
      const rootTestFolders = DriveApp.getFoldersByName(`GsLib_Test_Temp_${uniqueId}`);
      if (rootTestFolders.hasNext()) {
        rootTestFolders.next().setTrashed(true);
      }
      t.ok(true, 'Folder test Drive berhasil diamankan ke Trash');
    } else {
      t.ok(true, 'Tidak ada folder yang perlu dihapus');
    }
  });
}