// src/server/domain/supplier/SupplierService.js

class SupplierService extends BaseService {
  constructor(repo) {
    super(repo);
    this.defaultLimit = 100;
  }

  getPaginatedData(page = 1, limit = null, filterConfig = null) {
    const limitNum = limit ? parseInt(limit) : this.defaultLimit;
    const rawData = this.repo.query().limit(limitNum).offset((page - 1) * limitNum).get();
    return this._filter(rawData, filterConfig);
  }

  create(payload) {
    return this.repo.create(payload);
  }

  update(id, payload) {
    return this.repo.update(id, payload);
  }

  delete(id) {
    return this.repo.softDelete(id);
  }
}
