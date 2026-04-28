// src/server/middleware/RateLimitMiddleware.js

/**
 * RateLimitMiddleware
 * Single responsibility: Membatasi jumlah request dari satu user/IP dalam rentang waktu tertentu.
 */
class RateLimitMiddleware {
  static get MAX_REQUESTS() { return 30; } // Maksimal 30 request
  static get WINDOW_SECONDS() { return 60; } // Per 60 detik (1 Menit)

  static handle(context) {
    // Gunakan email user jika sudah login, atau token/IP fallback jika guest
    const identifier = context.user ? context.user.email : (context.token || 'GUEST');
    const cacheKey = `RATE_LIMIT_${identifier}`;
    
    const cache = CacheService.getScriptCache();
    const currentHits = cache.get(cacheKey);
    
    let hits = currentHits ? parseInt(currentHits) : 0;

    if (hits >= this.MAX_REQUESTS) {
      Logger.warn('Rate limit exceeded', { identifier, hits });
      throw new AppError('Terlalu banyak permintaan. Silakan tunggu 1 menit.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    // Tambah hit counter dan simpan kembali ke cache
    cache.put(cacheKey, (hits + 1).toString(), this.WINDOW_SECONDS);

    return context;
  }
}