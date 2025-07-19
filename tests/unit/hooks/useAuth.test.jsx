import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../../../src/hooks/useAuth'
import { AuthProvider } from '../../../src/contexts/AuthContext'
import authService from '../../../src/services/auth'

// Mock auth service
vi.mock('../../../src/services/auth', () => ({
  default: {
    loginAdmin: vi.fn(),
    loginTutor: vi.fn(),
    getSession: vi.fn(),
    saveSession: vi.fn(),
    clearSession: vi.fn(),
    isSessionValid: vi.fn()
  }
}))

// Mock database service
vi.mock('../../../src/services/database', () => ({
  database: {
    getConnectionStatus: vi.fn().mockResolvedValue({ local: true, online: true })
  }
}))

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getSession.mockReturnValue(null)
    authService.isSessionValid.mockReturnValue(true)
  })

  describe('initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isAuthenticated).toBe(false)
      })
    })

    it('should restore session on mount', async () => {
      const mockSession = {
        user: { id: 'admin-1', role: 'admin' },
        timestamp: Date.now()
      }
      authService.getSession.mockReturnValue(mockSession)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockSession.user)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })
  })

  describe('loginAdmin', () => {
    it('should login admin successfully', async () => {
      const mockUser = { id: 'admin-1', role: 'admin' }
      authService.loginAdmin.mockResolvedValue({
        success: true,
        user: mockUser
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      const loginResult = await result.current.loginAdmin('admin', 'admin2024')
      
      expect(loginResult.success).toBe(true)
      expect(authService.loginAdmin).toHaveBeenCalledWith('admin', 'admin2024')
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('should handle login failure', async () => {
      authService.loginAdmin.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      const loginResult = await result.current.loginAdmin('admin', 'wrong')
      
      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid credentials')
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should set loading state during login', async () => {
      authService.loginAdmin.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ success: true, user: { id: 'admin-1', role: 'admin' } }), 100)
        )
      )
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      const loginPromise = result.current.loginAdmin('admin', 'admin2024')
      
      // Should be loading
      expect(result.current.isLoading).toBe(true)
      
      await loginPromise
      
      // Should not be loading after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('loginTutor', () => {
    it('should login tutor successfully', async () => {
      const mockUser = { 
        id: 'tutor-1', 
        role: 'tutor', 
        course: '1ro Bach A',
        activationCode: 'BCH1A2024'
      }
      authService.loginTutor.mockResolvedValue({
        success: true,
        user: mockUser
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      const loginResult = await result.current.loginTutor('BCH1A2024')
      
      expect(loginResult.success).toBe(true)
      expect(authService.loginTutor).toHaveBeenCalledWith('BCH1A2024')
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('should handle tutor login failure', async () => {
      authService.loginTutor.mockResolvedValue({
        success: false,
        error: 'Invalid activation code'
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      const loginResult = await result.current.loginTutor('INVALID')
      
      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBe('Invalid activation code')
      expect(result.current.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Start with logged in user
      const mockUser = { id: 'admin-1', role: 'admin' }
      authService.loginAdmin.mockResolvedValue({
        success: true,
        user: mockUser
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Login first
      await result.current.loginAdmin('admin', 'admin2024')
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })
      
      // Then logout
      result.current.logout()
      
      await waitFor(() => {
        expect(authService.clearSession).toHaveBeenCalled()
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
      })
    })
  })

  describe('role checking methods', () => {
    it('should correctly identify admin role', async () => {
      const mockUser = { id: 'admin-1', role: 'admin' }
      authService.getSession.mockReturnValue({
        user: mockUser,
        timestamp: Date.now()
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isAdmin()).toBe(true)
        expect(result.current.isTutor()).toBe(false)
        expect(result.current.isStudent()).toBe(false)
      })
    })

    it('should correctly identify tutor role', async () => {
      const mockUser = { id: 'tutor-1', role: 'tutor', course: '1ro Bach A' }
      authService.getSession.mockReturnValue({
        user: mockUser,
        timestamp: Date.now()
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isAdmin()).toBe(false)
        expect(result.current.isTutor()).toBe(true)
        expect(result.current.isStudent()).toBe(false)
      })
    })

    it('should return false for role checks when no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.isAdmin()).toBe(false)
      expect(result.current.isTutor()).toBe(false)
      expect(result.current.isStudent()).toBe(false)
    })
  })

  describe('user info getters', () => {
    it('should return user course for tutor', async () => {
      const mockUser = { 
        id: 'tutor-1', 
        role: 'tutor', 
        course: '1ro Bach A',
        level: 'BACHILLERATO'
      }
      authService.getSession.mockReturnValue({
        user: mockUser,
        timestamp: Date.now()
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.getUserCourse()).toBe('1ro Bach A')
        expect(result.current.getUserLevel()).toBe('BACHILLERATO')
      })
    })

    it('should return null for user info when no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.getUserCourse()).toBeNull()
      expect(result.current.getUserLevel()).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle auth service errors gracefully', async () => {
      authService.loginAdmin.mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      const loginResult = await result.current.loginAdmin('admin', 'admin2024')
      
      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toContain('Error')
    })
  })
})