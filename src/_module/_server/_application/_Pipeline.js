// src/server/application/_Pipeline.js

/**
 * Pipeline
 * Single responsibility: Menjalankan rantai eksekusi (Middleware) secara synchronous.
 * Berhenti mengeksekusi chain selanjutnya jika context ditandai sebagai rejected.
 */
class Pipeline {
  constructor(middlewares = []) {
    this.middlewares = middlewares;
  }

  /**
   * Menambahkan middleware ke dalam rantai
   * @param {Object} middleware - Class/Object yang memiliki method handle(context)
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this; // chainable
  }

  /**
   * Mengeksekusi seluruh middleware secara berurutan.
   * Context object: { request: {}, response: null, user: null, isRejected: false, error: null }
   */
  run(context) {
    for (let i = 0; i < this.middlewares.length; i++) {
      const mw = this.middlewares[i];
      
      // Eksekusi logic middleware
      mw.handle(context);

      // Jika middleware memutus rantai (misal Auth gagal)
      if (context.isRejected) {
        break;
      }
    }
    return context;
  }

  /**
   * Mengeksekusi pipeline, dan langsung throw error jika ditolak (berguna untuk API)
   */
  runOrThrow(context) {
    this.run(context);
    if (context.isRejected && context.error) {
      throw context.error;
    }
    return context;
  }
}