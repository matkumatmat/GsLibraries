function testDriveTree() {
  const startTime = Date.now();
  
  // Parameter: (folderId, maxDepth, showFiles)
  // null = Root
  // 1 = Kedalaman 1 lapis aja
  // false = Jangan tampilin file, folder doang
  const treeOutput = DriveStructureManager.getTree(null, 1, false);
  
  console.log("\n" + treeOutput);
  console.log(`⏱️ Selesai dalam ${(Date.now() - startTime) / 1000} detik.`);
}