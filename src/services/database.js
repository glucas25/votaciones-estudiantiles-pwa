// src/services/database.js
import PouchDB from 'pouchdb'

// Simple PouchDB setup without plugins initially
// Plugins will be loaded dynamically when needed
console.log('🔧 Initializing PouchDB service...')

// Database configuration
const DB_CONFIG = {
  students: 'votaciones_students_2024',
  candidates: 'votaciones_candidates_2024', 
  votes: 'votaciones_votes_2024',
  sessions: 'votaciones_sessions_2024',
  election_config: 'votaciones_config_2024'
}

// Document types for consistency
export const DOC_TYPES = {
  STUDENT: 'student',
  CANDIDATE: 'candidate',
  VOTE: 'vote',
  SESSION: 'session',
  CONFIG: 'election_config',
  BACKUP: 'backup'
}

// Education levels
export const EDUCATION_LEVELS = {
  BACHILLERATO: 'BACHILLERATO',
  BASICA_SUPERIOR: 'BASICA_SUPERIOR', 
  BASICA_MEDIA: 'BASICA_MEDIA',
  BASICA_ELEMENTAL: 'BASICA_ELEMENTAL'
}

// Performance metrics
const performanceMetrics = {
  queries: 0,
  queryTime: 0,
  cacheHits: 0,
  lastCompaction: null
}

// In-memory cache for frequent queries
const queryCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

class DatabaseService {
  constructor() {
    this.dbs = {}
    this.isInitialized = false
    this.syncStatus = {}
    this.backupInterval = null
    
    // Initialize all databases
    this.initializeDatabases()
  }

  /**
   * Initialize all PouchDB databases
   */
  async initializeDatabases() {
    try {
      console.log('🚀 Initializing PouchDB databases...')
      
      // Create all databases
      for (const [key, dbName] of Object.entries(DB_CONFIG)) {
        this.dbs[key] = new PouchDB(dbName)
        this.syncStatus[key] = {
          status: 'ready',
          lastOperation: null,
          error: null
        }
      }
      
      // Create indexes for optimal performance
      await this.createIndexes()
      
      // Setup automatic compaction
      this.setupAutoCompaction()
      
      // Start backup system
      this.startBackupSystem()
      
      this.isInitialized = true
      console.log('✅ All databases initialized successfully')
      
      return { success: true, databases: Object.keys(this.dbs) }
    } catch (error) {
      console.error('❌ Failed to initialize databases:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create optimized indexes for all databases
   */
  async createIndexes() {
    try {
      // Students indexes
      await this.dbs.students.createIndex({
        index: { fields: ['type', 'level', 'course'] }
      })
      await this.dbs.students.createIndex({
        index: { fields: ['type', 'cedula'] }
      })
      await this.dbs.students.createIndex({
        index: { fields: ['type', 'status'] }
      })
      await this.dbs.students.createIndex({
        index: { fields: ['type', 'course', 'numero'] }
      })

      // Candidates indexes
      await this.dbs.candidates.createIndex({
        index: { fields: ['type', 'level', 'cargo'] }
      })
      await this.dbs.candidates.createIndex({
        index: { fields: ['type', 'ticketId'] }
      })

      // Votes indexes
      await this.dbs.votes.createIndex({
        index: { fields: ['type', 'studentId'] }
      })
      await this.dbs.votes.createIndex({
        index: { fields: ['type', 'candidateId'] }
      })
      await this.dbs.votes.createIndex({
        index: { fields: ['type', 'level', 'course'] }
      })
      await this.dbs.votes.createIndex({
        index: { fields: ['type', 'timestamp'] }
      })

      // Sessions indexes
      await this.dbs.sessions.createIndex({
        index: { fields: ['type', 'course'] }
      })
      await this.dbs.sessions.createIndex({
        index: { fields: ['type', 'status'] }
      })

      // Config indexes
      await this.dbs.election_config.createIndex({
        index: { fields: ['type', 'key'] }
      })

      console.log('📊 Database indexes created successfully')
    } catch (error) {
      console.warn('⚠️ Some indexes may already exist:', error.message)
    }
  }

  /**
   * Generate consistent document ID
   */
  generateId(type, ...parts) {
    const timestamp = Date.now()
    return `${type}_${parts.join('_')}_${timestamp}`
  }

  /**
   * Create document with validation and performance tracking
   */
  async createDocument(dbName, document, type) {
    const startTime = performance.now()
    
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      // Add metadata
      const docWithMeta = {
        ...document,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Generate ID if not provided
      if (!docWithMeta._id) {
        docWithMeta._id = this.generateId(type, document.cedula || document.nombre || Math.random().toString(36).substr(2, 9))
      }

      const result = await this.dbs[dbName].post(docWithMeta)
      
      // Update performance metrics
      performanceMetrics.queries++
      performanceMetrics.queryTime += performance.now() - startTime
      
      // Clear related cache
      this.clearCacheByPattern(`${dbName}_${type}`)
      
      console.log(`✅ Document created in ${dbName}:`, result.id)
      return { success: true, id: result.id, rev: result.rev }
      
    } catch (error) {
      console.error(`❌ Failed to create document in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Find documents with caching and performance optimization
   */
  async findDocuments(dbName, query, useCache = true) {
    const startTime = performance.now()
    const cacheKey = `${dbName}_${JSON.stringify(query)}`
    
    // Check cache first
    if (useCache && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        performanceMetrics.cacheHits++
        return cached.data
      } else {
        queryCache.delete(cacheKey)
      }
    }

    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const result = await this.dbs[dbName].find(query)
      
      // Cache the result
      if (useCache) {
        queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }
      
      // Update performance metrics
      performanceMetrics.queries++
      performanceMetrics.queryTime += performance.now() - startTime
      
      return result
      
    } catch (error) {
      console.error(`❌ Failed to find documents in ${dbName}:`, error)
      return { docs: [], total: 0, limit: query.limit || 25, error: error.message }
    }
  }

  /**
   * Update document with optimistic locking
   */
  async updateDocument(dbName, document) {
    const startTime = performance.now()
    
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      // Add update timestamp
      const docWithMeta = {
        ...document,
        updatedAt: new Date().toISOString()
      }

      const result = await this.dbs[dbName].put(docWithMeta)
      
      // Update performance metrics
      performanceMetrics.queries++
      performanceMetrics.queryTime += performance.now() - startTime
      
      // Clear related cache
      this.clearCacheByPattern(`${dbName}_${document.type}`)
      
      console.log(`✅ Document updated in ${dbName}:`, result.id)
      return { success: true, id: result.id, rev: result.rev }
      
    } catch (error) {
      console.error(`❌ Failed to update document in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(dbName, id, rev) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const result = await this.dbs[dbName].remove(id, rev)
      
      // Clear related cache
      this.clearCacheByPattern(`${dbName}_`)
      
      console.log(`✅ Document deleted from ${dbName}:`, id)
      return { success: true, id: result.id, rev: result.rev }
      
    } catch (error) {
      console.error(`❌ Failed to delete document from ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Bulk operations for performance
   */
  async bulkCreate(dbName, documents, type) {
    const startTime = performance.now()
    
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      // Add metadata to all documents
      const docsWithMeta = documents.map((doc, index) => ({
        ...doc,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _id: doc._id || this.generateId(type, doc.cedula || doc.nombre || index.toString())
      }))

      const result = await this.dbs[dbName].bulkDocs(docsWithMeta)
      
      // Update performance metrics
      performanceMetrics.queries++
      performanceMetrics.queryTime += performance.now() - startTime
      
      // Clear related cache
      this.clearCacheByPattern(`${dbName}_${type}`)
      
      const successful = result.filter(r => !r.error).length
      console.log(`✅ Bulk created ${successful}/${documents.length} documents in ${dbName}`)
      
      return { 
        success: true, 
        results: result,
        successful,
        total: documents.length 
      }
      
    } catch (error) {
      console.error(`❌ Failed bulk create in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Search with full-text search capability
   */
  async searchDocuments(dbName, query, fields = ['nombre', 'apellidos', 'cedula']) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      // Always use fallback search method for compatibility
      const fallbackQuery = {
        selector: {
          $or: fields.map(field => ({
            [field]: { $regex: `(?i)${query}` }
          }))
        },
        limit: 50
      }
      
      const result = await this.findDocuments(dbName, fallbackQuery, false)
      return {
        success: true,
        docs: result.docs,
        total: result.docs.length
      }
      
    } catch (error) {
      console.error(`Search failed in ${dbName}:`, error)
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
    const stats = {}
    
    for (const [key, db] of Object.entries(this.dbs)) {
      try {
        const info = await db.info()
        stats[key] = {
          name: info.db_name,
          docs: info.doc_count,
          size: info.data_size,
          updateSeq: info.update_seq
        }
      } catch (error) {
        stats[key] = { error: error.message }
      }
    }
    
    return {
      databases: stats,
      performance: {
        ...performanceMetrics,
        averageQueryTime: performanceMetrics.queries > 0 ? 
          performanceMetrics.queryTime / performanceMetrics.queries : 0,
        cacheSize: queryCache.size
      }
    }
  }

  /**
   * Setup automatic database compaction
   */
  setupAutoCompaction() {
    // Compact databases every hour
    setInterval(async () => {
      for (const [key, db] of Object.entries(this.dbs)) {
        try {
          await db.compact()
          console.log(`🗜️ Compacted database: ${key}`)
        } catch (error) {
          console.warn(`⚠️ Failed to compact ${key}:`, error.message)
        }
      }
      performanceMetrics.lastCompaction = new Date().toISOString()
    }, 60 * 60 * 1000) // 1 hour
  }

  /**
   * Start automatic backup system
   */
  startBackupSystem() {
    // Backup every 5 minutes during active use
    this.backupInterval = setInterval(async () => {
      await this.createAutoBackup()
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Create automatic backup
   */
  async createAutoBackup() {
    try {
      const timestamp = new Date().toISOString()
      const backupData = await this.exportAllData()
      
      // Store backup in election_config database
      const backupDoc = {
        _id: `backup_auto_${Date.now()}`,
        type: DOC_TYPES.BACKUP,
        timestamp,
        data: backupData,
        automatic: true,
        size: JSON.stringify(backupData).length
      }
      
      await this.dbs.election_config.post(backupDoc)
      
      // Keep only last 5 automatic backups
      await this.cleanupOldBackups()
      
      console.log(`💾 Automatic backup created: ${timestamp}`)
      
    } catch (error) {
      console.error('❌ Failed to create automatic backup:', error)
    }
  }

  /**
   * Export all data for backup
   */
  async exportAllData() {
    const exportData = {}
    
    for (const [key, db] of Object.entries(this.dbs)) {
      try {
        const allDocs = await db.allDocs({
          include_docs: true,
          attachments: true
        })
        
        exportData[key] = allDocs.rows.map(row => row.doc)
      } catch (error) {
        console.error(`Failed to export ${key}:`, error)
        exportData[key] = { error: error.message }
      }
    }
    
    return exportData
  }

  /**
   * Import data from backup
   */
  async importBackupData(backupData) {
    try {
      const results = {}
      
      for (const [dbName, docs] of Object.entries(backupData)) {
        if (this.dbs[dbName] && Array.isArray(docs)) {
          // Clear existing data
          const allDocs = await this.dbs[dbName].allDocs()
          const docsToDelete = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
          }))
          
          if (docsToDelete.length > 0) {
            await this.dbs[dbName].bulkDocs(docsToDelete)
          }
          
          // Import new data
          const result = await this.dbs[dbName].bulkDocs(docs)
          results[dbName] = result
        }
      }
      
      // Clear cache
      this.clearAllCache()
      
      console.log('✅ Backup data imported successfully')
      return { success: true, results }
      
    } catch (error) {
      console.error('❌ Failed to import backup data:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Clean up old automatic backups
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.dbs.election_config.find({
        selector: {
          type: DOC_TYPES.BACKUP,
          automatic: true
        },
        sort: [{ timestamp: 'desc' }]
      })
      
      // Keep only the 5 most recent backups
      const toDelete = backups.docs.slice(5)
      
      for (const backup of toDelete) {
        await this.dbs.election_config.remove(backup._id, backup._rev)
      }
      
      if (toDelete.length > 0) {
        console.log(`🗑️ Cleaned up ${toDelete.length} old backups`)
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to cleanup old backups:', error)
    }
  }

  /**
   * Clear cache by pattern
   */
  clearCacheByPattern(pattern) {
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    queryCache.clear()
    console.log('🧹 Query cache cleared')
  }

  /**
   * Get connection status
   */
  async getConnectionStatus() {
    const status = {
      local: this.isInitialized,
      online: navigator.onLine,
      databases: {},
      performance: performanceMetrics
    }
    
    for (const [key, db] of Object.entries(this.dbs)) {
      try {
        const info = await db.info()
        status.databases[key] = {
          ready: true,
          docs: info.doc_count,
          size: info.data_size
        }
      } catch (error) {
        status.databases[key] = {
          ready: false,
          error: error.message
        }
      }
    }
    
    return status
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }
    
    this.clearAllCache()
    
    // Close all databases
    for (const db of Object.values(this.dbs)) {
      try {
        await db.close()
      } catch (error) {
        console.warn('Failed to close database:', error)
      }
    }
    
    console.log('🧹 Database service cleaned up')
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized
  }
}

// Create singleton instance
const databaseService = new DatabaseService()

export default databaseService
export { databaseService }