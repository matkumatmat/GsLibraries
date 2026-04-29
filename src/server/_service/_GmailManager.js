// src/server/_service/_GmailManager.js

/**
 * GmailManager
 * Single responsibility: Abstraksi tingkat lanjut untuk interaksi dengan Gmail API.
 */
class GmailManager {
  /**
   * Mencari email/thread berdasarkan query khusus (mendukung Gmail Search Operators).
   * @param {string} query - Contoh: 'is:unread from:bos@kantor.com has:attachment'
   * @param {number} limit - Batas thread yang ditarik untuk menghemat memori V8
   */
  static searchThreads(query, limit = 10) {
    try {
      Logger.info(`Mencari email dengan query: ${query}`);
      const threads = GmailApp.search(query, 0, limit);
      
      return threads.map(thread => {
        const messages = thread.getMessages();
        const latestMsg = messages[messages.length - 1]; // Ambil pesan paling baru di thread
        
        return {
          threadId: thread.getId(),
          subject: thread.getFirstMessageSubject(),
          messageCount: thread.getMessageCount(),
          isUnread: thread.isUnread(),
          latestMessage: {
            id: latestMsg.getId(),
            from: latestMsg.getFrom(),
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
   * Mengambil semua lampiran dari sebuah thread email dan mem-parsing atau 
   * menyimpannya langsung ke Google Drive via DriveManager.
   */
  static extractAndSaveAttachments(threadId, folderId = null) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (!thread) throw new NotFoundError(`Thread ID ${threadId} tidak ditemukan.`);

      // Re-use abstraksi DriveManager lu
      const folder = DriveManager.getFolder(folderId); 
      const messages = thread.getMessages();
      const savedFiles = [];

      messages.forEach(msg => {
        const attachments = msg.getAttachments();
        attachments.forEach(att => {
          const file = folder.createFile(att);
          savedFiles.push({
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
   * Menandai thread sebagai sudah dibaca (mark as read) 
   * agar tidak diproses berulang-ulang oleh sistem.
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
}