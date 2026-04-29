// // src/server/90_main/PostRegistry.js

// /**
//  * PostRegistry
//  * Tempat mendaftarkan semua endpoint POST (Mutasi data).
//  * Mendukung konfigurasi Role-Based Access Control (RBAC).
//  */
// const PostRegistry = {
//   // Contoh format:
//   // 'createUser': {
//   //   factory: () => new UserService(new BaseRepo(driver, keys)),
//   //   method: 'create',
//   //   roles: ['ADMIN'] // Hanya admin yang boleh eksekusi
//   // }

// 'createSupplier': {
//   factory: () => {
//     // Ingat, SheetDriver sekarang ada di infrastructure/database/sheets
//     const driver = new SheetDriver(EnvConfig.get('SHEET_ID_SUPPLIER'), 'MASTER_SUPPLIER');
//     const keys = ['id', 'nama', 'status', 'createdAt', 'updatedAt'];
    
//     // SupplierRepo ini adalah class di folder domain/supplier/ yang mewarisi _BaseSheetRepo
//     const repo = new SupplierRepo(driver, keys, 2); 
//     return new SupplierService(repo);
//   },
//   method: 'create',
//   roles: ['ADMIN']
// }
//   'updateSupplier': {
//     factory: () => {
//       const driver = new SheetDriver(EnvConfig.get('SHEET_ID_SUPPLIER'), 'MASTER_SUPPLIER');
//       const keys = ['id', 'nama', 'status', 'createdAt', 'updatedAt'];
//       const repo = new SupplierRepo(driver, keys, 2);
//       return new SupplierService(repo);
//     },
//     method: 'update',
//     roles: ['ADMIN']
//   },
// };