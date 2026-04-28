
// src/server/application/_Kernel.js

/**
 * Kernel
 * Single responsibility: Pusat bootstrap aplikasi. 
 * Menyiapkan environment, dependencies, dan mengembalikan Router untuk dieksekusi.
 */
class Kernel {


  static boot() {
    if (this._booted) return Router;

    // Load Environment Variables
    EnvConfig.all();

    // Di sini lu bisa naruh registrasi default Middleware / Logger nanti
    
    this._booted = true;
    return Router;
  }

  static env() {
    return EnvConfig.get('APP_ENV', 'dev');
  }

}