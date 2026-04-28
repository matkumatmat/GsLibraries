// src/server/domain/supplier/SupplierRepo.js

class SupplierRepo extends BaseRepo {
  constructor(driver, tableKeys, startRow = 2) {
    if (!driver) throw new AppError('Database driver must be injected', 'SYS_ERROR', 500);
    super(driver, tableKeys, startRow);
  }

  // Tambahkan custom query/logic database khusus Supplier di sini
}
