// src/server/utils/_ObjectUtils.js

class ObjectUtils {
  static pick(obj, keys) {
    return keys.reduce((acc, key) => {
      if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  static omit(obj, keysToOmit) {
    const result = { ...obj };
    keysToOmit.forEach(key => delete result[key]);
    return result;
  }

  // Shallow merge, kalau butuh deep merge logicnya bisa ditambahkan
  static merge(target, source) {
    return { ...target, ...source };
  }

  static isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }
}