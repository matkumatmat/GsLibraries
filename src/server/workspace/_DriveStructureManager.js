class DriveStructureManager {
  /**
   * @param {string} folderId - null untuk Root Drive
   * @param {number} maxDepth - 1 untuk liat anak pertama aja, -1 untuk bablas sampai dasar
   * @param {boolean} showFiles - true untuk nampilin file, false untuk folder doang
   */
  static getTree(folderId = null, maxDepth = -1, showFiles = true) {
    const rootFolder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    let treeString = `📦 ${rootFolder.getName()}\n`;
    
    // Mulai rekursi dari depth 0
    treeString += this._buildTree(rootFolder, "", 0, maxDepth, showFiles);
    
    return treeString; // <--- SUDAH DIPERBAIKI
  }

  static _buildTree(folder, prefix, currentDepth, maxDepth, showFiles) {
    // Kalau udah nyampe batas kedalaman yang diset, stop nyelam!
    if (maxDepth !== -1 && currentDepth >= maxDepth) return "";

    let result = "";
    const items = [];
    
    // Ambil folder
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) items.push({ type: 'folder', entity: subFolders.next() });
    
    // Ambil file (KALAU diizinkan)
    if (showFiles) {
      const files = folder.getFiles();
      while (files.hasNext()) items.push({ type: 'file', entity: files.next() });
    }

    // Sorting
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.entity.getName().localeCompare(b.entity.getName());
    });

    for (let i = 0; i < items.length; i++) {
      const isLast = i === items.length - 1;
      const item = items[i];
      
      const pointer = isLast ? "└── " : "├── ";
      const childPrefix = isLast ? "    " : "│   ";

      if (item.type === 'folder') {
        result += `${prefix}${pointer}📁 ${item.entity.getName()}\n`;
        // Nyelam lebih dalam, currentDepth ditambah 1
        result += this._buildTree(item.entity, prefix + childPrefix, currentDepth + 1, maxDepth, showFiles);
      } else {
        result += `${prefix}${pointer}📄 ${item.entity.getName()}\n`;
      }
    }

    return result;
  }
}