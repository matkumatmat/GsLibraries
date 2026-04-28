// src/server/middleware/AuthMiddleware.js

/**
 * AuthMiddleware
 * Single responsibility: Memvalidasi token autentikasi dan hak akses (RBAC).
 */
// src/server/middleware/AuthMiddleware.js

class AuthMiddleware {
  static handle(context) {
    const token = context.token;
    
    if (!token) {
      throw new AuthError('Token tidak ditemukan. Harap login kembali.');
    }

    // PERBAIKAN: Gunakan Container.make sesuai implementasi _Container.js
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