// src/server/90_main/DomainRegistry.js

/**
 * DomainRegistry
 * Tempat mendaftarkan semua endpoint GET (Read-Only).
 * Mapping antara nama action dengan Service yang akan mengeksekusinya.
 */
const DomainRegistry = {
  // Contoh format:
  // 'getUsers': {
  //   factory: () => new UserService(new BaseRepo(driver, keys)),
  //   cacheGroup: 'USERS',
  //   method: 'getPaginatedData'
  // }
};