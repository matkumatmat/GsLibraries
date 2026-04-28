// src/server/90_main/PostRegistry.js

/**
 * PostRegistry
 * Tempat mendaftarkan semua endpoint POST (Mutasi data).
 * Mendukung konfigurasi Role-Based Access Control (RBAC).
 */
const PostRegistry = {
  // Contoh format:
  // 'createUser': {
  //   factory: () => new UserService(new BaseRepo(driver, keys)),
  //   method: 'create',
  //   roles: ['ADMIN'] // Hanya admin yang boleh eksekusi
  // }
};