// src/server/middleware/LoggingMiddleware.js

/**
 * LoggingMiddleware
 * Single responsibility: Mencatat jejak request yang masuk (Endpoint & Eksekutor).
 */
class LoggingMiddleware {
  static handle(context) {
    const action = context.action || 'UNKNOWN_ACTION';
    const actor = context.user ? context.user.name : 'GUEST_USER';

    // Abaikan logging untuk request GET/Read biasa agar log tidak penuh sampah
    if (!action.startsWith('get') && !action.startsWith('query')) {
      Logger.info(`Mengeksekusi action: ${action}`, { action, actor });
    }

    // Sisipkan waktu mulai untuk menghitung durasi eksekusi (bisa dipakai di output response)
    context.meta = context.meta || {};
    context.meta.startTime = Date.now();

    return context;
  }
}