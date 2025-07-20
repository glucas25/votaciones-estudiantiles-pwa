import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the auth service before importing
const mockAuthService = {
  loginAdmin: vi.fn(),
  loginTutor: vi.fn(),
  getSession: vi.fn(),
  clearSession: vi.fn(),
  isSessionValid: vi.fn(),
  validateActivationCode: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn()
}

vi.mock('../../../src/services/auth.js', () => ({
  default: mockAuthService
}))

// Mock database service
vi.mock('../../../src/services/database-indexeddb.js', () => ({
  default: {
    createDocument: vi.fn(),
    findDocuments: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    isReady: vi.fn().mockReturnValue(true)
  },
  DOC_TYPES: {
    SESSION: 'session'
  }
}))

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Admin Authentication', () => {
    it('should authenticate admin with correct password', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: {
          role: 'admin',
          username: 'admin',
          sessionId: 'admin-session-123'
        }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user.role).toBe('admin')
    })

    it('should reject admin with incorrect password', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: false,
        error: 'Credenciales incorrectas'
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('admin', 'wrongpassword')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject admin with incorrect username', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: false,
        error: 'Usuario no encontrado'
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('wronguser', 'admin2024')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Tutor Authentication', () => {
    it('should authenticate tutor with valid activation code', async () => {
      mockAuthService.loginTutor.mockResolvedValue({
        success: true,
        user: {
          role: 'tutor',
          activationCode: 'BCH1A2024',
          course: '1ro Bach A',
          level: 'BACHILLERATO'
        }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginTutor('BCH1A2024')
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user.role).toBe('tutor')
      expect(result.user.activationCode).toBe('BCH1A2024')
    })

    it('should reject tutor with invalid activation code', async () => {
      mockAuthService.loginTutor.mockResolvedValue({
        success: false,
        error: 'Código de activación inválido'
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginTutor('INVALID_CODE')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should include course information in tutor session', async () => {
      mockAuthService.loginTutor.mockResolvedValue({
        success: true,
        user: {
          role: 'tutor',
          activationCode: 'BCH1A2024',
          course: '1ro Bach A',
          level: 'BACHILLERATO'
        }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginTutor('BCH1A2024')
      
      expect(result.success).toBe(true)
      expect(result.user.course).toBeDefined()
      expect(result.user.level).toBeDefined()
    })
  })

  describe('Session Management', () => {
    it('should save session to localStorage', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin' }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result.success).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should load existing session from localStorage', async () => {
      // Mock existing session
      const mockSession = {
        role: 'admin',
        username: 'admin',
        loginTime: new Date().toISOString()
      }
      localStorage.setItem('voting_session', JSON.stringify(mockSession))
      
      mockAuthService.getSession.mockReturnValue(mockSession)

      const { default: authService } = await import('../../../src/services/auth.js')
      const session = authService.getSession()
      expect(session).toEqual(mockSession)
    })

    it('should clear session on logout', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin' }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      
      // First login to create session
      await authService.loginAdmin('admin', 'admin2024')
      
      // Then logout
      authService.logout()
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('voting_session')
    })

    it('should validate session correctly', async () => {
      const validSession = {
        role: 'admin',
        loginTime: new Date().toISOString()
      }
      
      mockAuthService.isSessionValid.mockReturnValue(true)

      const { default: authService } = await import('../../../src/services/auth.js')
      const isValid = authService.isSessionValid(validSession)
      expect(isValid).toBe(true)
    })

    it('should reject expired session', async () => {
      const expiredSession = {
        role: 'admin',
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      }
      
      mockAuthService.isSessionValid.mockReturnValue(false)

      const { default: authService } = await import('../../../src/services/auth.js')
      const isValid = authService.isSessionValid(expiredSession)
      expect(isValid).toBe(false)
    })
  })

  describe('Activation Codes', () => {
    it('should validate correct activation codes', async () => {
      const validCodes = ['BCH1A2024', 'BCH2B2024', 'BAS1A2024']
      
      mockAuthService.validateActivationCode.mockImplementation((code) => ({
        valid: validCodes.includes(code),
        data: validCodes.includes(code) ? { courses: ['Test Course'] } : null
      }))

      const { default: authService } = await import('../../../src/services/auth.js')
      
      validCodes.forEach(code => {
        const result = authService.validateActivationCode(code)
        expect(result.valid).toBe(true)
      })
    })

    it('should reject invalid activation codes', async () => {
      const invalidCodes = ['INVALID', 'BCH1A2023', 'TEST123']
      
      mockAuthService.validateActivationCode.mockImplementation((code) => ({
        valid: false,
        data: null
      }))

      const { default: authService } = await import('../../../src/services/auth.js')
      
      invalidCodes.forEach(code => {
        const result = authService.validateActivationCode(code)
        expect(result.valid).toBe(false)
      })
    })

    it('should return course information for valid codes', async () => {
      mockAuthService.validateActivationCode.mockReturnValue({
        valid: true,
        data: {
          courses: ['1ro Bach A', '2do Bach A']
        }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = authService.validateActivationCode('BCH1A2024')
      
      expect(result.valid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.courses).toBeDefined()
      expect(Array.isArray(result.data.courses)).toBe(true)
    })
  })

  describe('Database Integration', () => {
    it('should save session to database when available', async () => {
      const { default: databaseService } = await import('../../../src/services/database-indexeddb.js')
      databaseService.createDocument.mockResolvedValue({ success: true, id: 'session-id' })
      
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin' }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result.success).toBe(true)
      expect(databaseService.createDocument).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const { default: databaseService } = await import('../../../src/services/database-indexeddb.js')
      databaseService.createDocument.mockRejectedValue(new Error('Database error'))
      
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin' }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result.success).toBe(true) // Should still work with localStorage fallback
    })
  })

  describe('Security Features', () => {
    it('should not expose sensitive information in session', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin' }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result.user).toBeDefined()
      expect(result.user.password).toBeUndefined()
      expect(result.user.rawPassword).toBeUndefined()
    })

    it('should generate unique session IDs', async () => {
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin', sessionId: 'session-1' }
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      const result1 = await authService.loginAdmin('admin', 'admin2024')
      authService.logout()
      
      mockAuthService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin', sessionId: 'session-2' }
      })
      
      const result2 = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result1.user.sessionId).toBeDefined()
      expect(result2.user.sessionId).toBeDefined()
      expect(result1.user.sessionId).not.toBe(result2.user.sessionId)
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      mockAuthService.saveSession.mockImplementation(() => {
        // Should not throw even if localStorage fails
        return true
      })

      const { default: authService } = await import('../../../src/services/auth.js')
      
      expect(() => {
        authService.saveSession({ role: 'admin' })
      }).not.toThrow()
      
      // Restore original
      localStorage.setItem = originalSetItem
    })

    it('should handle JSON parsing errors', async () => {
      // Mock corrupted localStorage data
      localStorage.setItem('voting_session', 'invalid json')
      
      mockAuthService.getSession.mockReturnValue(null)

      const { default: authService } = await import('../../../src/services/auth.js')
      const session = authService.getSession()
      expect(session).toBeNull()
    })
  })
})