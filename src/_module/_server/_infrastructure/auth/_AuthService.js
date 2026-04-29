// src/server/_services/_AuthService.js

/**
 * AuthService
 * Single responsibility: Menangani logika autentikasi framework (Agnostic).
 * Melakukan hashing password, generate token, dan memanajemen sesi di Cache.
 */
class AuthService {
  /**
   * Hashing password menggunakan SHA-256 ditambah salt dari EnvConfig
   */
  static hashPassword(password) {
    const salt = EnvConfig.get('AUTH_SALT', 'default_salt');
    const raw = salt + password + salt;
    const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
    
    // Convert byte array to hex string
    return signature.map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join('');
  }

  /**
   * Membuat sesi baru. (Verifikasi password dengan database harus dilakukan di Domain Service, 
   * bukan di sini, karena AuthService ini agnostic dan tidak tahu struktur DB User-mu).
   * @param {Object} userData - Data user yang akan disimpan di session (misal: {email, role})
   */
  static createSession(userData) {
    const token = Utilities.getUuid(); 
    
    // FIX: Hapus JSON.stringify()
    CacheManager.set('AUTH_SESSIONS', token, userData, CacheStrategy.MAX);
    
    return token;
  }

  /**
   * Menghancurkan sesi (Logout)
   */
  static destroySession(token) {
    if (token) {
      CacheManager.delete('AUTH_SESSIONS', token);
    }
  }

  /**
   * Validasi token dan kembalikan data user. Digunakan oleh AuthMiddleware.
   */
  static validateToken(token) {
    if (!token) return null;
    
    const sessionStr = CacheManager.get('AUTH_SESSIONS', token);
    return sessionStr ? sessionStr : null;
  }
}