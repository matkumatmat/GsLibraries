// src/server/_Result.js

/**
 * Result
 * Single responsibility: Implementasi Monad untuk membungkus sukses/gagal suatu operasi.
 * Mencegah penggunaan try/catch yang kotor di seluruh aplikasi (synchronous pattern).
 */
class Result {
  constructor(isSuccess, value, error) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  static ok(value) {
    return new Result(true, value, null);
  }

  static fail(error) {
    return new Result(false, null, error);
  }

  static try(fn) {
    try {
      return Result.ok(fn());
    } catch (e) {
      // Bungkus error mentah bawaan JS menjadi AppError (Internal) jika belum
      const appError = e instanceof AppError ? e : new AppError(e.message, 'INTERNAL_ERROR', 500);
      return Result.fail(appError);
    }
  }

  isOk() {
    return this._isSuccess;
  }

  isFail() {
    return !this._isSuccess;
  }

  value() {
    if (!this._isSuccess) {
      throw new AppError("Mencoba mengambil value dari Result yang gagal", "RESULT_UNWRAP_ERROR", 500);
    }
    return this._value;
  }

  error() {
    if (this._isSuccess) {
      throw new AppError("Mencoba mengambil error dari Result yang sukses", "RESULT_ERROR_MISSING", 500);
    }
    return this._error;
  }

  unwrap() {
    if (this._isSuccess) return this._value;
    throw this._error;
  }

  map(fn) {
    if (this.isFail()) return this;
    return Result.try(() => fn(this._value));
  }

  flatMap(fn) {
    if (this.isFail()) return this;
    return fn(this._value); // fn harus me-return instance Result
  }

  getOrElse(defaultValue) {
    return this.isOk() ? this._value : defaultValue;
  }
}