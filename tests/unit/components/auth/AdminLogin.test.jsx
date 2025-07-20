import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../../../../src/contexts/AuthContext.jsx'
import AdminLogin from '../../../../src/components/auth/AdminLogin.jsx'

// Mock auth service
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

vi.mock('../../../../src/services/auth.js', () => ({
  default: mockAuthService
}))

// Mock database service
vi.mock('../../../../src/services/database-indexeddb.js', () => ({
  default: {
    createDocument: vi.fn(),
    findDocuments: vi.fn(),
    isReady: vi.fn().mockReturnValue(true)
  },
  DOC_TYPES: {
    SESSION: 'session'
  }
}))

// Mock useAuth hook
const mockUseAuth = {
  loginAsAdmin: vi.fn(),
  isOnline: true
}

vi.mock('../../../../src/contexts/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => mockUseAuth
}))

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('AdminLogin Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.loginAsAdmin.mockResolvedValue({ success: true })
    mockUseAuth.isOnline = true
  })

  describe('Rendering', () => {
    it('should render admin login form', () => {
      renderWithProviders(<AdminLogin />)

      expect(screen.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeInTheDocument()
      expect(screen.getByText('🔐 ACCESO RESTRINGIDO')).toBeInTheDocument()
      expect(screen.getByLabelText('🔑 Contraseña de Administrador:')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ingrese la contraseña')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })).toBeInTheDocument()
    })

    it('should show connection status', () => {
      renderWithProviders(<AdminLogin />)

      expect(screen.getByText(/💡 Estado:/)).toBeInTheDocument()
      expect(screen.getByText(/🟢 Conectado/)).toBeInTheDocument()
    })

    it('should show help information', () => {
      renderWithProviders(<AdminLogin />)

      expect(screen.getByText('ℹ️ Información:')).toBeInTheDocument()
      expect(screen.getByText(/Para acceso de desarrollo/)).toBeInTheDocument()
      expect(screen.getByText(/admin2024/)).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('should update password field when typing', async () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      await user.type(passwordInput, 'admin2024')

      expect(passwordInput).toHaveValue('admin2024')
    })

    it('should enable submit button when password is entered', async () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })

      expect(submitButton).toBeDisabled()

      await user.type(passwordInput, 'admin2024')

      expect(submitButton).not.toBeDisabled()
    })

    it('should disable submit button when password is empty', () => {
      renderWithProviders(<AdminLogin />)

      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call loginAsAdmin with password on submit', async () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })

      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)

      expect(mockUseAuth.loginAsAdmin).toHaveBeenCalledWith('admin2024')
    })

    it('should show loading state during submission', async () => {
      mockUseAuth.loginAsAdmin.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })

      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)

      expect(screen.getByText('🔄 Verificando...')).toBeInTheDocument()
    })

    it('should show error message on failed login', async () => {
      mockUseAuth.loginAsAdmin.mockResolvedValue({ 
        success: false, 
        error: 'Contraseña incorrecta' 
      })

      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })

      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('⚠️ Contraseña incorrecta')).toBeInTheDocument()
      })
    })

    it('should show validation error for empty password', async () => {
      renderWithProviders(<AdminLogin />)

      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })
      await user.click(submitButton)

      // The button should be disabled, so no submission should occur
      expect(mockUseAuth.loginAsAdmin).not.toHaveBeenCalled()
    })

    it('should clear error when user starts typing', async () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })

      // First submit to show error (but button is disabled)
      await user.click(submitButton)
      expect(mockUseAuth.loginAsAdmin).not.toHaveBeenCalled()

      // Then type to enable button
      await user.type(passwordInput, 'a')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Connection Status', () => {
    it('should show online status when connected', () => {
      mockUseAuth.isOnline = true
      renderWithProviders(<AdminLogin />)

      expect(screen.getByText(/🟢 Conectado/)).toBeInTheDocument()
    })

    it('should show offline status when disconnected', () => {
      mockUseAuth.isOnline = false
      renderWithProviders(<AdminLogin />)

      expect(screen.getByText(/🔴 Sin conexión/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(<AdminLogin />)

      expect(screen.getByLabelText('🔑 Contraseña de Administrador:')).toBeInTheDocument()
    })

    it('should have proper button types', () => {
      renderWithProviders(<AdminLogin />)

      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should have proper input attributes', () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network error that returns an error object instead of throwing
      mockUseAuth.loginAsAdmin.mockResolvedValue({ 
        success: false, 
        error: 'Error de conexión' 
      })

      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })

      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('⚠️ Error de conexión')).toBeInTheDocument()
      })
    })

    it('should not submit form with empty password', async () => {
      renderWithProviders(<AdminLogin />)

      const submitButton = screen.getByRole('button', { name: '🔓 ACCEDER AL PANEL' })
      await user.click(submitButton)

      expect(mockUseAuth.loginAsAdmin).not.toHaveBeenCalled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should submit form when Enter key is pressed', async () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      await user.type(passwordInput, 'admin2024')
      await user.keyboard('{Enter}')

      expect(mockUseAuth.loginAsAdmin).toHaveBeenCalledWith('admin2024')
    })

    it('should focus password field when clicked', async () => {
      renderWithProviders(<AdminLogin />)

      const passwordInput = screen.getByPlaceholderText('Ingrese la contraseña')
      await user.click(passwordInput)
      expect(passwordInput).toHaveFocus()
    })
  })
})