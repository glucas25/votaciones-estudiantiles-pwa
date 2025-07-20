// src/services/database-fallback.js
// Temporary fallback database service while fixing PouchDB imports

console.log('🔧 Using fallback database service...')

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

class FallbackDatabaseService {
  constructor() {
    this.data = {
      students: [],
      candidates: [],
      votes: [],
      sessions: [],
      election_config: []
    }
    this.isInitialized = true
    console.log('✅ Fallback database service initialized')
  }

  async initializeDatabases() {
    return { success: true, databases: Object.keys(this.data) }
  }

  generateId(type, ...parts) {
    const timestamp = Date.now()
    return `${type}_${parts.join('_')}_${timestamp}`
  }

  async createDocument(dbName, document, type) {
    try {
      const docWithMeta = {
        ...document,
        type,
        _id: document._id || this.generateId(type, document.cedula || document.nombre || Math.random().toString(36).substr(2, 9)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.data[dbName].push(docWithMeta)
      console.log(`✅ Document created in ${dbName}:`, docWithMeta._id)
      return { success: true, id: docWithMeta._id, rev: '1-fallback' }
    } catch (error) {
      console.error(`❌ Failed to create document in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async findDocuments(dbName, query, useCache = true) {
    try {
      const docs = this.data[dbName] || []
      let filtered = docs

      if (query.selector) {
        filtered = docs.filter(doc => {
          if (query.selector.type) {
            return doc.type === query.selector.type
          }
          return true
        })
      }

      const limit = query.limit || 25
      const result = {
        docs: filtered.slice(0, limit),
        total: filtered.length,
        limit
      }

      return result
    } catch (error) {
      console.error(`❌ Failed to find documents in ${dbName}:`, error)
      return { docs: [], total: 0, limit: 25, error: error.message }
    }
  }

  async updateDocument(dbName, document) {
    try {
      const docs = this.data[dbName]
      const index = docs.findIndex(d => d._id === document._id)
      
      if (index >= 0) {
        const docWithMeta = {
          ...document,
          updatedAt: new Date().toISOString()
        }
        docs[index] = docWithMeta
        console.log(`✅ Document updated in ${dbName}:`, document._id)
        return { success: true, id: document._id, rev: '2-fallback' }
      } else {
        throw new Error('Document not found')
      }
    } catch (error) {
      console.error(`❌ Failed to update document in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async deleteDocument(dbName, id, rev) {
    try {
      const docs = this.data[dbName]
      const index = docs.findIndex(d => d._id === id)
      
      if (index >= 0) {
        docs.splice(index, 1)
        console.log(`✅ Document deleted from ${dbName}:`, id)
        return { success: true, id, rev: '3-fallback' }
      } else {
        throw new Error('Document not found')
      }
    } catch (error) {
      console.error(`❌ Failed to delete document from ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async bulkCreate(dbName, documents, type) {
    try {
      const docsWithMeta = documents.map((doc, index) => ({
        ...doc,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _id: doc._id || this.generateId(type, doc.cedula || doc.nombre || index.toString())
      }))

      this.data[dbName].push(...docsWithMeta)
      
      console.log(`✅ Bulk created ${documents.length} documents in ${dbName}`)
      
      return { 
        success: true, 
        results: docsWithMeta.map(doc => ({ ok: true, id: doc._id, rev: '1-fallback' })),
        successful: documents.length,
        total: documents.length 
      }
    } catch (error) {
      console.error(`❌ Failed bulk create in ${dbName}:`, error)
      return { success: false, error: error.message }
    }
  }

  async searchDocuments(dbName, query, fields = ['nombre', 'apellidos', 'cedula']) {
    try {
      const docs = this.data[dbName] || []
      const filtered = docs.filter(doc => {
        return fields.some(field => {
          const value = doc[field]
          return value && value.toString().toLowerCase().includes(query.toLowerCase())
        })
      })

      return {
        success: true,
        docs: filtered.slice(0, 50),
        total: filtered.length
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
    
    for (const [key, data] of Object.entries(this.data)) {
      stats[key] = {
        name: key,
        docs: data.length,
        size: JSON.stringify(data).length
      }
    }
    
    return {
      databases: stats,
      performance: {
        queries: 0,
        queryTime: 0,
        averageQueryTime: 0,
        cacheHits: 0,
        cacheSize: 0
      }
    }
  }

  async getConnectionStatus() {
    return {
      local: true,
      online: navigator.onLine,
      databases: Object.keys(this.data).reduce((acc, key) => {
        acc[key] = {
          ready: true,
          docs: this.data[key].length,
          size: JSON.stringify(this.data[key]).length
        }
        return acc
      }, {}),
      performance: {}
    }
  }

  async cleanup() {
    console.log('🧹 Fallback database service cleaned up')
  }

  isReady() {
    return true
  }
}

// Create singleton instance
const databaseService = new FallbackDatabaseService()

export default databaseService
export { databaseService }