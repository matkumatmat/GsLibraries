// src/server/middleware/AuthMiddleware.js

/**
 * AuthMiddleware
 * Single responsibility: Memvalidasi token autentikasi dan hak akses (RBAC).
 */
class AuthMiddleware {
  static handle(context) {
    const token = context.token;
    
    if (!token) {
      throw new AuthError('Token tidak ditemukan. Harap login kembali.');
    }

    // Memvalidasi token ke AuthService (yang akan kita buat di Phase 6)
    const user = AuthService.validateToken(token);
    
    if (!user) {
      throw new AuthError('Sesi telah habis atau token tidak valid.');
    }

    // Role-Based Access Control (RBAC) jika rute memiliki batasan role
    if (context.route && context.route.roles && Array.isArray(context.route.roles)) {
      if (!context.route.roles.includes(user.role)) {
        // Catat percobaan akses ilegal ke logger
        Logger.warn('RBAC Violation', { user: user.email, role: user.role, action: context.action });
        throw new ForbiddenError(`Akses Ditolak: Role [${user.role}] tidak diizinkan.`);
      }
    }

    // Inject user ke context agar bisa dipakai oleh Service layer
    context.user = user;
    return context;
  }
}