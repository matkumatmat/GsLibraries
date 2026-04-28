// src/server/application/_Container.js

/**
 * Container
 * Single responsibility: Service Registry & Dependency Injection (IoC Container).
 * Mengelola instansiasi service/repo secara terpusat agar tidak tight-coupling.
 */
class Container {



  /**
   * Mendaftarkan cara membuat sebuah service
   * @param {string} key - Nama service (contoh: 'CustomerService')
   * @param {Function} factory - Fungsi yang me-return instance
   * @param {boolean} singleton - Apakah instance harus di-cache (default true)
   */
  static bind(key, factory, singleton = true) {
    this._factories.set(key, { factory, singleton });
  }

  /**
   * Mengambil instance dari service yang sudah didaftarkan
   */
  static make(key) {
    if (!this._factories.has(key)) {
      throw new AppError(`Dependency [${key}] belum didaftarkan di Container.`, "DI_ERROR", 500);
    }

    const binding = this._factories.get(key);

    if (binding.singleton) {
      if (!this._instances.has(key)) {
        this._instances.set(key, binding.factory());
      }
      return this._instances.get(key);
    }

    return binding.factory();
  }

  static clear() {
    this._instances.clear();
  }

}