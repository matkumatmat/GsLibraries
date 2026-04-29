// src/server/utils/_ArrayUtils.js

class ArrayUtils {
  static groupBy(array, key) {
    return array.reduce((result, currentValue) => {
      const groupKey = currentValue[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(currentValue);
      return result;
    }, {});
  }

  static uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const k = item[key];
      return seen.has(k) ? false : seen.add(k);
    });
  }

  static sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  static chunk(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }
}