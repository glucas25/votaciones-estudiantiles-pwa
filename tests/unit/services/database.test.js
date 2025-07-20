import { describe, it, expect, vi, beforeEach } from 'vitest'
import databaseService, { DOC_TYPES } from '../../../src/services/database-indexeddb.js'

describe('Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      const result = await databaseService.initializeDatabase()
      expect(result).toBeDefined()
    })

    it('should be ready after initialization', async () => {
      await databaseService.initializeDatabase()
      expect(databaseService.isReady()).toBe(true)
    })
  })

  describe('Document Operations', () => {
    beforeEach(async () => {
      await databaseService.initializeDatabase()
    })

    it('should create a document successfully', async () => {
      const testDoc = {
        type: DOC_TYPES.STUDENT,
        nombres: 'Juan',
        apellidos: 'Pérez',
        cedula: '1234567890'
      }

      const result = await databaseService.createDocument('students', testDoc)
      
      expect(result.success).toBe(true)
      expect(result.id).toBeDefined()
    })

    it('should find documents with selector', async () => {
      // First create a document
      const testDoc = {
        type: DOC_TYPES.STUDENT,
        nombres: 'María',
        apellidos: 'González',
        cedula: '1234567891'
      }
      await databaseService.createDocument('students', testDoc)

      // Then find it
      const result = await databaseService.findDocuments('students', {
        selector: { cedula: '1234567891' }
      })

      expect(result.docs).toBeDefined()
      expect(Array.isArray(result.docs)).toBe(true)
    })

    it('should update a document successfully', async () => {
      // First create a document
      const testDoc = {
        type: DOC_TYPES.STUDENT,
        nombres: 'Carlos',
        apellidos: 'Rodríguez',
        cedula: '1234567892'
      }
      const createResult = await databaseService.createDocument('students', testDoc)
      
      // Then update it
      const updateDoc = {
        ...testDoc,
        _id: createResult.id,
        _rev: createResult.rev,
        nombres: 'Carlos Updated'
      }
      
      const result = await databaseService.updateDocument('students', updateDoc)
      
      expect(result.success).toBe(true)
      expect(result.id).toBeDefined()
    })

    it('should delete a document successfully', async () => {
      // First create a document
      const testDoc = {
        type: DOC_TYPES.STUDENT,
        nombres: 'Ana',
        apellidos: 'López',
        cedula: '1234567893'
      }
      const createResult = await databaseService.createDocument('students', testDoc)
      
      // Then delete it
      const result = await databaseService.deleteDocument('students', createResult.id)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      await databaseService.initializeDatabase()
    })

    it('should perform bulk create operation', async () => {
      const testDocs = [
        {
          type: DOC_TYPES.STUDENT,
          nombres: 'Estudiante 1',
          apellidos: 'Apellido 1',
          cedula: '1111111111'
        },
        {
          type: DOC_TYPES.STUDENT,
          nombres: 'Estudiante 2',
          apellidos: 'Apellido 2',
          cedula: '2222222222'
        }
      ]

      const result = await databaseService.bulkCreate('students', testDocs)
      
      expect(result.success).toBe(true)
      expect(result.results).toBeDefined()
      expect(Array.isArray(result.results)).toBe(true)
    })

    it('should perform bulk update operation', async () => {
      // First create documents
      const testDocs = [
        {
          type: DOC_TYPES.STUDENT,
          nombres: 'Estudiante 3',
          apellidos: 'Apellido 3',
          cedula: '3333333333'
        },
        {
          type: DOC_TYPES.STUDENT,
          nombres: 'Estudiante 4',
          apellidos: 'Apellido 4',
          cedula: '4444444444'
        }
      ]
      
      const createResult = await databaseService.bulkCreate('students', testDocs)
      
      // Then update them
      const updateDocs = createResult.results.map(result => ({
        ...testDocs[0],
        _id: result.id,
        _rev: result.rev,
        nombres: 'Updated Name'
      }))

      const result = await databaseService.bulkUpdate('students', updateDocs)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      await databaseService.initializeDatabase()
    })

    it('should handle invalid database operations gracefully', async () => {
      const result = await databaseService.createDocument('nonexistent', {})
      
      // Should handle the error gracefully
      expect(result).toBeDefined()
    })

    it('should handle find operations with invalid selectors', async () => {
      const result = await databaseService.findDocuments('students', {
        selector: { invalidField: 'invalidValue' }
      })
      
      expect(result.docs).toBeDefined()
    })
  })

  describe('Backup Operations', () => {
    beforeEach(async () => {
      await databaseService.initializeDatabase()
    })

    it('should export data for backup', async () => {
      // Create some test data first
      const testDoc = {
        type: DOC_TYPES.STUDENT,
        nombres: 'Backup Test',
        apellidos: 'Student',
        cedula: '9999999999'
      }
      await databaseService.createDocument('students', testDoc)

      const result = await databaseService.exportAllData()
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should import backup data', async () => {
      const testBackupData = {
        students: [
          {
            type: DOC_TYPES.STUDENT,
            nombres: 'Imported',
            apellidos: 'Student',
            cedula: '8888888888'
          }
        ],
        candidates: [],
        votes: [],
        sessions: [],
        config: []
      }

      const result = await databaseService.importBackupData(testBackupData)
      expect(result.success).toBe(true)
    })
  })
})