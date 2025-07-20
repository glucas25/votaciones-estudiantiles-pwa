import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../src/contexts/AuthContext.jsx'
import AdminLogin from '../../src/components/auth/AdminLogin.jsx'
import TutorLogin from '../../src/components/auth/TutorLogin.jsx'
import ProtectedRoute from '../../src/components/auth/ProtectedRoute.jsx'

// Mock database service
vi.mock('../../src/services/database-indexeddb.js', () => ({
  default: {
    createDocument: vi.fn(),
    findDocuments: vi.fn(),
    isReady: vi.fn().mockReturnValue(true)
  },
  DOC_TYPES: {
    SESSION: 'session'
  }
}))

// Mock auth service
vi.mock('../../src/services/auth.js', () => ({
  default: {
    loginAdmin: vi.fn(),
    loginTutor: vi.fn(),
    getSession: vi.fn(),
    clearSession: vi.fn(),
    isSessionValid: vi.fn()
  }
}))

// Test component to render with providers
const TestWrapper = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
)

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Admin Authentication Flow', () => {
    it('should complete full admin login flow', async () => {
      const user = userEvent.setup()
      
      // Mock successful admin login
      const { default: authService } = await import('../../src/services/auth.js')
      authService.loginAdmin.mockResolvedValue({
        success: true,
        user: {
          role: 'admin',
          username: 'admin',
          sessionId: 'admin-session-123'
        }
      })

      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      // Fill and submit form
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const submitButton = screen.getByRole('button', { name: 'Acceder' })

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)

      // Verify service was called
      expect(authService.loginAdmin).toHaveBeenCalledWith('admin', 'admin2024')

      // Wait for login to complete
      await waitFor(() => {
        expect(authService.loginAdmin).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle admin login failure gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock failed admin login
      const { default: authService } = await import('../../src/services/auth.js')
      authService.loginAdmin.mockResolvedValue({
        success: false,
        error: 'Credenciales incorrectas'
      })

      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      // Fill and submit form
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const submitButton = screen.getByRole('button', { name: 'Acceder' })

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      // Verify service was called
      expect(authService.loginAdmin).toHaveBeenCalledWith('admin', 'wrongpassword')

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tutor Authentication Flow', () => {
    it('should complete full tutor login flow', async () => {
      const user = userEvent.setup()
      
      // Mock successful tutor login
      const { default: authService } = await import('../../src/services/auth.js')
      authService.loginTutor.mockResolvedValue({
        success: true,
        user: {
          role: 'tutor',
          activationCode: 'BCH1A2024',
          course: '1ro Bach A',
          level: 'BACHILLERATO',
          sessionId: 'tutor-session-123'
        }
      })

      render(
        <TestWrapper>
          <TutorLogin />
        </TestWrapper>
      )

      // Fill and submit form
      const codeInput = screen.getByPlaceholderText(/código de activación/i)
      const submitButton = screen.getByRole('button', { name: /acceder/i })

      await user.type(codeInput, 'BCH1A2024')
      await user.click(submitButton)

      // Verify service was called
      expect(authService.loginTutor).toHaveBeenCalledWith('BCH1A2024')

      // Wait for login to complete
      await waitFor(() => {
        expect(authService.loginTutor).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle tutor login failure gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock failed tutor login
      const { default: authService } = await import('../../src/services/auth.js')
      authService.loginTutor.mockResolvedValue({
        success: false,
        error: 'Código de activación inválido'
      })

      render(
        <TestWrapper>
          <TutorLogin />
        </TestWrapper>
      )

      // Fill and submit form
      const codeInput = screen.getByPlaceholderText(/código de activación/i)
      const submitButton = screen.getByRole('button', { name: /acceder/i })

      await user.type(codeInput, 'INVALID_CODE')
      await user.click(submitButton)

      // Verify service was called
      expect(authService.loginTutor).toHaveBeenCalledWith('INVALID_CODE')

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/código de activación inválido/i)).toBeInTheDocument()
      })
    })
  })

  describe('Protected Route Integration', () => {
    it('should render protected content for authenticated admin', async () => {
      // Mock authenticated admin session
      const { default: authService } = await import('../../src/services/auth.js')
      authService.getSession.mockReturnValue({
        role: 'admin',
        username: 'admin',
        sessionId: 'admin-session-123'
      })
      authService.isSessionValid.mockReturnValue(true)

      const TestComponent = () => <div>Protected Admin Content</div>

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['admin']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should show protected content
      expect(screen.getByText('Protected Admin Content')).toBeInTheDocument()
    })

    it('should render protected content for authenticated tutor', async () => {
      // Mock authenticated tutor session
      const { default: authService } = await import('../../src/services/auth.js')
      authService.getSession.mockReturnValue({
        role: 'tutor',
        activationCode: 'BCH1A2024',
        course: '1ro Bach A'
      })
      authService.isSessionValid.mockReturnValue(true)

      const TestComponent = () => <div>Protected Tutor Content</div>

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['tutor']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should show protected content
      expect(screen.getByText('Protected Tutor Content')).toBeInTheDocument()
    })

    it('should redirect unauthenticated users', async () => {
      // Mock no session
      const { default: authService } = await import('../../src/services/auth.js')
      authService.getSession.mockReturnValue(null)
      authService.isSessionValid.mockReturnValue(false)

      const TestComponent = () => <div>Protected Content</div>

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['admin']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should not show protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should redirect users with insufficient permissions', async () => {
      // Mock tutor session trying to access admin content
      const { default: authService } = await import('../../src/services/auth.js')
      authService.getSession.mockReturnValue({
        role: 'tutor',
        activationCode: 'BCH1A2024'
      })
      authService.isSessionValid.mockReturnValue(true)

      const TestComponent = () => <div>Admin Only Content</div>

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['admin']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should not show protected content
      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
    })
  })

  describe('Session Management Integration', () => {
    it('should persist session across component re-renders', async () => {
      // Mock existing session
      const mockSession = {
        role: 'admin',
        username: 'admin',
        sessionId: 'admin-session-123'
      }
      
      const { default: authService } = await import('../../src/services/auth.js')
      authService.getSession.mockReturnValue(mockSession)
      authService.isSessionValid.mockReturnValue(true)

      const { rerender } = render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['admin']}>
            <div>Persistent Content</div>
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should show content initially
      expect(screen.getByText('Persistent Content')).toBeInTheDocument()

      // Re-render component
      rerender(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['admin']}>
            <div>Persistent Content</div>
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should still show content after re-render
      expect(screen.getByText('Persistent Content')).toBeInTheDocument()
    })

    it('should handle session expiration gracefully', async () => {
      // Mock expired session
      const { default: authService } = await import('../../src/services/auth.js')
      authService.getSession.mockReturnValue({
        role: 'admin',
        username: 'admin',
        loginTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      })
      authService.isSessionValid.mockReturnValue(false)

      const TestComponent = () => <div>Protected Content</div>

      render(
        <TestWrapper>
          <ProtectedRoute allowedRoles={['admin']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Should not show protected content for expired session
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database errors during authentication', async () => {
      const user = userEvent.setup()
      
      // Mock database error during login
      const { default: authService } = await import('../../src/services/auth.js')
      authService.loginAdmin.mockRejectedValue(new Error('Database connection failed'))

      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      // Fill and submit form
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const submitButton = screen.getByRole('button', { name: 'Acceder' })

      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(authService.loginAdmin).toHaveBeenCalledWith('admin', 'admin2024')
      })
    })

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })

      const { default: authService } = await import('../../src/services/auth.js')
      authService.loginAdmin.mockResolvedValue({
        success: true,
        user: { role: 'admin', username: 'admin' }
      })

      render(
        <TestWrapper>
          <AdminLogin />
        </TestWrapper>
      )

      // Should not crash when localStorage fails
      expect(screen.getByText('👨‍💼 Acceso Administrador')).toBeInTheDocument()

      // Restore original
      localStorage.setItem = originalSetItem
    })
  })
})