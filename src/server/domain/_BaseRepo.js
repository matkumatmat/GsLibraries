// src/server/domain/_BaseRepo.js

/**
 * BaseRepo
 * Single responsibility: Fondasi dasar untuk semua Repository.
 * Menjembatani domain model dengan SheetDriver dan QueryBuilder.
 */
class BaseRepo {
  constructor(spreadsheetId, sheetName, tableKeys, startRow = 2) {
    this.driver = new SheetDriver(spreadsheetId, sheetName);
    this.tableKeys = tableKeys;
    this.startRow = startRow;
  }

  /**
   * Memulai fluent query builder
   */
  query() {
    return new QueryBuilder(this.driver, this.tableKeys);
  }

  all() {
    return this.query().get();
  }

  findById(id) {
    return this.query().where('id', '=', id).first();
  }

  exists(id) {
    return this.findById(id) !== null;
  }

  create(data) {
    const id = data.id || Utilities.getUuid();
    const now = new Date().toISOString();
    
    data.id = id;
    data.createdAt = data.createdAt || now;
    data.updatedAt = data.updatedAt || now;

    // Map object to array based on tableKeys
    const rowData = this.tableKeys.map(key => data[key] !== undefined ? data[key] : '');
    this.driver.append(rowData);
    
    return data;
  }

  update(id, partialData) {
    const allData = this.driver.readRaw();
    const idIndex = this.tableKeys.indexOf('id');
    
    if (idIndex === -1) throw new DatabaseError('TableKeys does not contain "id" field');

    let targetRowIndex = -1;
    let existingData = {};

    for (let i = 0; i < allData.length; i++) {
      if (allData[i][idIndex] === id) {
        targetRowIndex = i + this.startRow;
        this.tableKeys.forEach((key, idx) => {
          existingData[key] = allData[i][idx];
        });
        break;
      }
    }

    if (targetRowIndex === -1) throw new NotFoundError(`Entity with ID ${id} not found`);

    const updatedData = { ...existingData, ...partialData, updatedAt: new Date().toISOString() };
    const rowData = this.tableKeys.map(key => updatedData[key] !== undefined ? updatedData[key] : '');
    
    this.driver.updateRow(targetRowIndex, rowData);
    return updatedData;
  }

  softDelete(id) {
    return this.update(id, { status: 'DELETED', deletedAt: new Date().toISOString() });
  }
}