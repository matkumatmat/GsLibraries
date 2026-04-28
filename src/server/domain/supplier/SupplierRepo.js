// src/server/domain/supplier/SupplierRepo.js

class SupplierRepo extends BaseRepo {
  constructor(driver, tableKeys, startRow = 2) {
    // FIX: Panggil super() pertama kali
    super(driver, tableKeys, startRow);
    if (!driver) throw new AppError('Database driver must be injected', 'SYS_ERROR', 500);
  }
}