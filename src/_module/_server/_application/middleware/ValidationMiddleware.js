// src/server/middleware/ValidationMiddleware.js

/**
 * ValidationMiddleware
 * Single responsibility: Memastikan payload request sesuai dengan skema yang didefinisikan.
 */
class ValidationMiddleware {
  static handle(context) {
    // Jika rute mendaftarkan schema validasi
    if (context.route && context.route.schema) {
      const payload = context.payload || {};
      
      // Lempar ValidationError jika gagal (akan ditangkap otomatis oleh Pipeline/Router)
      Validator.validate(payload, context.route.schema);
      
      // Bersihkan field liar yang tidak ada di schema dan berikan nilai default
      context.payload = Validator.sanitize(payload, context.route.schema);
    }
    
    return context;
  }
}