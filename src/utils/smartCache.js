// Smart Cache System para optimización de performance
// Caching inteligente para listas electorales y datos frecuentes

class SmartCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.accessCount = new Map();
    this.maxSize = 50; // Máximo número de entradas en cache
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
    this.cleanupInterval = null;
    
    // TTL específicos por tipo de dato
    this.ttlConfig = {
      electoralLists: 10 * 60 * 1000, // 10 minutos - cambian poco
      students: 2 * 60 * 1000, // 2 minutos - pueden cambiar estado
      searchResults: 30 * 1000, // 30 segundos - pueden cambiar frecuentemente
      votes: 1 * 60 * 1000, // 1 minuto - críticos para consistencia
      stats: 30 * 1000, // 30 segundos - se actualizan frecuentemente
    };
    
    this.startCleanupTimer();
    console.log('🧠 Smart Cache initialized');
  }

  /**
   * Obtener datos del cache
   */
  get(key, type = 'default') {
    const cacheEntry = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    if (!cacheEntry || !timestamp) {
      return null;
    }
    
    const ttl = this.ttlConfig[type] || this.defaultTTL;
    const age = Date.now() - timestamp;
    
    if (age > ttl) {
      // Entrada expirada
      this.delete(key);
      return null;
    }
    
    // Incrementar contador de acceso
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    
    console.log(`🎯 Cache hit: ${key} (age: ${age}ms, type: ${type})`);
    return cacheEntry;
  }

  /**
   * Guardar datos en cache
   */
  set(key, value, type = 'default') {
    // Si el cache está lleno, limpiar entradas menos usadas
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.accessCount.set(key, 1);
    
    console.log(`💾 Cache set: ${key} (type: ${type})`);
  }

  /**
   * Eliminar entrada del cache
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.accessCount.delete(key);
    console.log(`🗑️ Cache deleted: ${key}`);
  }

  /**
   * Limpiar cache completo
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.accessCount.clear();
    console.log('🧹 Cache cleared completely');
  }

  /**
   * Eliminar entradas menos usadas (LRU)
   */
  evictLeastUsed() {
    if (this.cache.size === 0) return;
    
    // Encontrar la entrada menos usada
    let leastUsedKey = null;
    let leastUsedCount = Infinity;
    
    for (const [key, count] of this.accessCount.entries()) {
      if (count < leastUsedCount) {
        leastUsedCount = count;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.delete(leastUsedKey);
      console.log(`🔄 Evicted least used: ${leastUsedKey} (count: ${leastUsedCount})`);
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      const age = now - timestamp;
      const type = this.getTypeFromKey(key);
      const ttl = this.ttlConfig[type] || this.defaultTTL;
      
      if (age > ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Obtener tipo de datos basado en la clave
   */
  getTypeFromKey(key) {
    if (key.includes('electoral-lists')) return 'electoralLists';
    if (key.includes('students')) return 'students';
    if (key.includes('search')) return 'searchResults';
    if (key.includes('votes')) return 'votes';
    if (key.includes('stats')) return 'stats';
    return 'default';
  }

  /**
   * Iniciar timer de limpieza automática
   */
  startCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Limpiar cada minuto
  }

  /**
   * Detener timer de limpieza
   */
  stopCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()).map(key => ({
        key,
        age: Date.now() - (this.timestamps.get(key) || 0),
        accessCount: this.accessCount.get(key) || 0,
        type: this.getTypeFromKey(key)
      }))
    };
  }

  /**
   * Invalidar cache por patrón
   */
  invalidatePattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`🔄 Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
  }

  /**
   * Memoizar función con cache automático
   */
  memoize(fn, keyGenerator, type = 'default') {
    return async (...args) => {
      const key = keyGenerator(...args);
      
      // Intentar obtener del cache
      const cached = this.get(key, type);
      if (cached !== null) {
        return cached;
      }
      
      // Ejecutar función y cachear resultado
      const result = await fn(...args);
      this.set(key, result, type);
      
      return result;
    };
  }

  /**
   * Cache específico para listas electorales
   */
  cacheElectoralLists(lists) {
    this.set('electoral-lists-all', lists, 'electoralLists');
    
    // Cache individual por lista
    lists.forEach(list => {
      this.set(`electoral-list-${list._id}`, list, 'electoralLists');
    });
  }

  /**
   * Obtener listas electorales del cache
   */
  getElectoralLists() {
    return this.get('electoral-lists-all', 'electoralLists');
  }

  /**
   * Cache específico para estudiantes por curso
   */
  cacheStudentsByCourse(course, students) {
    this.set(`students-course-${course}`, students, 'students');
  }

  /**
   * Obtener estudiantes por curso del cache
   */
  getStudentsByCourse(course) {
    return this.get(`students-course-${course}`, 'students');
  }

  /**
   * Cache específico para resultados de búsqueda
   */
  cacheSearchResults(query, results, type = 'general') {
    const key = `search-${type}-${query.toLowerCase().replace(/\s+/g, '-')}`;
    this.set(key, results, 'searchResults');
  }

  /**
   * Obtener resultados de búsqueda del cache
   */
  getSearchResults(query, type = 'general') {
    const key = `search-${type}-${query.toLowerCase().replace(/\s+/g, '-')}`;
    return this.get(key, 'searchResults');
  }

  /**
   * Cache específico para estadísticas
   */
  cacheStats(statsType, stats) {
    this.set(`stats-${statsType}`, stats, 'stats');
  }

  /**
   * Obtener estadísticas del cache
   */
  getCachedStats(statsType) {
    return this.get(`stats-${statsType}`, 'stats');
  }

  /**
   * Destructor
   */
  destroy() {
    this.stopCleanupTimer();
    this.clear();
    console.log('💥 Smart Cache destroyed');
  }
}

// Crear instancia global
const smartCache = new SmartCache();

// Limpiar cache cuando se recarga la página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    smartCache.destroy();
  });
  
  // Exponer para debugging
  window.smartCache = smartCache;
}

export default smartCache;