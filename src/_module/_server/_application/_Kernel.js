// src/server/application/_Kernel.js

class Kernel {
  /**
   * @param {Array<Function>} bootstrappers - Kumpulan fungsi setup dari spesifik project
   */
  static boot(bootstrappers = []) {
    if (this._booted) return Router;

    // 1. Load Environment Variables bawaan framework
    EnvConfig.all();

    // 2. Jalankan semua custom bootstrapper dari project spesifik
    // (misal: register Container bindings, Event listeners, global middlewares)
    for (const setupFn of bootstrappers) {
      setupFn();
    }
    
    this._booted = true;
    return Router;
  }

  static env() {
    return EnvConfig.get('APP_ENV', 'dev');
  }
}