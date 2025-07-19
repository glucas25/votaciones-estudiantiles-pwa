import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock PouchDB before importing
vi.mock('pouchdb', () => {
  const mockDB = {
    info: vi.fn().mockResolvedValue({ db_name: 'votaciones_estudiantiles' }),
    find: vi.fn().mockResolvedValue({ docs: [] }),
    post: vi.fn().mockResolvedValue({ id: 'test-id', ok: true }),
    get: vi.fn().mockResolvedValue({ _id: 'test-id', data: 'test' }),
    put: vi.fn().mockResolvedValue({ id: 'test-id', ok: true }),
    createIndex: vi.fn().mockResolvedValue({ result: 'created' })
  }
  
  const PouchDBConstructor = vi.fn(() => mockDB)
  PouchDBConstructor.plugin = vi.fn()
  
  return {
    default: PouchDBConstructor,
    __esModule: true
  }
})

vi.mock('pouchdb-find', () => ({
  default: {}
}))

// Import after mocking
const { database, initDatabase } = await import('../../../src/services/database.js')

describe('Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initDatabase', () => {
    it('should initialize database successfully', async () => {
      const result = await initDatabase()
      
      expect(result).toBeDefined()
      expect(result.local).toBeDefined()
    })

    it('should create required indexes', async () => {
      await initDatabase()
      
      expect(database.local.createIndex).toHaveBeenCalledWith({
        index: { fields: ['type'] }
      })
      expect(database.local.createIndex).toHaveBeenCalledWith({
        index: { fields: ['type', 'code'] }
      })
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', async () => {
      const status = await database.getConnectionStatus()
      
      expect(status).toHaveProperty('local')
      expect(status).toHaveProperty('online')
      expect(typeof status.local).toBe('boolean')
      expect(typeof status.online).toBe('boolean')
    })

    it('should return true for local when database is available', async () => {
      const status = await database.getConnectionStatus()
      
      expect(status.local).toBe(true)
    })
  })

  describe('find', () => {
    it('should find documents with selector', async () => {
      const selector = { type: 'student' }
      const result = await database.find(selector)
      
      expect(database.local.find).toHaveBeenCalledWith({
        selector,
      })
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when database is not available', async () => {
      database.local = null
      const result = await database.find({ type: 'test' })
      
      expect(result).toEqual([])
    })

    it('should handle find options', async () => {
      const selector = { type: 'student' }
      const options = { limit: 10, sort: ['name'] }
      
      await database.find(selector, options)
      
      expect(database.local.find).toHaveBeenCalledWith({
        selector,
        ...options
      })
    })
  })

  describe('create', () => {
    it('should create document successfully', async () => {
      const doc = { type: 'student', name: 'Test Student' }
      const result = await database.create(doc)
      
      expect(database.local.post).toHaveBeenCalledWith(doc)
      expect(result.id).toBe('test-id')
      expect(result.ok).toBe(true)
    })

    it('should throw error when database is not available', async () => {
      database.local = null
      const doc = { type: 'student' }
      
      await expect(database.create(doc)).rejects.toThrow('Base de datos local no disponible')
    })
  })

  describe('read', () => {
    it('should read document by id', async () => {
      const id = 'test-id'
      const result = await database.read(id)
      
      expect(database.local.get).toHaveBeenCalledWith(id)
      expect(result._id).toBe(id)
    })

    it('should return null when document not found', async () => {
      database.local.get.mockRejectedValue({ status: 404 })
      
      const result = await database.read('non-existent')
      
      expect(result).toBeNull()
    })

    it('should throw error when database is not available', async () => {
      database.local = null
      
      await expect(database.read('test-id')).rejects.toThrow('Base de datos local no disponible')
    })
  })

  describe('update', () => {
    it('should update document successfully', async () => {
      const doc = { _id: 'test-id', type: 'student', name: 'Updated Student' }
      const result = await database.update(doc)
      
      expect(database.local.put).toHaveBeenCalledWith(doc)
      expect(result.id).toBe('test-id')
      expect(result.ok).toBe(true)
    })

    it('should throw error when database is not available', async () => {
      database.local = null
      const doc = { _id: 'test-id' }
      
      await expect(database.update(doc)).rejects.toThrow('Base de datos local no disponible')
    })
  })
})