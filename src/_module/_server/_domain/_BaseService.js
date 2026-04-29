// src/server/domain/_BaseService.js

/**
 * BaseService
 * Single responsibility: Fondasi dasar untuk semua Service.
 * Menyediakan utilitas umum untuk data processing, filtering, dan pagination.
 */
class BaseService {
  constructor(repo) {
    this.repo = repo;
  }

  /**
   * Filter array object berdasarkan status yang diizinkan dan custom filter function
   */
  _filter(items, filterConfig) {
    if (!filterConfig) return items;

    return items.filter(item => {
      if (filterConfig.allowedStatuses) {
        const itemStatus = String(item.status || item.sysStatus || '').toUpperCase();
        if (!filterConfig.allowedStatuses.includes(itemStatus)) return false;
      }
      
      if (filterConfig.custom && typeof filterConfig.custom === 'function') {
        if (!filterConfig.custom(item)) return false;
      }
      
      return true;
    });
  }

  /**
   * Melakukan parsing string JSON menjadi Object secara in-place
   */
  _parseJsonFields(items, fieldNames) {
    if (!fieldNames || fieldNames.length === 0) return items;
    
    return items.map(item => {
      fieldNames.forEach(field => {
        if (item[field] && typeof item[field] === 'string') {
          try {
            item[field] = JSON.parse(item[field]);
          } catch (e) {
            // Biarkan string aslinya jika gagal parse
          }
        }
      });
      return item;
    });
  }

  /**
   * Memotong array untuk pagination
   */
  _paginate(items, page = 1, limit = 50) {
    const total = items.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    return {
      data: items.slice(offset, offset + limit),
      meta: {
        total,
        page,
        pages,
        limit
      }
    };
  }
}