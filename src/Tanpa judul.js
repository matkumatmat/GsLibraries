// tests/RunAllTests.gs

function runAllTests() {
  console.log("🚀 MEMULAI PENGUJIAN MASSAL (STRESS TEST) FRAMEWORK...");
  const startTime = Date.now();
  
  try {
    testUtilities();
    testCoreArchitecture();
    testDatabaseLayer();
    
    console.log(`\n🎉 SELESAI! SEMUA TEST LULUS 100%!`);
    console.log(`⏱️ Total Waktu: ${(Date.now() - startTime) / 1000} detik.`);
  } catch (e) {
    console.error(`\n❌ TEST GAGAL BERANTAKAN: ${e.message}`);
  }
}

// ==========================================
// 1. TEST SUITE UTILITIES
// ==========================================
function testUtilities() {
  TestRunner.runSuite("Utility Classes", {
    "StringUtils: Slugify Normalization": () => {
      const hasil = StringUtils.slugify("  Vaksin COVID-19 Tahap 1!  ");
      Assert.equal(hasil, "vaksin-covid-19-tahap-1", "Slugify gagal membuang spasi/simbol");
    },
    
    "NumberUtils: Parsing Angka Campur Aduk": () => {
      const formatIndo = NumberUtils.parseNumber("Rp 1.500.000,50");
      Assert.equal(formatIndo, 1500000.5, "Gagal parsing format Indonesia");
    },
    
    "ArrayUtils: Chunking Data (Pecah Array)": () => {
      const data = [1, 2, 3, 4, 5];
      const chunked = ArrayUtils.chunk(data, 2);
      Assert.equal(chunked.length, 3, "Harusnya jadi 3 potongan");
      Assert.equal(chunked[0].length, 2, "Potongan pertama harusnya isi 2");
    },
    
    "ObjectUtils: Pick Fields (Partial Copy)": () => {
      const payload = { id: 1, nama: "Paracetamol", password: "rahasia_banget", role: "admin" };
      const aman = ObjectUtils.pick(payload, ['id', 'nama']);
      Assert.equal(aman.password, undefined, "Password harusnya ga ikut ke-copy");
      Assert.equal(aman.nama, "Paracetamol", "Nama harusnya ke-copy");
    }
  });
}

// ==========================================
// 2. TEST SUITE CORE ARCHITECTURE
// ==========================================
function testCoreArchitecture() {
  TestRunner.runSuite("Core Architecture", {
    "Result Monad: Success Case": () => {
      const res = Result.ok("Data Aman");
      Assert.isTrue(res.isOk(), "Harusnya bernilai true isOk()");
      Assert.equal(res.unwrap(), "Data Aman", "Gagal unwrap nilai");
    },
    
    "Result Monad: Fail Case": () => {
      const res = Result.fail(new AppError("Koneksi Putus"));
      Assert.isTrue(res.isFail(), "Harusnya bernilai true isFail()");
      Assert.throws(() => res.unwrap(), "Harusnya melempar error saat di-unwrap");
    },
    
    "Container DI: Binding & Resolve": () => {
      Container.bind('Engine', () => ({ nama: 'k-quant-engine' }));
      const engine = Container.make('Engine');
      Assert.equal(engine.nama, 'k-quant-engine', "Dependency Injection gagal mapping");
    },
    
    "EventBus: Pub/Sub Listener": () => {
      let listenerJalan = false;
      class TestListener { static handle(payload) { listenerJalan = payload; } }
      
      EventBus.on('TEST_EVENT', TestListener);
      EventBus.emit('TEST_EVENT', true);
      
      Assert.isTrue(listenerJalan, "Listener tidak tereksekusi oleh EventBus");
    }
  });
}

// ==========================================
// 3. TEST SUITE DATABASE & REPOSITORY
// ==========================================
function testDatabaseLayer() {
  TestRunner.runSuite("Database & Repository (Mock)", {
    "MockSheet & BaseRepo: CRUD Skenario": () => {
      // 1. Siapkan DB bohongan (di memory)
      const mockData = [
        ['id', 'nama_item', 'stok', 'status'], // Row 1 (Header)
        ['ITEM-1', 'Vaksin Sinovac', 100, 'AMAN'],
        ['ITEM-2', 'Vaksin Moderna', 5, 'KRITIS']
      ];
      const driver = new MockSheetDriver(mockData);
      
      // 2. Pasang BaseRepo ke Driver bohongan
      const repo = new BaseRepo(driver, ['id', 'nama_item', 'stok', 'status'], 2);
      
      // TEST READ ALL
      const semuaData = repo.all();
      Assert.equal(semuaData.length, 2, "Harusnya ada 2 baris data");
      
      // TEST FIND BY ID
      const item2 = repo.findById('ITEM-2');
      Assert.equal(item2.nama_item, 'Vaksin Moderna', "Gagal nemuin data by ID");
      
      // TEST UPDATE
      repo.update('ITEM-1', { stok: 80, status: 'WARNING' });
      const updatedItem = repo.findById('ITEM-1');
      Assert.equal(updatedItem.stok, 80, "Stok gagal diupdate");
      Assert.equal(updatedItem.status, 'WARNING', "Status gagal diupdate");
      
      // TEST QUERY BUILDER (Filter)
      const hasilFilter = repo.query().where('stok', '<', 50).get();
      Assert.equal(hasilFilter.length, 1, "QueryBuilder gagal memfilter stok < 50");
      Assert.equal(hasilFilter[0].id, 'ITEM-2', "Salah narik data hasil filter");
    }
  });
}