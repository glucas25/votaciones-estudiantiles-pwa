// src/services/database-indexeddb.js
// Native IndexedDB implementation without PouchDB
// Performance optimized for 1000+ students

console.log('🔧 Initializing IndexedDB service...')

// Import performance monitor and smart cache
import performanceMonitor from '../utils/performanceMonitor.js';
import smartCache from '../utils/smartCache.js';

// Database configuration
const DB_NAME = 'votaciones_estudiantiles_2024'
const DB_VERSION = 3  // Incremented for new performance indexes

// Object stores (tables)
const STORES = {
  students: 'students',
  candidates: 'candidates',
  votes: 'votes',
  sessions: 'sessions',
  election_config: 'election_config',
  activation_codes: 'activation_codes'  // Nueva tabla para códigos dinámicos
}

// Document types for consistency
export const DOC_TYPES = {
  STUDENT: 'student',
  CANDIDATE: 'candidate',
  LIST: 'list',  // Nuevo tipo para listas electorales
  VOTE: 'vote',
  SESSION: 'session',
  CONFIG: 'election_config',
  BACKUP: 'backup',
  ACTIVATION_CODE: 'activation_code'  // Nuevo tipo para códigos
}

// Education levels - configurable
export const DEFAULT_EDUCATION_LEVELS = {
  PREPARATORIA: 'PREPARATORIA',
  BACHILLERATO: 'BACHILLERATO',
  BASICA_SUPERIOR: 'BASICA_SUPERIOR', 
  BASICA_MEDIA: 'BASICA_MEDIA',
  BASICA_ELEMENTAL: 'BASICA_ELEMENTAL'
}

// Education level display names (configurable)
export const EDUCATION_LEVEL_NAMES = {
  PREPARATORIA: 'Preparatoria',
  BACHILLERATO: 'Bachillerato',
  BASICA_SUPERIOR: 'Básica Superior',
  BASICA_MEDIA: 'Básica Media',
  BASICA_ELEMENTAL: 'Básica Elemental'
}

// For backward compatibility
export const EDUCATION_LEVELS = DEFAULT_EDUCATION_LEVELS

class IndexedDBService {
  constructor() {
    this.db = null
    this.isInitialized = false
    this.initPromise = this.initializeDatabase()
  }

  /**
   * Initialize IndexedDB database
   */
  async initializeDatabase() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Opening IndexedDB database...')
      
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('❌ Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log('✅ IndexedDB database opened successfully')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        console.log('🔄 Upgrading database schema...')
        const db = event.target.result

        // Create object stores
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: '_id',
              autoIncrement: false 
            })
            
            // Create optimized indexes for performance
            store.createIndex('type', 'type', { unique: false })
            store.createIndex('createdAt', 'createdAt', { unique: false })
            store.createIndex('updatedAt', 'updatedAt', { unique: false })
            
            // Store-specific optimized indexes
            if (storeName === 'students') {
              // Basic indexes
              store.createIndex('level', 'level', { unique: false })
              store.createIndex('course', 'course', { unique: false })
              store.createIndex('cedula', 'cedula', { unique: true })
              store.createIndex('status', 'status', { unique: false })
              store.createIndex('absent', 'absent', { unique: false })
              store.createIndex('votado', 'votado', { unique: false })
              
              // Composite indexes for complex queries (performance critical)
              store.createIndex('type_course', ['type', 'course'], { unique: false })
              store.createIndex('course_status', ['course', 'status'], { unique: false })
              store.createIndex('level_course', ['level', 'course'], { unique: false })
              store.createIndex('status_absent', ['status', 'absent'], { unique: false })
              
              // Search optimization indexes
              store.createIndex('nombres', 'nombres', { unique: false })
              store.createIndex('apellidos', 'apellidos', { unique: false })
              
            } else if (storeName === 'candidates') {
              // Basic indexes
              store.createIndex('level', 'level', { unique: false })
              store.createIndex('cargo', 'cargo', { unique: false })
              store.createIndex('listName', 'listName', { unique: false })
              store.createIndex('presidentName', 'presidentName', { unique: false })
              store.createIndex('vicePresidentName', 'vicePresidentName', { unique: false })
              
              // Composite indexes for electoral lists
              store.createIndex('type_listName', ['type', 'listName'], { unique: false })
              
            } else if (storeName === 'votes') {
              // Basic indexes
              store.createIndex('studentId', 'studentId', { unique: false })
              store.createIndex('candidateId', 'candidateId', { unique: false })
              store.createIndex('listId', 'listId', { unique: false })
              store.createIndex('timestamp', 'timestamp', { unique: false })
              
              // Composite indexes for vote analysis
              store.createIndex('type_timestamp', ['type', 'timestamp'], { unique: false })
              store.createIndex('studentId_timestamp', ['studentId', 'timestamp'], { unique: false })
              store.createIndex('listId_timestamp', ['listId', 'timestamp'], { unique: false })
              
            } else if (storeName === 'activation_codes') {
              // Basic indexes
              store.createIndex('code', 'code', { unique: true })
              store.createIndex('course', 'course', { unique: false })
              store.createIndex('is_active', 'is_active', { unique: false })
              store.createIndex('generated_at', 'generated_at', { unique: false })
              
              // Composite indexes for code management
              store.createIndex('is_active_course', ['is_active', 'course'], { unique: false })
            }
            
            console.log(`📊 Created object store: ${storeName}`)
          }
        })
      }
    })
  }

  /**
   * Ensure database is ready
   */
  async ensureReady() {
    if (!this.isInitialized) {
      await this.initPromise
    }
    return this.db
  }

  /**
   * Generate unique ID
   */
  generateId(type, ...parts) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${type}_${parts.join('_')}_${timestamp}_${random}`
  }

  /**
   * Create document
   */
  async createDocument(storeName, document, type) {
    try {
      await this.ensureReady()

      const docWithMeta = {
        ...document,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _id: document._id || this.generateId(type, document.cedula || document.nombre || 'doc')
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.add(docWithMeta)

        request.onsuccess = () => {
          console.log(`✅ Document created in ${storeName}:`, docWithMeta._id)
          resolve({ 
            success: true, 
            id: docWithMeta._id, 
            rev: Date.now().toString() 
          })
        }

        request.onerror = () => {
          console.error(`❌ Failed to create document in ${storeName}:`, request.error)
          reject(request.error)
        }
      })

    } catch (error) {
      console.error(`❌ Create document error:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Find documents with query (Performance Optimized)
   */
  async findDocuments(storeName, query = {}) {
    const timer = performanceMonitor?.startTimer('indexedDBQuery');
    
    try {
      await this.ensureReady()

      // Generate cache key for this query
      const cacheKey = this.generateCacheKey(storeName, query);
      
      // Try to get from cache first (for read-heavy operations)
      if (this.isCacheableQuery(storeName, query)) {
        const cached = smartCache.get(cacheKey, this.getCacheType(storeName));
        if (cached) {
          timer?.end({ 
            storeName, 
            queryType: 'find',
            cached: true,
            resultCount: cached.docs?.length || 0 
          });
          return cached;
        }
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        
        // Use optimized index queries when possible
        const indexQuery = this.optimizeQuery(store, query);
        const request = indexQuery || store.getAll();

        request.onsuccess = () => {
          let documents = request.result || []
          
          // Apply selector filter (only if not using index)
          if (query.selector && !indexQuery) {
            documents = this.filterDocuments(documents, query.selector)
          }

          // Apply limit
          if (query.limit) {
            documents = documents.slice(0, query.limit)
          }

          const result = {
            success: true,
            docs: documents,
            total: documents.length
          };

          // Cache the result if appropriate
          if (this.isCacheableQuery(storeName, query)) {
            smartCache.set(cacheKey, result, this.getCacheType(storeName));
          }

          timer?.end({ 
            storeName, 
            queryType: 'find',
            cached: false,
            resultCount: documents.length,
            indexUsed: !!indexQuery
          });

          resolve(result);
        }

        request.onerror = () => {
          console.error(`❌ Failed to find documents in ${storeName}:`, request.error)
          timer?.end({ 
            storeName, 
            queryType: 'find',
            error: request.error.message 
          });
          reject(request.error)
        }
      })

    } catch (error) {
      console.error(`❌ Find documents error:`, error)
      timer?.end({ 
        storeName, 
        queryType: 'find',
        error: error.message 
      });
      return { success: false, docs: [], total: 0, error: error.message }
    }
  }

  /**
   * Generate cache key for query
   */
  generateCacheKey(storeName, query) {
    const queryStr = JSON.stringify(query);
    return `query-${storeName}-${btoa(queryStr).substring(0, 20)}`;
  }

  /**
   * Check if query should be cached
   */
  isCacheableQuery(storeName, query) {
    // Cache simple queries without complex selectors
    if (storeName === 'candidates' && query.selector?.type === 'list') {
      return true; // Electoral lists change rarely
    }
    
    if (storeName === 'students' && query.selector?.course) {
      return true; // Students by course are frequently accessed
    }
    
    // Don't cache complex queries or write operations
    return false;
  }

  /**
   * Get cache type for store
   */
  getCacheType(storeName) {
    const typeMap = {
      'candidates': 'electoralLists',
      'students': 'students',
      'votes': 'votes',
    };
    return typeMap[storeName] || 'default';
  }

  /**
   * Optimize query using indexes
   */
  optimizeQuery(store, query) {
    if (!query.selector) return null;
    
    const selector = query.selector;
    
    // Try to use composite indexes first (most efficient)
    if (selector.type && selector.course) {
      try {
        const index = store.index('type_course');
        return index.getAll([selector.type, selector.course]);
      } catch (e) {
        // Index doesn't exist, fall back
      }
    }
    
    if (selector.course && selector.status) {
      try {
        const index = store.index('course_status');
        return index.getAll([selector.course, selector.status]);
      } catch (e) {
        // Index doesn't exist, fall back
      }
    }
    
    // Try single column indexes
    if (selector.type) {
      try {
        const index = store.index('type');
        return index.getAll(selector.type);
      } catch (e) {
        // Index doesn't exist, fall back
      }
    }
    
    if (selector.course) {
      try {
        const index = store.index('course');
        return index.getAll(selector.course);
      } catch (e) {
        // Index doesn't exist, fall back
      }
    }
    
    if (selector.cedula) {
      try {
        const index = store.index('cedula');
        return index.get(selector.cedula);
      } catch (e) {
        // Index doesn't exist, fall back
      }
    }
    
    // No suitable index found
    return null;
  }

  /**
   * Filter documents based on selector
   */
  filterDocuments(docs, selector) {
    return docs.filter(doc => {
      for (const [key, value] of Object.entries(selector)) {
        if (key === '$or') {
          const matches = value.some(condition => 
            this.matchesCondition(doc, condition)
          )
          if (!matches) return false
        } else {
          if (!this.matchesCondition(doc, { [key]: value })) {
            return false
          }
        }
      }
      return true
    })
  }

  /**
   * Check if document matches condition
   */
  matchesCondition(doc, condition) {
    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === 'object' && value !== null) {
        if (value.$regex) {
          const regex = new RegExp(value.$regex, 'i')
          if (!regex.test(doc[key] || '')) return false
        } else {
          if (doc[key] !== value) return false
        }
      } else {
        if (doc[key] !== value) return false
      }
    }
    return true
  }

  /**
   * Update document (Performance Optimized)
   */
  async updateDocument(storeName, document) {
    const timer = performanceMonitor?.startTimer('indexedDBUpdate');
    
    try {
      await this.ensureReady()

      const docWithMeta = {
        ...document,
        updatedAt: new Date().toISOString()
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.put(docWithMeta)

        request.onsuccess = () => {
          console.log(`✅ Document updated in ${storeName}:`, document._id)
          
          // Invalidate related cache entries
          this.invalidateRelatedCache(storeName, document);
          
          timer?.end({ storeName, queryType: 'update', documentId: document._id });
          
          resolve({ 
            success: true, 
            id: document._id, 
            rev: Date.now().toString() 
          })
        }

        request.onerror = () => {
          console.error(`❌ Failed to update document in ${storeName}:`, request.error)
          timer?.end({ 
            storeName, 
            queryType: 'update', 
            error: request.error.message 
          });
          reject(request.error)
        }
      })

    } catch (error) {
      console.error(`❌ Update document error:`, error)
      timer?.end({ 
        storeName, 
        queryType: 'update', 
        error: error.message 
      });
      return { success: false, error: error.message }
    }
  }

  /**
   * Invalidate cache entries related to a document update
   */
  invalidateRelatedCache(storeName, document) {
    // Invalidate queries that might be affected by this update
    if (storeName === 'students') {
      // Invalidate student course cache
      if (document.course) {
        smartCache.invalidatePattern(`students-course-${document.course}`);
      }
      
      // Invalidate search results cache
      smartCache.invalidatePattern('search-');
      
      // Invalidate stats cache
      smartCache.invalidatePattern('stats-');
      
    } else if (storeName === 'candidates') {
      // Invalidate electoral lists cache
      smartCache.invalidatePattern('electoral-lists');
      
    } else if (storeName === 'votes') {
      // Invalidate vote-related caches
      smartCache.invalidatePattern('stats-');
      smartCache.invalidatePattern('votes-');
    }
    
    console.log(`🔄 Cache invalidated for ${storeName} update`);
  }

  /**
   * Delete document
   */
  async deleteDocument(storeName, id, rev) {
    try {
      await this.ensureReady()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.delete(id)

        request.onsuccess = () => {
          console.log(`✅ Document deleted from ${storeName}:`, id)
          resolve({ 
            success: true, 
            id: id, 
            rev: rev 
          })
        }

        request.onerror = () => {
          console.error(`❌ Failed to delete document from ${storeName}:`, request.error)
          reject(request.error)
        }
      })

    } catch (error) {
      console.error(`❌ Delete document error:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Bulk create documents
   */
  async bulkCreate(storeName, documents, type) {
    try {
      await this.ensureReady()

      const docsWithMeta = documents.map((doc, index) => ({
        ...doc,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _id: doc._id || this.generateId(type, doc.cedula || doc.nombre || index.toString())
      }))

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        let completed = 0
        let successful = 0
        const results = []

        docsWithMeta.forEach((doc, index) => {
          const request = store.add(doc)
          
          request.onsuccess = () => {
            successful++
            results.push({ ok: true, id: doc._id })
            completed++
            
            if (completed === docsWithMeta.length) {
              console.log(`✅ Bulk created ${successful}/${docsWithMeta.length} documents in ${storeName}`)
              resolve({
                success: true,
                results,
                successful,
                total: docsWithMeta.length
              })
            }
          }

          request.onerror = () => {
            results.push({ error: request.error.message, id: doc._id })
            completed++
            
            if (completed === docsWithMeta.length) {
              resolve({
                success: successful > 0,
                results,
                successful,
                total: docsWithMeta.length
              })
            }
          }
        })

        if (docsWithMeta.length === 0) {
          resolve({
            success: true,
            results: [],
            successful: 0,
            total: 0
          })
        }
      })

    } catch (error) {
      console.error(`❌ Bulk create error:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(storeName, query, fields = ['nombre', 'apellidos', 'cedula']) {
    try {
      const searchQuery = {
        selector: {
          $or: fields.map(field => ({
            [field]: { $regex: query }
          }))
        },
        limit: 50
      }
      
      const result = await this.findDocuments(storeName, searchQuery)
      return {
        success: true,
        docs: result.docs,
        total: result.docs.length
      }
      
    } catch (error) {
      console.error(`Search failed in ${storeName}:`, error)
      return {
        success: false,
        docs: [],
        total: 0,
        error: error.message
      }
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      await this.ensureReady()

      const stats = {}
      
      for (const storeName of Object.values(STORES)) {
        try {
          const result = await this.findDocuments(storeName, {})
          stats[storeName] = {
            name: storeName,
            docs: result.total,
            size: JSON.stringify(result.docs).length,
            updateSeq: Date.now()
          }
        } catch (error) {
          stats[storeName] = { error: error.message }
        }
      }
      
      return {
        databases: stats,
        performance: {
          queries: 0,
          queryTime: 0,
          cacheHits: 0,
          averageQueryTime: 0,
          cacheSize: 0
        }
      }
    } catch (error) {
      console.error('❌ Get stats error:', error)
      return { databases: {}, performance: {} }
    }
  }

  /**
   * Export all data
   */
  async exportAllData() {
    try {
      await this.ensureReady()
      
      const exportData = {}
      
      for (const storeName of Object.values(STORES)) {
        try {
          const result = await this.findDocuments(storeName, {})
          exportData[storeName] = result.docs
        } catch (error) {
          console.error(`Failed to export ${storeName}:`, error)
          exportData[storeName] = { error: error.message }
        }
      }
      
      return exportData
    } catch (error) {
      console.error('❌ Export data error:', error)
      return {}
    }
  }

  /**
   * Import backup data
   */
  async importBackupData(backupData) {
    try {
      await this.ensureReady()
      
      const results = {}
      
      for (const [storeName, docs] of Object.entries(backupData)) {
        if (Object.values(STORES).includes(storeName) && Array.isArray(docs)) {
          // Clear existing data first
          await this.clearStore(storeName)
          
          // Import new data
          if (docs.length > 0) {
            const result = await this.bulkCreate(storeName, docs, docs[0].type || 'document')
            results[storeName] = result
          }
        }
      }
      
      console.log('✅ Backup data imported successfully')
      return { success: true, results }
      
    } catch (error) {
      console.error('❌ Failed to import backup data:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Clear all documents from a store
   */
  async clearStore(storeName) {
    try {
      await this.ensureReady()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => {
          console.log(`🗑️ Cleared store: ${storeName}`)
          resolve()
        }

        request.onerror = () => {
          console.error(`❌ Failed to clear store ${storeName}:`, request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error(`❌ Clear store error:`, error)
      throw error
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus() {
    const status = {
      local: this.isInitialized,
      online: navigator.onLine,
      databases: {}
    }
    
    if (this.isInitialized) {
      for (const storeName of Object.values(STORES)) {
        try {
          const result = await this.findDocuments(storeName, { limit: 1 })
          status.databases[storeName] = {
            ready: true,
            docs: result.total || 0,
            size: 0
          }
        } catch (error) {
          status.databases[storeName] = {
            ready: false,
            error: error.message
          }
        }
      }
    }
    
    return status
  }

  /**
   * Clear cache utility
   */
  clearAllCache() {
    console.log('🧹 Cache cleared (IndexedDB version)')
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized
  }
}

// Create singleton instance
const databaseService = new IndexedDBService()

export default databaseService
export { databaseService }