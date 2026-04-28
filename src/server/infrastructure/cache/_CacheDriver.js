// src/server/infrasctructure/cache/_CacheDriver.js

/**
 * CacheDriver
 * Single responsibility: Abstraksi mentah dari ScriptCache dengan fitur auto-chunking.
 * Menyelamatkan aplikasi dari silent fail ketika menyimpan data > 100KB.
 */
class CacheDriver {
  static get MAX_CHUNK_SIZE() { return 100000; } // 100KB per entri (Batas aman GAS)
  static get cache() { return CacheService.getScriptCache(); }

  static set(key, value, ttlSeconds = 21600) { // Max TTL GAS = 6 jam
    const jsonStr = JSON.stringify(value);
    
    // Jika ukuran aman, simpan langsung
    if (jsonStr.length <= this.MAX_CHUNK_SIZE) {
      this.cache.put(key, jsonStr, ttlSeconds);
      this.cache.put(`${key}_meta`, JSON.stringify({ chunks: 1 }), ttlSeconds);
      return;
    }

    // Jika melebihi limit, pecah menjadi beberapa chunk
    const chunks = Math.ceil(jsonStr.length / this.MAX_CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      const chunkStr = jsonStr.substring(i * this.MAX_CHUNK_SIZE, (i + 1) * this.MAX_CHUNK_SIZE);
      this.cache.put(`${key}_chunk_${i}`, chunkStr, ttlSeconds);
    }
    
    // Simpan meta info untuk proses re-assembly saat get()
    this.cache.put(`${key}_meta`, JSON.stringify({ chunks }), ttlSeconds);
  }

  static get(key) {
    const metaStr = this.cache.get(`${key}_meta`);
    if (!metaStr) return null;

    const meta = JSON.parse(metaStr);
    
    // Jika tidak di-chunk
    if (meta.chunks === 1) {
      const data = this.cache.get(key);
      return data ? JSON.parse(data) : null;
    }

    // Jika di-chunk, rakit kembali (Re-assembly)
    let fullData = '';
    for (let i = 0; i < meta.chunks; i++) {
      const chunk = this.cache.get(`${key}_chunk_${i}`);
      if (!chunk) return null; // Jika ada 1 chunk saja yang hilang/expired, anggap cache rusak
      fullData += chunk;
    }
    return JSON.parse(fullData);
  }

  static delete(key) {
    const metaStr = this.cache.get(`${key}_meta`);
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      for (let i = 0; i < meta.chunks; i++) {
        this.cache.remove(`${key}_chunk_${i}`);
      }
      this.cache.remove(`${key}_meta`);
    }
    this.cache.remove(key);
  }
}