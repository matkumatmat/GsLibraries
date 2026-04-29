// src/server/workspace/_EmailScanner.js

/**
 * EmailScanner
 * Single responsibility: Berinteraksi dengan Gmail API untuk pencarian dan manipulasi email.
 */
class EmailScanner {
  /**
   * Mencari thread email berdasarkan query.
   */
  static searchThreads(query, limit = 10) {
    try {
      const threads = GmailApp.search(query, 0, limit);
      
      return threads.map(thread => {
        const messages = thread.getMessages();
        const latestMsg = messages[messages.length - 1]; // Pesan paling baru
        
        return {
          threadId: thread.getId(),
          subject: thread.getFirstMessageSubject(),
          isUnread: thread.isUnread(),
          latestMessage: {
            id: latestMsg.getId(),
            hasAttachments: latestMsg.getAttachments().length > 0
          }
        };
      });
    } catch (e) {
      throw new AppError(`Gagal mencari email: ${e.message}`, 'GMAIL_SEARCH_ERROR', 500);
    }
  }

  /**
   * Menandai thread email sebagai Read.
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