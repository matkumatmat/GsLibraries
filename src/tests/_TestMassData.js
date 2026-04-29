// tests/TestMassiveData.gs

function testStressDataProcessing() {
  console.log("🚀 MENGUJI PEMROSESAN DATA MASIF (STRESS TEST)...");
  const startTime = Date.now();

  // ===============================================
  // 1. GENERATE DATA BOHONGAN (KOTOR)
  // ===============================================
  const TOTAL_RECORDS = 100000; // Kita hajar 100 ribu baris data!
  console.log(`\n1️⃣ Sedang men-generate ${TOTAL_RECORDS} baris data kotor...`);
  
  const rawData = [];
  for (let i = 0; i < TOTAL_RECORDS; i++) {
    rawData.push({
      // Sengaja kotor: banyak spasi, huruf besar-kecil berantakan
      nama: `   Vaksin_COVID_${i}   `, 
      // Sengaja kotor: format angka jadi string pake simbol
      stok: `Rp ${Math.floor(Math.random() * 500)}.00`, 
      // Sengaja kotor: ada spasi
      status: i % 2 === 0 ? ' aman ' : ' KRITIS ' 
    });
  }
  const genTime = Date.now();
  console.log(`✅ Generate selesai dalam ${(genTime - startTime) / 1000} detik.`);

  // ===============================================
  // 2. CLEANING & TRIMMING (Pake Utilities kita)
  // ===============================================
  console.log(`\n2️⃣ Mulai pembersihan (Trimming & Parsing Number)...`);
  
  const cleanedData = rawData.map(item => ({
    nama: StringUtils.normalizeWhitespace(item.nama),
    stok: NumberUtils.parseNumber(item.stok),
    status: StringUtils.normalizeWhitespace(item.status).toUpperCase()
  }));

  const cleanTime = Date.now();
  console.log(`✅ Pembersihan 100.000 data selesai dalam ${(cleanTime - genTime) / 1000} detik.`);
  
  // Validasi sampel baris pertama untuk ngebuktiin bersihnya
  Assert.equal(cleanedData[0].nama, "Vaksin_COVID_0", "Gagal membersihkan spasi nama!");
  Assert.isTrue(typeof cleanedData[0].stok === 'number', "Gagal convert stok ke angka murni!");

  // ===============================================
  // 3. GROUPING / MENYATUKAN DATA (Pake ArrayUtils)
  // ===============================================
  console.log(`\n3️⃣ Mengelompokkan data berdasarkan status (Grouping)...`);
  
  const grouped = ArrayUtils.groupBy(cleanedData, 'status');
  
  const groupTime = Date.now();
  console.log(`✅ Data berhasil disatukan! (AMAN: ${grouped['AMAN'].length}, KRITIS: ${grouped['KRITIS'].length})`);
  console.log(`⏱️ Waktu grouping: ${(groupTime - cleanTime) / 1000} detik.`);

  // ===============================================
  // 4. CHUNKING (Pecah array buat persiapan Job Runner)
  // ===============================================
  console.log(`\n4️⃣ Memecah array raksasa jadi potongan kecil (Chunking)...`);
  
  const CHUNK_SIZE = 2500; // Kita pecah per 2500 baris
  const chunks = AppUtils.chunkArray(cleanedData, CHUNK_SIZE);
  
  const chunkTime = Date.now();
  console.log(`✅ Berhasil dipecah jadi ${chunks.length} potongan.`);
  console.log(`   (Tiap potongan berisi ${chunks[0].length} baris).`);
  console.log(`⏱️ Waktu pemecahan: ${(chunkTime - groupTime) / 1000} detik.`);

  // ===============================================
  console.log(`\n🎉 STRESS TEST DATA MASIF SUKSES TANPA TIMEOUT!`);
  console.log(`⏱️ TOTAL WAKTU KESELURUHAN: ${(Date.now() - startTime) / 1000} detik.`);
}