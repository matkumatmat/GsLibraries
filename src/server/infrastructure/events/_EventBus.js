class EventBus {
  static on(eventName, listenerClass) {
    // Lazy init
    this._listeners = this._listeners || {};
    
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(listenerClass);
  }

  static emit(eventName, payload) {
    this._listeners = this._listeners || {};
    if (!this._listeners[eventName]) return;
    
    for (const Listener of this._listeners[eventName]) {
      Listener.handle(payload);
    }
  }

  static emitSafe(eventName, payload) {
    this._listeners = this._listeners || {};
    if (!this._listeners[eventName]) return;
    
    for (const Listener of this._listeners[eventName]) {
      try {
        Listener.handle(payload);
      } catch (e) {
        console.error(`[EventBus Safe Emit] Error di event ${eventName}:`, e);
      }
    }
  }
}