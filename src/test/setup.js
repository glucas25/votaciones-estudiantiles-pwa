import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock IndexedDB with proper implementation
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn().mockResolvedValue([])
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
})

// Mock IDBRequest with proper event handling
class MockIDBRequest {
  constructor() {
    this.result = null
    this.error = null
    this.readyState = 'pending'
    this.onsuccess = null
    this.onerror = null
    this.onupgradeneeded = null
    this.source = null
    this.transaction = null
  }

  // Helper to trigger success
  triggerSuccess(result) {
    this.result = result
    this.readyState = 'done'
    if (this.onsuccess) {
      this.onsuccess({ target: this })
    }
  }

  // Helper to trigger error
  triggerError(error) {
    this.error = error
    this.readyState = 'done'
    if (this.onerror) {
      this.onerror({ target: this })
    }
  }
}

// Mock IDBDatabase with proper object store management
class MockIDBDatabase {
  constructor(name, version) {
    this.name = name
    this.version = version
    this.objectStores = new Map()
    this.closed = false
  }

  createObjectStore(name, options = {}) {
    const store = new MockIDBObjectStore(name, options)
    this.objectStores.set(name, store)
    return store
  }

  deleteObjectStore(name) {
    this.objectStores.delete(name)
  }

  transaction(storeNames, mode) {
    if (this.closed) {
      throw new Error('Database is closed')
    }
    return new MockIDBTransaction(this, storeNames, mode)
  }

  close() {
    this.closed = true
  }

  get objectStoreNames() {
    return Array.from(this.objectStores.keys())
  }

  contains(storeName) {
    return this.objectStores.has(storeName)
  }
}

// Mock IDBObjectStore with proper CRUD operations
class MockIDBObjectStore {
  constructor(name, options = {}) {
    this.name = name
    this.keyPath = options.keyPath || null
    this.autoIncrement = options.autoIncrement || false
    this.indexes = new Map()
    this.data = new Map()
    this.nextId = 1
  }

  add(value, key) {
    const request = new MockIDBRequest()
    
    setTimeout(() => {
      try {
        const id = key || value._id || this.nextId++
        const doc = { ...value, _id: id.toString() }
        this.data.set(id.toString(), doc)
        request.triggerSuccess({ id: id.toString(), ok: true })
      } catch (error) {
        request.triggerError(error)
      }
    }, 0)
    
    return request
  }

  put(value, key) {
    const request = new MockIDBRequest()
    
    setTimeout(() => {
      try {
        const id = key || value._id || this.nextId++
        const doc = { ...value, _id: id.toString() }
        this.data.set(id.toString(), doc)
        request.triggerSuccess({ id: id.toString(), ok: true })
      } catch (error) {
        request.triggerError(error)
      }
    }, 0)
    
    return request
  }

  get(key) {
    const request = new MockIDBRequest()
    
    setTimeout(() => {
      try {
        const doc = this.data.get(key.toString())
        request.triggerSuccess(doc || null)
      } catch (error) {
        request.triggerError(error)
      }
    }, 0)
    
    return request
  }

  getAll(query = null, count = null) {
    const request = new MockIDBRequest()
    
    setTimeout(() => {
      try {
        let results = Array.from(this.data.values())
        
        // Simple query filtering (basic implementation)
        if (query) {
          results = results.filter(doc => {
            if (typeof query === 'string') {
              return doc._id === query
            }
            if (typeof query === 'object') {
              return Object.keys(query).every(key => doc[key] === query[key])
            }
            return true
          })
        }
        
        if (count) {
          results = results.slice(0, count)
        }
        
        request.triggerSuccess(results)
      } catch (error) {
        request.triggerError(error)
      }
    }, 0)
    
    return request
  }

  delete(key) {
    const request = new MockIDBRequest()
    
    setTimeout(() => {
      try {
        this.data.delete(key.toString())
        request.triggerSuccess(undefined)
      } catch (error) {
        request.triggerError(error)
      }
    }, 0)
    
    return request
  }

  clear() {
    const request = new MockIDBRequest()
    
    setTimeout(() => {
      try {
        this.data.clear()
        request.triggerSuccess(undefined)
      } catch (error) {
        request.triggerError(error)
      }
    }, 0)
    
    return request
  }

  createIndex(name, keyPath, options = {}) {
    const index = new MockIDBIndex(name, keyPath, options)
    this.indexes.set(name, index)
    return index
  }

  index(name) {
    return this.indexes.get(name)
  }

  get indexNames() {
    return Array.from(this.indexes.keys())
  }
}

// Mock IDBIndex
class MockIDBIndex {
  constructor(name, keyPath, options = {}) {
    this.name = name
    this.keyPath = keyPath
    this.unique = options.unique || false
    this.multiEntry = options.multiEntry || false
  }

  get(key) {
    const request = new MockIDBRequest()
    // Basic implementation - in real scenario would query the index
    request.triggerSuccess(null)
    return request
  }

  getAll(query = null, count = null) {
    const request = new MockIDBRequest()
    // Basic implementation - in real scenario would query the index
    request.triggerSuccess([])
    return request
  }
}

// Mock IDBTransaction with proper object store access
class MockIDBTransaction {
  constructor(db, storeNames, mode) {
    this.db = db
    this.mode = mode
    this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames]
    this.error = null
    this.complete = false
  }

  objectStore(name) {
    if (!this.storeNames.includes(name)) {
      throw new Error(`Object store '${name}' not found in transaction`)
    }
    return this.db.objectStores.get(name)
  }

  commit() {
    this.complete = true
  }

  abort() {
    this.error = new Error('Transaction aborted')
  }

  get oncomplete() {
    return this._oncomplete
  }

  set oncomplete(callback) {
    this._oncomplete = callback
  }

  get onerror() {
    return this._onerror
  }

  set onerror(callback) {
    this._onerror = callback
  }

  get onabort() {
    return this._onabort
  }

  set onabort(callback) {
    this._onabort = callback
  }
}

// Setup IndexedDB mocks with proper database creation
mockIndexedDB.open.mockImplementation((name, version) => {
  const request = new MockIDBRequest()
  
  // Simulate successful database opening
  setTimeout(() => {
    const db = new MockIDBDatabase(name, version || 1)
    
    // Create default object stores for the voting system
    db.createObjectStore('students', { keyPath: '_id' })
    db.createObjectStore('candidates', { keyPath: '_id' })
    db.createObjectStore('votes', { keyPath: '_id' })
    db.createObjectStore('sessions', { keyPath: '_id' })
    db.createObjectStore('election_config', { keyPath: '_id' })
    
    request.triggerSuccess(db)
  }, 0)
  
  return request
})

// Mock PouchDB for tests
vi.mock('pouchdb', () => {
  const mockDB = {
    info: vi.fn().mockResolvedValue({ db_name: 'test_db' }),
    find: vi.fn().mockResolvedValue({ docs: [] }),
    post: vi.fn().mockResolvedValue({ id: 'test-id', ok: true }),
    get: vi.fn().mockResolvedValue({ _id: 'test-id' }),
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

// Mock PouchDB plugins
vi.mock('pouchdb-find', () => ({
  default: {}
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock File API
global.File = class MockFile {
  constructor(bits, name, options) {
    this.name = name
    this.size = bits.length
    this.type = options?.type || 'text/plain'
    this.lastModified = Date.now()
  }
}

global.Blob = class MockBlob {
  constructor(content, options) {
    this.size = content.length
    this.type = options?.type || 'text/plain'
  }
}

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = vi.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

// Clean up mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  
  // Reset IndexedDB mock
  mockIndexedDB.open.mockClear()
})