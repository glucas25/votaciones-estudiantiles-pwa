import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext'
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

// Test component to use the hook
const TestComponent = () => {
  const { user, isLoading, loginAdmin, loginTutor, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.role : 'no user'}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not loading'}</div>
      <button 
        data-testid="login-admin" 
        onClick={() => loginAdmin('admin', 'admin2024')}
      >
        Login Admin
      </button>
      <button 
        data-testid="login-tutor" 
        onClick={() => loginTutor('BCH1A2024')}
      >
        Login Tutor
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getSession.mockReturnValue(null)
  })

  describe('AuthProvider initialization', () => {
    it('should initialize with no user when no session exists', async () => {
      authService.getSession.mockReturnValue(null)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
        expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
      })
    })

    it('should restore user from valid session', async () => {
      const mockSession = {
        user: { id: 'admin-1', role: 'admin' },
        timestamp: Date.now()
      }
      authService.getSession.mockReturnValue(mockSession)
      authService.isSessionValid.mockReturnValue(true)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('admin')
      })
    })

    it('should clear invalid session on initialization', async () => {
      const mockSession = {
        user: { id: 'admin-1', role: 'admin' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // expired
      }
      authService.getSession.mockReturnValue(mockSession)
      authService.isSessionValid.mockReturnValue(false)
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(authService.clearSession).toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('loginAdmin', () => {
    it('should login admin successfully', async () => {
      const user = userEvent.setup()
      authService.loginAdmin.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await user.click(screen.getByTestId('login-admin'))
      
      await waitFor(() => {
        expect(authService.loginAdmin).toHaveBeenCalledWith('admin', 'admin2024')
        expect(authService.saveSession).toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('admin')
      })
    })

    it('should handle admin login failure', async () => {
      const user = userEvent.setup()
      authService.loginAdmin.mockResolvedValue({
        success: false,
        error: 'Credenciales incorrectas'
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await user.click(screen.getByTestId('login-admin'))
      
      await waitFor(() => {
        expect(authService.saveSession).not.toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('loginTutor', () => {
    it('should login tutor successfully', async () => {
      const user = userEvent.setup()
      authService.loginTutor.mockResolvedValue({
        success: true,
        user: { 
          id: 'tutor-1', 
          role: 'tutor', 
          course: '1ro Bach A',
          activationCode: 'BCH1A2024'
        }
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await user.click(screen.getByTestId('login-tutor'))
      
      await waitFor(() => {
        expect(authService.loginTutor).toHaveBeenCalledWith('BCH1A2024')
        expect(authService.saveSession).toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('tutor')
      })
    })

    it('should handle tutor login failure', async () => {
      const user = userEvent.setup()
      authService.loginTutor.mockResolvedValue({
        success: false,
        error: 'Código de activación inválido'
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await user.click(screen.getByTestId('login-tutor'))
      
      await waitFor(() => {
        expect(authService.saveSession).not.toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('logout', () => {
    it('should logout user and clear session', async () => {
      const user = userEvent.setup()
      
      // Start with logged in user
      authService.loginAdmin.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      // Login first
      await user.click(screen.getByTestId('login-admin'))
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('admin')
      })
      
      // Then logout
      await user.click(screen.getByTestId('logout'))
      
      await waitFor(() => {
        expect(authService.clearSession).toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('loading states', () => {
    it('should show loading during login process', async () => {
      const user = userEvent.setup()
      
      // Make login async to test loading state
      authService.loginAdmin.mockImplementation(
        () => new Promise(resolve => setTimeout(() => 
          resolve({ success: true, user: { id: 'admin-1', role: 'admin' } }), 100
        ))
      )
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
      
      await user.click(screen.getByTestId('login-admin'))
      
      // Should show loading immediately
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      
      // Should stop loading after login completes
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not loading')
      }, { timeout: 200 })
    })
  })

  describe('hook usage outside provider', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth debe ser usado dentro de AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })
})