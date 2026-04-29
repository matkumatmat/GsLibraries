// tests/TestApiEndpoint.gs

function testApiEndpoint() {
  console.log("🚀 MENGUJI JANTUNG API & MIDDLEWARE (ROUTER)...");

  // 1. Bikin Service Bohongan Buat Nerima Data
  class DummyApiService {
    execute(payload) {
      return { status: "SUKSES_MASUK_DB", receivedData: payload };
    }
  }
  Container.bind('DummyApiService', () => new DummyApiService());

  // 2. Setup Route POST & Middleware Validasi
  // Anggap ini skema ketat buat nerima data stok lapangan
  const schemaVaksin = {
    nama_vaksin: { type: 'string', required: true },
    jumlah: { type: 'number', required: true }
  };

  Router.post('inputStok', 'DummyApiService', [ValidationMiddleware]);
  // Inject skema ke route (karena ValidationMiddleware bakal ngecek ini)
  Router._postRoutes.get('inputStok').schema = schemaVaksin;

  // ===============================================
  // 3. TEST POSITIF (Payload Benar)
  // ===============================================
  console.log("\n-> Test 1: Kirim Payload Valid (Ada sisipan data liar)");
  const eventValid = {
    postData: {
      contents: JSON.stringify({
        action: 'inputStok',
        data: { nama_vaksin: 'Moderna', jumlah: 50, field_hacker: 'DROP TABLE' }
      })
    }
  };

  try {
    const res = Router.dispatchPost(eventValid);
    console.log("✅ Response Service:", JSON.stringify(res));
    
    if (res.receivedData.field_hacker) {
      throw new Error("Waduh, data liar ga ke-filter!");
    }
    console.log("✅ Data liar 'field_hacker' SUKSES DIBUANG oleh ValidationMiddleware!");
  } catch(e) {
    console.error("❌ Test 1 Gagal:", e.message);
  }

  // ===============================================
  // 4. TEST NEGATIF (Payload Salah)
  // ===============================================
  console.log("\n-> Test 2: Kirim Payload Ngawur (Lupa ngisi field 'jumlah')");
  const eventInvalid = {
    postData: {
      contents: JSON.stringify({
        action: 'inputStok',
        data: { nama_vaksin: 'Sinovac' } // Sengaja ga ada jumlah
      })
    }
  };

  try {
    Router.dispatchPost(eventInvalid);
    console.error("❌ Test 2 Gagal: Harusnya ketangkep ValidationMiddleware!");
  } catch(e) {
    console.log(`✅ SUKSES DITOLAK Middleware! Pesan: ${e.message}`);
    console.log(`🔍 Detail Error dari Validator: ${JSON.stringify(e.details)}`);
  }
}