// src/server/domain/_Validator.js

/**
 * Validator
 * Single responsibility: Memvalidasi payload berdasarkan schema config.
 * Mendukung tipe data dan rules yang didefinisikan dalam framework.
 */
class Validator {
  /**
   * Melemparkan ValidationError jika payload tidak sesuai schema
   */
  static validate(data, schema) {
    const errors = [];

    for (const field in schema) {
      const rules = schema[field];
      const value = data[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        // Type checking dasar
        if (rules.type === 'number' && isNaN(Number(value))) {
          errors.push({ field, message: `${field} must be a number` });
        }
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push({ field, message: `${field} must be an array` });
        }
        
        // String length checking
        if (rules.type === 'string') {
          if (rules.minLength && String(value).length < rules.minLength) {
            errors.push({ field, message: `${field} minimum length is ${rules.minLength}` });
          }
          if (rules.maxLength && String(value).length > rules.maxLength) {
            errors.push({ field, message: `${field} maximum length is ${rules.maxLength}` });
          }
        }
        
        // Enum checking
        if (rules.enum && Array.isArray(rules.enum)) {
          if (!rules.enum.includes(value)) {
            errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Request validation failed', errors);
    }
    return true;
  }

  /**
   * Versi aman tanpa throw, mengembalikan Result monad
   */
  static validateSafe(data, schema) {
    return Result.try(() => {
      this.validate(data, schema);
      return data;
    });
  }

  /**
   * Membuang field yang tidak ada di schema dan menerapkan default value
   */
  static sanitize(data, schema) {
    const sanitized = {};
    for (const field in schema) {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      } else if (schema[field].default !== undefined) {
        sanitized[field] = schema[field].default;
      }
    }
    return sanitized;
  }
}