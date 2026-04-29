class Container {
  static bind(key, factory, singleton = true) {
    // Lazy init: Kalau undefined, bikin Map baru
    this._factories = this._factories || new Map();
    
    this._factories.set(key, { factory, singleton });
  }

  static make(key) {
    this._factories = this._factories || new Map();
    this._instances = this._instances || new Map();

    if (!this._factories.has(key)) {
      throw new Error(`Dependency [${key}] belum didaftarkan di Container.`);
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
    if (this._instances) this._instances.clear();
  }
}