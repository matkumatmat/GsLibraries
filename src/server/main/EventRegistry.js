// src/server/main/EventRegistry.js

/**
 * EventRegistry
 * Tempat mendaftarkan pemetaan antara Nama Event dengan Class Listener-nya.
 */
const EventRegistry = {
  // Format:
  // 'NAMA_EVENT': [ListenerClass1, ListenerClass2]

  'USER_REGISTERED': [
    // Contoh: WelcomeEmailListener,
    // Contoh: AuditListener
  ],

  'CACHE_FLUSH_REQUESTED': [
    // CacheInvalidateListener
  ]
};

// Fungsi boot untuk meregistrasikan semua event saat aplikasi menyala
class EventBootstrapper {
  static boot() {
    for (const [eventName, listeners] of Object.entries(EventRegistry)) {
      listeners.forEach(ListenerClass => {
        EventBus.on(eventName, ListenerClass);
      });
    }
  }
}