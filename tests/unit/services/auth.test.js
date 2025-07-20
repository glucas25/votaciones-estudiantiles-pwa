import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock database service
const mockDatabaseService = {
  find: vi.fn(),
  create: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  isReady: vi.fn().mockReturnValue(true)
}

vi.mock('../../../src/services/database.js', () => ({
  database: mockDatabaseService
}))

describe('Auth Service', () => {
  let AuthService
  let authService

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  beforeEach(async () => {
    // Import the actual auth service
    const authModule = await import('../../../src/services/auth.js')
    AuthService = authModule.default
    authService = new AuthService()
  })

  describe('Activation Code Validation', () => {
    it('should validate correct activation codes', async () => {
      const validCodes = ['ELEC2024-BCH1A', 'ELEC2024-BCH2A', 'ELEC2024-BCH3A']
      
      for (const code of validCodes) {
        const result = await authService.validateActivationCode(code)
        expect(result.valid).toBe(true)
      }
    })

    it('should reject invalid activation codes', async () => {
      const invalidCodes = ['INVALID', 'BCH1A2024', 'ELEC2023-BCH1A', 'ABC123']
      
      for (const code of invalidCodes) {
        const result = await authService.validateActivationCode(code)
        expect(result.valid).toBe(false)
      }
    })

    it('should handle empty activation codes', async () => {
      const result = await authService.validateActivationCode('')
      expect(result.valid).toBe(false)
    })

    it('should handle null activation codes', async () => {
      const result = await authService.validateActivationCode(null)
      expect(result.valid).toBe(false)
    })

    it('should validate activation code format correctly', () => {
      const validCodes = ['ELEC2024-BCH1A', 'ELEC2024-BAS1A', 'ELEC2024-BCH2B']
      const invalidCodes = ['INVALID', 'BCH1A2024', 'ELEC2023-BCH1A', 'ABC123', '']
      
      for (const code of validCodes) {
        const result = authService.validateCodeFormat(code)
        expect(result.valid).toBe(true)
      }
      
      for (const code of invalidCodes) {
        const result = authService.validateCodeFormat(code)
        expect(result.valid).toBe(false)
      }
    })
  })

  describe('Session Management', () => {
    it('should save session to localStorage', async () => {
      const mockSession = {
        _id: 'session-123',
        type: 'tutor_session',
        course: '1ro Bach A',
        activationCode: 'ELEC2024-BCH1A'
      }

      authService.saveSessionToStorage(mockSession)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'votaciones_session',
        expect.stringContaining('session-123')
      )
    })

    it('should load existing session from localStorage', async () => {
      // Mock existing session
      const mockSession = {
        _id: 'session-123',
        type: 'tutor_session',
        course: '1ro Bach A',
        activationCode: 'ELEC2024-BCH1A',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours from now
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))
      
      // Mock database read
      mockDatabaseService.read.mockResolvedValue({
        ...mockSession,
        isActive: true
      })

      const session = await authService.loadStoredSession()
      expect(session).toEqual(mockSession)
    })

    it('should handle expired session', async () => {
      const expiredSession = {
        _id: 'session-123',
        type: 'tutor_session',
        course: '1ro Bach A',
        activationCode: 'ELEC2024-BCH1A',
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSession))

      const session = await authService.loadStoredSession()
      expect(session).toBeNull()
    })

    it('should handle missing session gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const session = await authService.loadStoredSession()
      expect(session).toBeNull()
    })

    it('should handle invalid session data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const session = await authService.loadStoredSession()
      expect(session).toBeNull()
    })

    it('should clear session on logout', async () => {
      // Mock current session
      authService.currentSession = {
        _id: 'session-123',
        type: 'tutor_session'
      }
      
      // Mock database read and update
      mockDatabaseService.read.mockResolvedValue({
        _id: 'session-123',
        isActive: true
      })
      mockDatabaseService.update.mockResolvedValue({ success: true })

      await authService.logout()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('votaciones_session')
      expect(authService.currentSession).toBeNull()
    })

    it('should get current session', () => {
      const mockSession = {
        _id: 'session-123',
        type: 'tutor_session',
        course: '1ro Bach A'
      }
      
      authService.currentSession = mockSession
      const session = authService.getCurrentSession()
      
      expect(session).toEqual(mockSession)
    })

    it('should check if authenticated', () => {
      // Not authenticated
      authService.currentSession = null
      expect(authService.isAuthenticated()).toBe(false)
      
      // Authenticated with active session
      authService.currentSession = {
        _id: 'session-123',
        isActive: true
      }
      expect(authService.isAuthenticated()).toBe(true)
      
      // Authenticated but inactive session
      authService.currentSession = {
        _id: 'session-123',
        isActive: false
      }
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should get current tutor information', () => {
      const mockSession = {
        _id: 'session-123',
        type: 'tutor_session',
        tutorName: 'Juan Pérez',
        course: '1ro Bach A',
        level: 'BACHILLERATO',
        activationCode: 'ELEC2024-BCH1A',
        startTime: '2024-01-15T10:00:00.000Z'
      }
      
      authService.currentSession = mockSession
      const tutor = authService.getCurrentTutor()
      
      expect(tutor).toEqual({
        name: 'Juan Pérez',
        course: '1ro Bach A',
        level: 'BACHILLERATO',
        activationCode: 'ELEC2024-BCH1A',
        sessionStart: '2024-01-15T10:00:00.000Z'
      })
    })

    it('should return null for tutor when not authenticated', () => {
      authService.currentSession = null
      const tutor = authService.getCurrentTutor()
      expect(tutor).toBeNull()
    })
  })

  describe('Database Integration', () => {
    it('should find activation codes in database', async () => {
      const mockActivationCode = {
        type: 'activation_code',
        code: 'ELEC2024-BCH1A',
        active: true,
        courses: ['1ro Bach A'],
        level: 'BACHILLERATO'
      }
      
      mockDatabaseService.find.mockResolvedValue([mockActivationCode])

      const result = await authService.findActivationCode('ELEC2024-BCH1A')
      
      expect(result.found).toBe(true)
      expect(result.data).toEqual(mockActivationCode)
    })

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.find.mockRejectedValue(new Error('Database error'))

      const result = await authService.findActivationCode('ELEC2024-BCH1A')
      
      expect(result.found).toBe(false)
      expect(result.error).toBe('Error de conexión')
    })

    it('should create tutor session in database', async () => {
      const mockActivationCode = {
        code: 'ELEC2024-BCH1A',
        level: 'BACHILLERATO'
      }
      
      mockDatabaseService.create.mockResolvedValue({ success: true })

      const result = await authService.createTutorSession(
        mockActivationCode,
        '1ro Bach A',
        'Juan Pérez'
      )
      
      expect(result.success).toBe(true)
      expect(mockDatabaseService.create).toHaveBeenCalled()
    })
  })

  describe('Voting Hours Validation', () => {
    it('should validate voting hours correctly', () => {
      const now = new Date()
      const validFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
      const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day from now
      
      const activationCode = {
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString()
      }
      
      const result = authService.validateVotingHours(activationCode)
      expect(result.valid).toBe(true)
    })

    it('should reject voting before start time', () => {
      const now = new Date()
      const validFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day from now
      const validUntil = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 2 days from now
      
      const activationCode = {
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString()
      }
      
      const result = authService.validateVotingHours(activationCode)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Votación iniciará')
    })

    it('should reject voting after end time', () => {
      const now = new Date()
      const validFrom = new Date(now.getTime() - 48 * 60 * 60 * 1000) // 2 days ago
      const validUntil = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
      
      const activationCode = {
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString()
      }
      
      const result = authService.validateVotingHours(activationCode)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Votación finalizó')
    })
  })

  describe('Session Validation', () => {
    it('should validate current session', async () => {
      const mockSession = {
        _id: 'session-123',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours from now
      }
      
      authService.currentSession = mockSession
      mockDatabaseService.read.mockResolvedValue({
        ...mockSession,
        isActive: true
      })

      const isValid = await authService.validateCurrentSession()
      expect(isValid).toBe(true)
    })

    it('should reject expired session', async () => {
      const expiredSession = {
        _id: 'session-123',
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      }
      
      authService.currentSession = expiredSession

      const isValid = await authService.validateCurrentSession()
      expect(isValid).toBe(false)
    })

    it('should reject inactive session from database', async () => {
      const mockSession = {
        _id: 'session-123',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      }
      
      authService.currentSession = mockSession
      mockDatabaseService.read.mockResolvedValue({
        ...mockSession,
        isActive: false
      })

      const isValid = await authService.validateCurrentSession()
      expect(isValid).toBe(false)
    })
  })

  describe('Session Renewal', () => {
    it('should renew session successfully', async () => {
      const mockSession = {
        _id: 'session-123',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
      }
      
      authService.currentSession = mockSession
      mockDatabaseService.read.mockResolvedValue({
        ...mockSession,
        isActive: true
      })
      mockDatabaseService.update.mockResolvedValue({ success: true })

      const result = await authService.renewSession()
      expect(result.success).toBe(true)
    })

    it('should fail renewal for non-existent session', async () => {
      authService.currentSession = null

      const result = await authService.renewSession()
      expect(result.success).toBe(false)
    })

    it('should fail renewal when database update fails', async () => {
      const mockSession = {
        _id: 'session-123',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
      
      authService.currentSession = mockSession
      mockDatabaseService.read.mockResolvedValue(null)

      const result = await authService.renewSession()
      expect(result.success).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const mockSession = { _id: 'session-123' }
      
      // Should not throw
      expect(() => {
        authService.saveSessionToStorage(mockSession)
      }).not.toThrow()
    })

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.find.mockRejectedValue(new Error('Database error'))

      const result = await authService.findActivationCode('ELEC2024-BCH1A')
      
      expect(result.found).toBe(false)
      expect(result.error).toBe('Error de conexión')
    })

    it('should handle JSON parsing errors', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const session = await authService.loadStoredSession()
      expect(session).toBeNull()
    })
  })
})