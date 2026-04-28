function testDriveTree() {
  // AWAS: Kalau Drive lu isinya ratusan ribu file, jangan pakai Root!
  // Mending masukin ID folder spesifik dulu buat testing.
  // Contoh: const folderId = "1A2B3C4D5E6F7G8H9I0J"; 
  const folderId = null; // null = Root Drive
  
  const startTime = Date.now();
  
  try {
    // Kalau Logger lu belum di-inject (karena belum nge-boot Kernel), 
    // pake console.log bawaan GAS aja dulu buat testing murni.
    console.log("Memindai Drive...");
    
    const treeOutput = DriveStructureManager.getTree(folderId);
    
    console.log("\n" + treeOutput);
    
    const endTime = Date.now();
    console.log(`⏱️ Selesai dalam ${(endTime - startTime) / 1000} detik.`);
    
  } catch (e) {
    console.error("Gagal membaca Drive:", e.message);
  }
}