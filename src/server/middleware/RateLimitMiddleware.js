// src/server/middleware/RateLimitMiddleware.js

/**
 * RateLimitMiddleware
 * Single responsibility: Membatasi jumlah request dari satu user/IP dalam rentang waktu tertentu.
 */
class RateLimitMiddleware {
  static get MAX_REQUESTS() { return 30; } // Maksimal 30 request
  static get WINDOW_SECONDS() { return 60; } // Per 60 detik (1 Menit)

// Revisi RateLimitMiddleware.js
  static handle(context) {
    const identifier = context.user ? context.user.email : (context.token || 'GUEST');
    // Gunakan _CacheManager, biarkan infrastruktur yang ngurusin mesinnya
    let hits = parseInt(CacheManager.get('RATE_LIMITS', identifier)) || 0;

    if (hits >= this.MAX_REQUESTS) {
      Logger.warn('Rate limit exceeded', { identifier, hits });
      throw new AppError('Terlalu banyak permintaan.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    CacheManager.set('RATE_LIMITS', identifier, (hits + 1).toString(), this.WINDOW_SECONDS);
    return context;
}
}