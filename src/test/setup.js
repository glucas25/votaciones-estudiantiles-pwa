import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

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

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Clean up mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})