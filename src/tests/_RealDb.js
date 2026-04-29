// tests/TestRealDatabase.gs

function testRealSpreadsheetCRUD() {
  console.log("🚀 MEMULAI TEST REAL SPREADSHEET & MIGRASI...");
  const startTime = Date.now();
  
  // Pake ID Folder lu yang aman kemaren
  const folderId = '1C6SqOoGSHTn6GqjgRM3DedTub6Q3YvJj'; 
  
  try {
    // 1. Bikin file Spreadsheet baru beneran
    const ssName = "DB_TEST_VAKSIN_" + Date.now();
    const ss = SpreadsheetApp.create(ssName);
    const ssId = ss.getId();
    console.log(`1️⃣ Spreadsheet '${ssName}' berhasil dibuat!`);
    
    // Pindahkan ke folder target biar rapi (defaultnya GAS naruh di Root)
    const file = DriveApp.getFileById(ssId);
    const folder = DriveApp.getFolderById(folderId);
    file.moveTo(folder);
    console.log(`✅ Spreadsheet dipindah ke folder target.`);

    // 2. Test Migrasi Bikin Tabel
    console.log("\n2️⃣ Menjalankan migrasi bikin sheet MASTER_VAKSIN...");
    class CreateVaksinTableMigration extends BaseMigration {
      static up() {
        this.createTable(ssId, 'MASTER_VAKSIN', ['id', 'nama_item', 'stok', 'status', 'createdAt', 'updatedAt']);
      }
    }
    // Langsung eksekusi up()
    CreateVaksinTableMigration.up();
    console.log(`✅ Migrasi selesai (Tabel & Header terbuat).`);

    // 3. Test Real SheetDriver & BaseRepo
    console.log("\n3️⃣ Test operasi CRUD ke Spreadsheet asli...");
    
    // Pasang driver dan repo
    const driver = new SheetDriver(ssId, 'MASTER_VAKSIN');
    const repo = new BaseRepo(driver, ['id', 'nama_item', 'stok', 'status', 'createdAt', 'updatedAt'], 2);

    // CREATE
    console.log("-> Sedang insert 2 data baru...");
    repo.create({ id: 'VKS-001', nama_item: 'Vaksin Pfizer', stok: 150, status: 'AMAN' });
    repo.create({ id: 'VKS-002', nama_item: 'Vaksin Moderna', stok: 10, status: 'KRITIS' });
    console.log(`✅ Insert berhasil!`);

    // READ
    const data = repo.all();
    if (data.length === 2) {
      console.log(`✅ Read All berhasil (Ada ${data.length} baris).`);
    } else {
      throw new Error(`Read All gagal. Diharapkan 2, dapat ${data.length}`);
    }

    // UPDATE
    console.log("-> Sedang update stok Vaksin Pfizer...");
    repo.update('VKS-001', { stok: 145, status: 'WARNING' }); // Misal dipake 5
    
    const updated = repo.findById('VKS-001');
    if (updated.stok === 145 && updated.status === 'WARNING') {
      console.log(`✅ Update berhasil (Stok menjadi 145).`);
    } else {
      throw new Error(`Update gagal. Diharapkan 145, dapat ${updated.stok}`);
    }

    console.log(`\n🎉 TEST REAL SPREADSHEET SELESAI 100% GREEN!`);
    console.log(`⏱️ Waktu total: ${(Date.now() - startTime) / 1000} detik.`);
    console.log(`👉 BUKA FOLDER DRIVE LU, cek file '${ssName}' sekarang!`);

  } catch (e) {
    console.error(`\n❌ TEST GAGAL: ${e.message}`);
  }
}