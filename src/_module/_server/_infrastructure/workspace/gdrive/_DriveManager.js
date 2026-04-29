// src/server/infrastructure/workspace/drive/_DriveManager.js

/**
 * DriveManager
 * Abstraksi supercharged untuk manipulasi Google Drive.
 * Mencakup file ops, structure (tree/path), permissions, dan fast-search.
 */
class DriveManager {
  
  // ==========================================
  // 1. CORE & SEARCH
  // ==========================================

  /**
   * Mengambil folder berdasarkan ID, atau fallback ke ROOT.
   */
  static getFolder(folderId = null) {
    try {
      return folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    } catch (e) {
      throw new AppError(`Folder dengan ID ${folderId} tidak ditemukan atau akses ditolak.`, 'DRIVE_NOT_FOUND', 404);
    }
  }

  /**
   * PENCARIAN CEPAT: Solusi untuk mengakali limitasi Tree Traversal di GAS.
   * Menggunakan syntax query Google Drive. 
   * Contoh query: "title contains 'Backup' and trashed = false"
   */
  static search(query, isFolderOnly = false) {
    const results = [];
    const searcher = isFolderOnly ? DriveApp.searchFolders(query) : DriveApp.searchFiles(query);
    
    while (searcher.hasNext()) {
      const item = searcher.next();
      results.push({
        id: item.getId(),
        name: item.getName(),
        url: item.getUrl()
      });
    }
    return results;
  }

  // ==========================================
  // 2. PATH & STRUCTURE
  // ==========================================

  /**
   * BIKIN PATH OTOMATIS (Sangat Powerful untuk Framework)
   * Contoh: getOrCreateFolderByPath("App/2026/Invoice")
   * Akan mencari folder tersebut. Jika belum ada, akan otomatis dibuat hirarkinya.
   */
  static getOrCreateFolderByPath(path, rootFolderId = null) {
    let currentFolder = this.getFolder(rootFolderId);
    const folderNames = path.split('/').filter(f => f.trim() !== '');

    for (const name of folderNames) {
      const folders = currentFolder.getFoldersByName(name);
      if (folders.hasNext()) {
        currentFolder = folders.next();
      } else {
        currentFolder = currentFolder.createFolder(name);
      }
    }
    return currentFolder;
  }

  /**
   * Generate ASCII Tree standar (gaya command CLI 'tree'). 
   * PERINGATAN: Jangan gunakan root folder (null) jika Drive sangat besar!
   */
  static getTree(folderId = null, maxDepth = -1, showFiles = true) {
    const rootFolder = this.getFolder(folderId);
    let treeString = `${rootFolder.getName()}/ (ID: ${rootFolder.getId()})\n`;
    treeString += this._buildTree(rootFolder, "", 0, maxDepth, showFiles);
    return treeString;
  }

  static _buildTree(folder, prefix, currentDepth, maxDepth, showFiles) {
    if (maxDepth !== -1 && currentDepth >= maxDepth) return "";

    let result = "";
    const items = [];
    
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) items.push({ type: 'folder', entity: subFolders.next() });
    
    if (showFiles) {
      const files = folder.getFiles();
      while (files.hasNext()) items.push({ type: 'file', entity: files.next() });
    }

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
        // Tambahkan '/' di akhir nama untuk menandakan ini direktori
        result += `${prefix}${pointer}${item.entity.getName()}/ [${item.entity.getId()}]\n`;
        result += this._buildTree(item.entity, prefix + childPrefix, currentDepth + 1, maxDepth, showFiles);
      } else {
        result += `${prefix}${pointer}${item.entity.getName()} [${item.entity.getId()}]\n`;
      }
    }
    return result;
  }

  // ==========================================
  // 3. FILE OPERATIONS
  // ==========================================

  /**
   * Upload file base64 ke Drive
   */
  static uploadBase64(base64Data, fileName, folderId = null) {
    try {
      const splitBase = base64Data.split(',');
      const isBase64 = splitBase.length > 1;
      const contentType = isBase64 ? splitBase[0].split(';')[0].split(':')[1] : 'application/octet-stream';
      const rawBase64 = isBase64 ? splitBase[1] : base64Data;
      
      const blob = Utilities.newBlob(Utilities.base64Decode(rawBase64), contentType, fileName);
      const folder = this.getFolder(folderId);
      const file = folder.createFile(blob);
      
      return {
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        downloadUrl: file.getDownloadUrl(),
        size: file.getSize()
      };
    } catch (e) {
      throw new AppError(`Gagal upload file: ${e.message}`, 'DRIVE_UPLOAD_ERROR', 500);
    }
  }

  static getThumbnailUrl(fileId, size = 'w800') {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }

  // ==========================================
  // 4. PERMISSIONS & SHARING
  // ==========================================

  /**
   * Mengatur hak akses ke File atau Folder.
   * @param {string} fileOrFolderId - ID dari file atau folder
   * @param {string} email - Email user yang mau dikasih akses (null jika public)
   * @param {string} role - 'VIEWER', 'EDITOR', 'COMMENTER'
   * @param {boolean} isFile - true jika ini file, false jika ini folder
   */
  static grantAccess(fileOrFolderId, email, role = 'VIEWER', isFile = true) {
    try {
      const entity = isFile ? DriveApp.getFileById(fileOrFolderId) : DriveApp.getFolderById(fileOrFolderId);
      
      // Jika email tidak ada, buat jadi Public Anyone with the Link
      if (!email) {
        const access = role === 'EDITOR' ? DriveApp.Access.ANYONE_WITH_LINK : DriveApp.Access.ANYONE;
        const permission = role === 'EDITOR' ? DriveApp.Permission.EDIT : DriveApp.Permission.VIEW;
        entity.setSharing(access, permission);
        return true;
      }

      // Jika ada email spesifik
      switch (role.toUpperCase()) {
        case 'EDITOR':
          entity.addEditor(email);
          break;
        case 'COMMENTER':
          entity.addCommenter(email); // Hanya berlaku untuk File
          break;
        case 'VIEWER':
        default:
          entity.addViewer(email);
          break;
      }
      return true;
    } catch (e) {
      throw new AppError(`Gagal mengatur permission: ${e.message}`, 'DRIVE_PERMISSION_ERROR', 500);
    }
  }

  /**
   * Mencabut hak akses spesifik user
   */
  static revokeAccess(fileOrFolderId, email, isFile = true) {
    try {
      const entity = isFile ? DriveApp.getFileById(fileOrFolderId) : DriveApp.getFolderById(fileOrFolderId);
      entity.removeEditor(email);
      entity.removeViewer(email);
      entity.removeCommenter(email);
      return true;
    } catch (e) {
       throw new AppError(`Gagal mencabut permission: ${e.message}`, 'DRIVE_REVOKE_ERROR', 500);
    }
  }
  // ==========================================
  // 5. TEMPLATE & CONVERSION (ADVANCED)
  // ==========================================

  /**
   * Menduplikasi file (Sangat berguna untuk sistem Template Dokumen)
   * @param {string} sourceFileId - ID file template (Docs/Sheets/Slides)
   * @param {string} newFileName - Nama file hasil duplikasi
   * @param {string} destinationFolderId - ID folder tujuan
   */
  static copyTemplate(sourceFileId, newFileName, destinationFolderId = null) {
    try {
      const sourceFile = DriveApp.getFileById(sourceFileId);
      const targetFolder = this.getFolder(destinationFolderId);
      
      const newFile = sourceFile.makeCopy(newFileName, targetFolder);
      return {
        id: newFile.getId(),
        name: newFile.getName(),
        url: newFile.getUrl()
      };
    } catch (e) {
      throw new AppError(`Gagal menduplikasi template: ${e.message}`, 'DRIVE_COPY_ERROR', 500);
    }
  }

  /**
   * Mengonversi Dokumen (GDocs, GSheets, Slides) menjadi PDF dan menyimpannya.
   */
  static exportToPdf(fileId, newFileName, destinationFolderId = null) {
    try {
      const file = DriveApp.getFileById(fileId);
      const pdfBlob = file.getAs('application/pdf');
      pdfBlob.setName(newFileName.endsWith('.pdf') ? newFileName : `${newFileName}.pdf`);
      
      const folder = this.getFolder(destinationFolderId);
      const pdfFile = folder.createFile(pdfBlob);
      
      return {
        id: pdfFile.getId(),
        name: pdfFile.getName(),
        url: pdfFile.getUrl(),
        downloadUrl: pdfFile.getDownloadUrl()
      };
    } catch (e) {
      throw new AppError(`Gagal mengonversi ke PDF: ${e.message}`, 'DRIVE_PDF_ERROR', 500);
    }
  }

  // ==========================================
  // 6. MANAGEMENT & ARCHIVING
  // ==========================================

  /**
   * Memindahkan file ke folder lain (Archiving)
   */
  static moveItem(fileOrFolderId, destinationFolderId, isFile = true) {
    try {
      const entity = isFile ? DriveApp.getFileById(fileOrFolderId) : DriveApp.getFolderById(fileOrFolderId);
      const destination = this.getFolder(destinationFolderId);
      
      // GAS versi baru sudah mendukung moveTo(). Dulu harus addFolder & removeFolder manual.
      entity.moveTo(destination);
      return true;
    } catch (e) {
      throw new AppError(`Gagal memindahkan item: ${e.message}`, 'DRIVE_MOVE_ERROR', 500);
    }
  }

  /**
   * Membuang file/folder ke Trash (Soft Delete di level Drive)
   */
  static trashItem(fileOrFolderId, isFile = true) {
    try {
      const entity = isFile ? DriveApp.getFileById(fileOrFolderId) : DriveApp.getFolderById(fileOrFolderId);
      entity.setTrashed(true);
      return true;
    } catch (e) {
      throw new AppError(`Gagal menghapus item: ${e.message}`, 'DRIVE_TRASH_ERROR', 500);
    }
  }

  /**
   * Mengambil detail lengkap metadata sebuah file
   */
  static getFileInfo(fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      return {
        id: file.getId(),
        name: file.getName(),
        mimeType: file.getMimeType(),
        sizeBytes: file.getSize(),
        owner: file.getOwner().getEmail(),
        dateCreated: file.getDateCreated().toISOString(),
        lastUpdated: file.getLastUpdated().toISOString(),
        url: file.getUrl()
      };
    } catch (e) {
      throw new AppError(`Gagal mengambil info file: ${e.message}`, 'DRIVE_INFO_ERROR', 404);
    }
  }

  /**
   * Mengambil isi file dari Drive dan mengubahnya menjadi Base64 string.
   * Sangat berguna jika frontend ingin menampilkan file/gambar private 
   * tanpa harus mengaturnya menjadi Public.
   */
  static getFileAsBase64(fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      const blob = file.getBlob();
      
      // Menggunakan native Utilities GAS untuk encode biner ke Base64
      const base64Data = Utilities.base64Encode(blob.getBytes());
      const mimeType = blob.getContentType();

      return {
        id: file.getId(),
        name: file.getName(),
        mimeType: mimeType,
        // Format Data URI siap pakai untuk tag <img> atau atribut href di frontend
        base64: `data:${mimeType};base64,${base64Data}` 
      };
    } catch (e) {
      throw new AppError(`Gagal membaca file ke Base64: ${e.message}`, 'DRIVE_READ_ERROR', 500);
    }
  }
}