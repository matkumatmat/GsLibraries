// src/server/middleware/AuthMiddleware.js
class AuthMiddleware {
  static handle(context) {
    // Ekstraksi token dinamis (GET dari param, POST dari payload)
    const token = (context.payload && context.payload.token) || 
                  (context.request && context.request.token) || 
                  (context.request && context.request.parameter && context.request.parameter.token);
                  
    if (!token) {
      throw new AuthError('Token tidak ditemukan. Harap login kembali.');
    }

    const authService = Container.make('AuthService');
    const user = authService.validateToken(token);
    
    if (!user) {
      throw new AuthError('Sesi telah habis atau token tidak valid.');
    }

    if (context.route && context.route.roles && Array.isArray(context.route.roles)) {
      if (!context.route.roles.includes(user.role)) {
        throw new ForbiddenError(`Akses Ditolak: Role [${user.role}] tidak diizinkan.`);
      }
    }

    context.user = user;
    return context;
  }
}