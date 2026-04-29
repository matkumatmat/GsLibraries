// src/server/database/QueryBuilder.js

/**
 * QueryBuilder
 * Single responsibility: Menyediakan antarmuka fluent (chaining) untuk memfilter, 
 * mensortir, dan membatasi data dari SheetDriver sebelum dikembalikan ke Service.
 */
class QueryBuilder {
  constructor(driver, tableKeys) {
    this.driver = driver;
    this.tableKeys = tableKeys; // Array urutan key: ['id', 'nama', 'status']
    
    this._filters = [];
    this._limit = null;
    this._offset = 0;
    this._sort = null;
  }

  // --- FILTERING ---
  
  where(field, operator, value) {
    this._filters.push({ field, operator, value });
    return this;
  }

  whereIn(field, valuesArray) {
    this._filters.push({ field, operator: 'IN', value: valuesArray });
    return this;
  }

  whereLike(field, substring) {
    this._filters.push({ field, operator: 'LIKE', value: substring });
    return this;
  }

  whereRaw(customFn) {
    this._filters.push({ type: 'RAW', fn: customFn });
    return this;
  }

  // --- PAGINATION & SORTING ---

  limit(n) {
    this._limit = parseInt(n);
    return this;
  }

  offset(n) {
    this._offset = parseInt(n);
    return this;
  }

  orderBy(field, direction = 'asc') {
    this._sort = { field, direction: direction.toLowerCase() };
    return this;
  }

  // --- EXECUTION (Menarik & Memproses Data) ---

  _mapToObject(rawRow) {
    let obj = {};
    this.tableKeys.forEach((key, index) => {
      obj[key] = rawRow[index] !== undefined && rawRow[index] !== '' ? rawRow[index] : null;
    });
    return obj;
  }

  get() {
    const rawData = this.driver.readRaw();
    let results = [];

    // 1. Mapping & Filtering
    for (let i = 0; i < rawData.length; i++) {
      const obj = this._mapToObject(rawData[i]);
      obj._rowNumber = i + 2; // Simpan posisi baris fisik untuk keperluan update

      if (this._evaluateFilters(obj)) {
        results.push(obj);
      }
    }

    // 2. Sorting
    if (this._sort) {
      results.sort((a, b) => {
        let valA = a[this._sort.field];
        let valB = b[this._sort.field];
        if (valA < valB) return this._sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return this._sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 3. Offset & Limit
    if (this._offset > 0) {
      results = results.slice(this._offset);
    }
    if (this._limit !== null) {
      results = results.slice(0, this._limit);
    }

    return results;
  }

  first() {
    this.limit(1);
    const results = this.get();
    return results.length > 0 ? results[0] : null;
  }

  _evaluateFilters(obj) {
    for (let f of this._filters) {
      if (f.type === 'RAW') {
        if (!f.fn(obj)) return false;
        continue;
      }

      const itemVal = obj[f.field];
      
      switch (f.operator) {
        case '=':  if (itemVal != f.value) return false; break;
        case '!=': if (itemVal == f.value) return false; break;
        case '>':  if (itemVal <= f.value) return false; break;
        case '<':  if (itemVal >= f.value) return false; break;
        case '>=': if (itemVal < f.value) return false; break;
        case '<=': if (itemVal > f.value) return false; break;
        case 'IN': 
          if (!f.value.includes(itemVal)) return false; 
          break;
        case 'LIKE':
          if (!String(itemVal).toLowerCase().includes(String(f.value).toLowerCase())) return false;
          break;
      }
    }
    return true;
  }
}