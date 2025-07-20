// src/services/database-simple.js
import PouchDB from 'pouchdb'

console.log('🔧 Initializing simplified PouchDB service...')

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

// Simple database service that works without plugins
class SimpleDatabaseService {
  constructor() {
    this.dbs = {}
    this.isInitialized = false
    this.initializeDatabases()
  }

  async initializeDatabases() {
    try {
      console.log('🚀 Initializing PouchDB databases...')
      
      for (const [key, dbName] of Object.entries(DB_CONFIG)) {
        this.dbs[key] = new PouchDB(dbName)
      }
      
      this.isInitialized = true
      console.log('✅ All databases initialized successfully')
      return { success: true, databases: Object.keys(this.dbs) }
    } catch (error) {
      console.error('❌ Failed to initialize databases:', error)
      return { success: false, error: error.message }
    }
  }

  generateId(type, ...parts) {
    const timestamp = Date.now()
    return `${type}_${parts.join('_')}_${timestamp}`
  }

  async createDocument(dbName, document, type) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const docWithMeta = {
        ...document,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _id: document._id || this.generateId(type, document.cedula || document.nombre || Math.random().toString(36).substr(2, 9))
      }

      const result = await this.dbs[dbName].post(docWithMeta)
      console.log(`✅ Document created in ${dbName}:`, result.id)
      return { success: true, id: result.id, rev: result.rev }
      
    } catch (error) {
      console.error(`❌ Failed to create document in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async findDocuments(dbName, query, useCache = true) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const result = await this.dbs[dbName].allDocs({
        include_docs: true,
        limit: query.limit || 1000
      })
      
      let filteredDocs = result.rows.map(row => row.doc)
      
      if (query.selector) {
        filteredDocs = this.filterDocuments(filteredDocs, query.selector)
      }

      return {
        docs: filteredDocs,
        total: filteredDocs.length
      }
      
    } catch (error) {
      console.error(`❌ Failed to find documents in ${dbName}:`, error)
      return { docs: [], total: 0, error: error.message }
    }
  }

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

  async updateDocument(dbName, document) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const docWithMeta = {
        ...document,
        updatedAt: new Date().toISOString()
      }

      const result = await this.dbs[dbName].put(docWithMeta)
      console.log(`✅ Document updated in ${dbName}:`, result.id)
      return { success: true, id: result.id, rev: result.rev }
      
    } catch (error) {
      console.error(`❌ Failed to update document in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async deleteDocument(dbName, id, rev) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const result = await this.dbs[dbName].remove(id, rev)
      console.log(`✅ Document deleted from ${dbName}:`, id)
      return { success: true, id: result.id, rev: result.rev }
      
    } catch (error) {
      console.error(`❌ Failed to delete document from ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async bulkCreate(dbName, documents, type) {
    try {
      if (!this.dbs[dbName]) {
        throw new Error(`Database ${dbName} not found`)
      }

      const docsWithMeta = documents.map((doc, index) => ({
        ...doc,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _id: doc._id || this.generateId(type, doc.cedula || doc.nombre || index.toString())
      }))

      const result = await this.dbs[dbName].bulkDocs(docsWithMeta)
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

  async searchDocuments(dbName, query, fields = ['nombre', 'apellidos', 'cedula']) {
    try {
      const searchQuery = {
        selector: {
          $or: fields.map(field => ({
            [field]: { $regex: query }
          }))
        },
        limit: 50
      }
      
      const result = await this.findDocuments(dbName, searchQuery, false)
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
        queries: 0,
        queryTime: 0,
        cacheHits: 0,
        averageQueryTime: 0,
        cacheSize: 0
      }
    }
  }

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

  async importBackupData(backupData) {
    try {
      const results = {}
      
      for (const [dbName, docs] of Object.entries(backupData)) {
        if (this.dbs[dbName] && Array.isArray(docs)) {
          const allDocs = await this.dbs[dbName].allDocs()
          const docsToDelete = allDocs.rows.map(row => ({
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
          }))
          
          if (docsToDelete.length > 0) {
            await this.dbs[dbName].bulkDocs(docsToDelete)
          }
          
          const result = await this.dbs[dbName].bulkDocs(docs)
          results[dbName] = result
        }
      }
      
      console.log('✅ Backup data imported successfully')
      return { success: true, results }
      
    } catch (error) {
      console.error('❌ Failed to import backup data:', error)
      return { success: false, error: error.message }
    }
  }

  clearAllCache() {
    console.log('🧹 Cache cleared (simplified version)')
  }

  async getConnectionStatus() {
    const status = {
      local: this.isInitialized,
      online: navigator.onLine,
      databases: {}
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

  isReady() {
    return this.isInitialized
  }
}

// Create singleton instance
const databaseService = new SimpleDatabaseService()

export default databaseService
export { databaseService }