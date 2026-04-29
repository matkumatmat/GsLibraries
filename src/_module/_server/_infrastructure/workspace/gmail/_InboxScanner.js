// src/server/infrastructure/workspace/gmail/_InboxScanner.js

/**
 * InboxScanner
 * Single responsibility: Berinteraksi dengan Gmail API untuk membaca, 
 * mengekstrak, dan membalas email masuk.
 */
class InboxScanner {
  // ==========================================
  // 1. CORE SEARCH (DENGAN PAGINASI & CLEANUP)
  // ==========================================

  /**
   * Mencari email dengan dukungan Paginasi (start, limit) untuk batch processing.
   * @param {string} query 
   * @param {number} start - Index awal (offset)
   * @param {number} limit - Jumlah maksimal
   */
  static searchThreads(query, start = 0, limit = 10) {
    try {
      // Menggunakan paginasi bawaan GAS
      const threads = GmailApp.search(query, start, limit);
      
      return threads.map(thread => {
        const messages = thread.getMessages();
        const latestMsg = messages[messages.length - 1]; 
        
        return {
          threadId: thread.getId(),
          subject: thread.getFirstMessageSubject(),
          messageCount: thread.getMessageCount(),
          isUnread: thread.isUnread(),
          latestMessage: {
            id: latestMsg.getId(),
            rawFrom: latestMsg.getFrom(),
            // EXTRA: Langsung bersihkan email dari format "Nama <email@domain.com>"
            cleanFrom: this.extractPureEmail(latestMsg.getFrom()),
            date: latestMsg.getDate(),
            plainBody: latestMsg.getPlainBody(),
            hasAttachments: latestMsg.getAttachments().length > 0
          }
        };
      });
    } catch (e) {
      throw new AppError(`Gagal mencari email: ${e.message}`, 'GMAIL_SEARCH_ERROR', 500);
    }
  }
  /**
   * Mengekstrak semua lampiran dari sebuah thread dan menyimpannya ke Google Drive.
   * Sangat berguna dipadukan dengan Background Job (_JobRunner).
   */
  static extractAndSaveAttachments(threadId, destinationFolderId = null) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (!thread) throw new NotFoundError(`Thread ID ${threadId} tidak ditemukan.`);

      const folder = DriveManager.getFolder(destinationFolderId); 
      const messages = thread.getMessages();
      const savedFiles = [];

      messages.forEach(msg => {
        const attachments = msg.getAttachments();
        attachments.forEach(att => {
          const file = folder.createFile(att);
          savedFiles.push({
            id: file.getId(),
            name: file.getName(),
            url: file.getUrl(),
            size: file.getSize()
          });
        });
      });

      return savedFiles;
    } catch (e) {
      throw new AppError(`Gagal mengekstrak lampiran: ${e.message}`, 'GMAIL_ATTACHMENT_ERROR', 500);
    }
  }


/**
   * Helper: Mengekstrak email murni dari string kotor
   * Contoh: "Budi <budi@mail.com>" -> "budi@mail.com"
   */
  static extractPureEmail(fromString) {
    const match = fromString.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase().trim() : fromString.toLowerCase().trim();
  }

  // ==========================================
  // 2. STATE RECOVERY & MANAGEMENT
  // ==========================================

  /**
   * Membalas pesan secara langsung ke dalam thread spesifik.
   * Bermanfaat untuk auto-reply seperti "Lampiran Anda telah kami terima."
   */
  static replyToThread(threadId, body, htmlBody = null) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (!thread) throw new NotFoundError(`Thread ID ${threadId} tidak ditemukan.`);

      const options = {};
      if (htmlBody) options.htmlBody = htmlBody;

      thread.reply(body, options);
      return true;
    } catch (e) {
      throw new AppError(`Gagal membalas thread: ${e.message}`, 'GMAIL_REPLY_ERROR', 500);
    }
  }

  /**
   * Menandai thread sebagai Read agar tidak diproses berulang-ulang oleh Job.
   */
  static markAsRead(threadId) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread) {
        thread.markRead();
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal update status email: ${e.message}`, 'GMAIL_UPDATE_ERROR', 500);
    }
  }

  /**
   * Mengembalikan status menjadi Unread. 
   * SANGAT VITAL untuk "Rollback" jika Background Job gagal di tengah jalan.
   */
  static markAsUnread(threadId) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread) {
        thread.markUnread();
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal rollback status email (Unread): ${e.message}`, 'GMAIL_ROLLBACK_ERROR', 500);
    }
  }

  /**
   * Membuang thread ke tempat sampah (Soft Delete).
   * Penting untuk manajemen storage / kuota Workspace.
   */
  static moveToTrash(threadId) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread) {
        thread.moveToTrash();
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal membuang email: ${e.message}`, 'GMAIL_TRASH_ERROR', 500);
    }
  }

  /**
   * Mengembalikan email dari Archive ke kotak masuk utama (Inbox).
   */
  static moveToInbox(threadId) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread) {
        thread.moveToInbox();
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal memindahkan ke Inbox: ${e.message}`, 'GMAIL_INBOX_ERROR', 500);
    }
  }

  /**
   * Mengarsipkan thread (memindahkan dari Inbox utama).
   */
  static archiveThread(threadId) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread) {
        thread.moveToArchive();
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal mengarsipkan email: ${e.message}`, 'GMAIL_ARCHIVE_ERROR', 500);
    }
  }

  // ==========================================
  // LABEL MANAGEMENT (SISTEM TAGGING)
  // ==========================================

  /**
   * Mengambil label object. Jika belum ada di Gmail, otomatis dibuat.
   */
  static _getOrCreateLabel(labelName) {
    let label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      label = GmailApp.createLabel(labelName);
    }
    return label;
  }

  /**
   * Menambahkan Label ke sebuah Thread (Sangat berguna untuk menandai status tiket/invoice)
   */
  static addLabel(threadId, labelName) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread) {
        const label = this._getOrCreateLabel(labelName);
        thread.addLabel(label);
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal menambah label ${labelName}: ${e.message}`, 'GMAIL_LABEL_ERROR', 500);
    }
  }

  /**
   * Mencabut Label dari Thread
   */
  static removeLabel(threadId, labelName) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      const label = GmailApp.getUserLabelByName(labelName);
      if (thread && label) {
        thread.removeLabel(label);
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal mencabut label: ${e.message}`, 'GMAIL_LABEL_ERROR', 500);
    }
  }

  // ==========================================
  // THREAD OPERATIONS (ADVANCED)
  // ==========================================

  /**
   * Menandai thread dengan bintang (Starred)
   */
  static starThread(threadId) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (thread && !thread.hasStarredMessages()) {
        const messages = thread.getMessages();
        messages[messages.length - 1].star(); // Star pesan terakhir
        return true;
      }
      return false;
    } catch (e) {
      throw new AppError(`Gagal memberi bintang pada thread: ${e.message}`, 'GMAIL_STAR_ERROR', 500);
    }
  }

  /**
   * Meneruskan (Forward) pesan terakhir dalam thread beserta lampirannya ke divisi lain
   */
  static forwardLatestMessage(threadId, targetEmail, additionalBody = "") {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (!thread) throw new NotFoundError(`Thread ID ${threadId} tidak ditemukan.`);

      const messages = thread.getMessages();
      const latestMsg = messages[messages.length - 1];
      
      latestMsg.forward(targetEmail, {
        htmlBody: `${additionalBody}<br><br>--- Forwarded message ---<br>${latestMsg.getBody()}`
      });
      return true;
    } catch (e) {
      throw new AppError(`Gagal mem-forward email: ${e.message}`, 'GMAIL_FORWARD_ERROR', 500);
    }
  }
}