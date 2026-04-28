// src/server/infrastructure/events/_BaseListener.js

/**
 * BaseListener
 * Single responsibility: Kontrak untuk semua class Listener.
 * Memastikan semua listener memiliki format penanganan event yang seragam.
 */
class BaseListener {
  /**
   * Nama event yang akan didengarkan oleh listener ini.
   * Harus di-override oleh subclass.
   */
  static get eventName() {
    throw new AppError('eventName must be overridden', 'EVENT_ERROR', 500);
  }

  /**
   * Logika eksekusi ketika event di-emit.
   * Harus di-override oleh subclass.
   */
  static handle(payload) {
    throw new AppError('handle() method must be overridden', 'EVENT_ERROR', 500);
  }
}