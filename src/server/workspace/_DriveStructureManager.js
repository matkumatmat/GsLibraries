// src/server/workspace/drive/_DriveStructureManager.js

class DriveStructureManager {
  /**
   * Mengambil dan memformat isi folder menjadi representasi ASCII Tree.
   * @param {string} folderId - ID Folder (kosongkan untuk Root Drive)
   * @returns {string} String representasi tree
   */
  static getTree(folderId = null) {
    const rootFolder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    
    // Header tree
    let treeString = `📦 ${rootFolder.getName()}\n`;
    
    // Mulai rekursi
    treeString += this._buildTree(rootFolder, "");
    
    return treeString;
  }

  /**
   * Fungsi internal untuk rekursi (Deep Scan)
   */
  static _buildTree(folder, prefix) {
    let result = "";

    // Ambil semua folder & file
    const subFolders = folder.getFolders();
    const files = folder.getFiles();

    // Gabungkan jadi satu array biar bisa di-sort (Folder duluan, baru file)
    const items = [];
    while (subFolders.hasNext()) items.push({ type: 'folder', entity: subFolders.next() });
    while (files.hasNext()) items.push({ type: 'file', entity: files.next() });

    // Sorting alfabetis, prioritaskan folder
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.entity.getName().localeCompare(b.entity.getName());
    });

    // Iterasi untuk mencetak garis tree
    for (let i = 0; i < items.length; i++) {
      const isLast = i === items.length - 1;
      const item = items[i];
      
      const pointer = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";

      if (item.type === 'folder') {
        result += `${prefix}${pointer}📁 ${item.entity.getName()}\n`;
        // Panggil fungsi ini lagi untuk masuk ke dalam sub-folder
        result += this._buildTree(item.entity, prefix + childPrefix);
      } else {
        result += `${prefix}${pointer}📄 ${item.entity.getName()}\n`;
      }
    }

    return result;
  }
}