// src/server/middleware/RateLimitMiddleware.js
class RateLimitMiddleware {
  static handle(context) {
    // Ambil limit dari Config, fallback ke default bawaan framework
    const maxRequests = parseInt(EnvConfig.get('RATE_LIMIT_MAX_REQUESTS', 30));
    const windowSeconds = parseInt(EnvConfig.get('RATE_LIMIT_WINDOW_SEC', 60));

    // Token bisa datang dari header authorization (kalau lu set up manual) atau payload
    const identifier = context.user ? context.user.email : (context.payload?.token || context.request?.parameter?.token || 'GUEST');
    
    let hits = parseInt(CacheManager.get('RATE_LIMITS', identifier)) || 0;
    
    if (hits >= maxRequests) {
      Logger.warn('Rate limit exceeded', { identifier, hits });
      throw new AppError('Terlalu banyak permintaan.', 'RATE_LIMIT_EXCEEDED', 429);
    }
    
    CacheManager.set('RATE_LIMITS', identifier, (hits + 1).toString(), windowSeconds);
    return context;
  }
}