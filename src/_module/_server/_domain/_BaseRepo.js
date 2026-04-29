// src/server/domain/_BaseRepo.js

/**
 * IBaseRepo (Interface Kontrak)
 * Single responsibility: Mendefinisikan standar operasi repository.
 * Class ini murni abstrak. TIDAK BOLEH ada implementasi QueryBuilder atau SheetDriver di sini.
 */
class BaseRepo {
  all() { throw new AppError('Metode all() belum diimplementasikan', 'SYS_ERROR', 500); }
  findById(id) { throw new AppError('Metode findById() belum diimplementasikan', 'SYS_ERROR', 500); }
  exists(id) { throw new AppError('Metode exists() belum diimplementasikan', 'SYS_ERROR', 500); }
  create(data) { throw new AppError('Metode create() belum diimplementasikan', 'SYS_ERROR', 500); }
  update(id, partialData) { throw new AppError('Metode update() belum diimplementasikan', 'SYS_ERROR', 500); }
  softDelete(id) { throw new AppError('Metode softDelete() belum diimplementasikan', 'SYS_ERROR', 500); }
}