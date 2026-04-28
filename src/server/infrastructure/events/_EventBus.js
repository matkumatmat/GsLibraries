// src/server/infrastructure/events/_EventBus.js

/**
 * EventBus
 * Single responsibility: Menjadi pusat (Hub) komunikasi Pub/Sub antar modul secara Synchronous.
 * Membantu decoupling kode. Contoh: Service nyimpan data -> Emit Event -> Listener ngirim Email.
 */
class EventBus {
  static _listeners = {};

  /**
   * Mendaftarkan listener ke sebuah event.
   * Biasanya dipanggil saat inisialisasi awal (booting).
   */
  static on(eventName, listenerClass) {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(listenerClass);
  }

  /**
   * Men-trigger semua listener yang terdaftar pada event tersebut.
   * Berjalan Synchronous. Jika salah satu listener error, akan throw exception.
   */
  static emit(eventName, payload) {
    if (!this._listeners[eventName]) return;
    
    for (const Listener of this._listeners[eventName]) {
      Listener.handle(payload);
    }
  }

  /**
   * Sama seperti emit, tapi menelan (swallow) error jika listener gagal.
   * Cocok untuk side-effect non-kritis seperti invalidasi cache atau analitik.
   */
  static emitSafe(eventName, payload) {
    if (!this._listeners[eventName]) return;
    
    for (const Listener of this._listeners[eventName]) {
      try {
        Listener.handle(payload);
      } catch (e) {
        // Log secara internal agar tidak menumbangkan proses utama
        console.error(`[EventBus Safe Emit] Error di ${Listener.name} untuk event ${eventName}:`, e);
      }
    }
  }
}