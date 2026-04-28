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

  'getSuppliers': {
    factory: () => {
      const driver = new SheetDriver(EnvConfig.get('SHEET_ID_SUPPLIER'), 'MASTER_SUPPLIER');
      const keys = ['id', 'nama', 'status', 'createdAt', 'updatedAt'];
      const repo = new SupplierRepo(driver, keys, 2);
      return new SupplierService(repo);
    },
    cacheGroup: 'MASTER_SUPPLIER',
    method: 'getPaginatedData'
  },
};