import { describe, it, expect, vi, beforeEach } from 'vitest'
import authService from '../../../src/services/auth.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('loginAdmin', () => {
    it('should login admin with correct credentials', async () => {
      const result = await authService.loginAdmin('admin', 'admin2024')
      
      expect(result.success).toBe(true)
      expect(result.user.role).toBe('admin')
      expect(result.user.id).toBe('admin_user')
      expect(result.user.loginTime).toBeDefined()
    })

    it('should reject admin login with incorrect credentials', async () => {
      const result = await authService.loginAdmin('admin', 'wrongpassword')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Credenciales incorrectas')
    })

    it('should reject admin login with empty credentials', async () => {
      const result = await authService.loginAdmin('', '')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Usuario y contraseña son requeridos')
    })
  })

  describe('loginTutor', () => {
    it('should login tutor with valid activation code', async () => {
      const result = await authService.loginTutor('BCH1A2024')
      
      expect(result.success).toBe(true)
      expect(result.user.role).toBe('tutor')
      expect(result.user.course).toBe('1ro Bach A')
      expect(result.user.level).toBe('BACHILLERATO')
      expect(result.user.activationCode).toBe('BCH1A2024')
    })

    it('should reject tutor login with invalid code', async () => {
      const result = await authService.loginTutor('INVALID')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Código de activación inválido')
    })

    it('should reject tutor login with empty code', async () => {
      const result = await authService.loginTutor('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Código de activación es requerido')
    })

    it('should handle different education levels', async () => {
      const codes = [
        { code: 'BSP8A2024', level: 'BASICA_SUPERIOR', course: '8vo A' },
        { code: 'BMD5A2024', level: 'BASICA_MEDIA', course: '5to A' },
        { code: 'BEL1A2024', level: 'BASICA_ELEMENTAL', course: '1ro A' }
      ]

      for (const { code, level, course } of codes) {
        const result = await authService.loginTutor(code)
        
        expect(result.success).toBe(true)
        expect(result.user.level).toBe(level)
        expect(result.user.course).toBe(course)
      }
    })
  })

  describe('saveSession', () => {
    it('should save session to localStorage', () => {
      const sessionData = {
        user: { id: 'test', role: 'admin' },
        timestamp: Date.now()
      }
      
      authService.saveSession(sessionData)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'voting_session',
        JSON.stringify(sessionData)
      )
    })
  })

  describe('getSession', () => {
    it('should retrieve valid session from localStorage', () => {
      const sessionData = {
        user: { id: 'test', role: 'admin' },
        timestamp: Date.now()
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData))
      
      const result = authService.getSession()
      
      expect(result).toEqual(sessionData)
    })

    it('should return null for expired session', () => {
      const expiredSession = {
        user: { id: 'test', role: 'admin' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredSession))
      
      const result = authService.getSession()
      
      expect(result).toBeNull()
    })

    it('should return null when no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const result = authService.getSession()
      
      expect(result).toBeNull()
    })

    it('should return null for corrupted session data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const result = authService.getSession()
      
      expect(result).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      authService.clearSession()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('voting_session')
    })
  })

  describe('validateActivationCode', () => {
    it('should validate correct activation code format', () => {
      const validCodes = [
        'BCH1A2024',
        'BSP8B2024',
        'BMD5A2024',
        'BEL1A2024'
      ]

      validCodes.forEach(code => {
        const result = authService.validateActivationCode(code)
        expect(result.isValid).toBe(true)
        expect(result.courseInfo).toBeDefined()
      })
    })

    it('should reject invalid activation code format', () => {
      const invalidCodes = [
        'INVALID',
        'BCH1A',
        '2024BCH1A',
        'bch1a2024', // lowercase
        'BCH1A2025'  // wrong year
      ]

      invalidCodes.forEach(code => {
        const result = authService.validateActivationCode(code)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const validSession = {
        user: { id: 'test', role: 'admin' },
        timestamp: Date.now() - (1000 * 60 * 60) // 1 hour ago
      }
      
      const isValid = authService.isSessionValid(validSession)
      
      expect(isValid).toBe(true)
    })

    it('should return false for expired session', () => {
      const expiredSession = {
        user: { id: 'test', role: 'admin' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      }
      
      const isValid = authService.isSessionValid(expiredSession)
      
      expect(isValid).toBe(false)
    })

    it('should return false for null session', () => {
      const isValid = authService.isSessionValid(null)
      
      expect(isValid).toBe(false)
    })
  })
})