import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../../src/contexts/AuthContext.jsx'

// Mock auth service
const mockAuthService = {
  validateCurrentSession: vi.fn(),
  getCurrentTutor: vi.fn(),
  validateActivationCode: vi.fn(),
  createTutorSession: vi.fn(),
  logout: vi.fn()
}

vi.mock('../../../src/services/auth.js', () => ({
  default: mockAuthService
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.getItem.mockReturnValue(null)
    mockAuthService.validateCurrentSession.mockResolvedValue(false)
    mockAuthService.getCurrentTutor.mockReturnValue(null)
  })

  const wrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  describe('initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should restore session on mount', async () => {
      const mockSession = {
        role: 'tutor',
        activationCode: 'ELEC2024-BACH',
        course: '1ro Bach A',
        level: 'BACHILLERATO',
        levelName: 'Bachillerato',
        tutorName: 'Profesor García',
        loginTime: new Date().toISOString(),
        sessionId: 'test-session'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))

      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockSession)
      })
    })
  })

  describe('loginAsAdmin', () => {
    it('should login admin successfully', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      const loginResult = await result.current.loginAsAdmin('admin2024')

      expect(loginResult.success).toBe(true)
      expect(result.current.user).toBeDefined()
      expect(result.current.user.role).toBe('admin')
    })

    it('should handle login failure', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      const loginResult = await result.current.loginAsAdmin('wrong')

      expect(loginResult.success).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      const loginPromise = result.current.loginAsAdmin('admin2024')

      // Should be loading
      expect(result.current.isLoading).toBe(true)

      await loginPromise

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('login', () => {
    it('should login tutor successfully', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      const loginResult = await result.current.login('ELEC2024-BACH', '1ro Bach A', 'Profesor García')

      expect(loginResult.success).toBe(true)
      expect(result.current.user).toBeDefined()
      expect(result.current.user.role).toBe('tutor')
    })

    it('should handle tutor login failure', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      const loginResult = await result.current.login('INVALID', '1ro Bach A', 'Profesor García')

      expect(loginResult.success).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      // Login first
      await result.current.loginAsAdmin('admin2024')

      await waitFor(() => {
        expect(result.current.user).toBeDefined()
      })

      // Logout
      result.current.logout()

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('role checking methods', () => {
    it('should correctly identify admin role', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await result.current.loginAsAdmin('admin2024')

      await waitFor(() => {
        expect(result.current.user.role).toBe('admin')
      })
    })

    it('should correctly identify tutor role', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await result.current.login('ELEC2024-BACH', '1ro Bach A', 'Profesor García')

      await waitFor(() => {
        expect(result.current.user.role).toBe('tutor')
      })
    })

    it('should return false for role checks when no user', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('user info getters', () => {
    it('should return user course for tutor', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await result.current.login('ELEC2024-BACH', '1ro Bach A', 'Profesor García')

      await waitFor(() => {
        expect(result.current.user.course).toBe('1ro Bach A')
      })
    })

    it('should return null for user info when no user', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('error handling', () => {
    it('should handle auth service errors gracefully', async () => {
      const { result } = renderHook(() => {
        const { useAuth } = require('../../../src/contexts/AuthContext.jsx')
        return useAuth()
      }, { wrapper })

      const loginResult = await result.current.login('INVALID', '1ro Bach A', 'Profesor García')

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBeDefined()
    })
  })
})