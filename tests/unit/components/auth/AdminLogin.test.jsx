import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminLogin from '../../../../src/components/auth/AdminLogin.jsx'

// Mock auth service
vi.mock('../../../../src/services/auth', () => ({
  default: {
    loginAdmin: vi.fn(),
    getSession: vi.fn(),
    clearSession: vi.fn()
  }
}))

// Mock useAuth hook
vi.mock('../../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    loginAdmin: vi.fn(),
    logout: vi.fn()
  })
}))

describe('AdminLogin Component', () => {
  const mockOnLogin = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render login form correctly', () => {
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      expect(screen.getByText('👨‍💼 Acceso Administrador')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Acceder' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('🔄 Iniciando sesión...')).toBeInTheDocument()
    })

    it('should show error message when provided', () => {
      const errorMessage = 'Credenciales incorrectas'
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('should update username field when typing', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      await user.type(usernameInput, 'admin')
      
      expect(usernameInput).toHaveValue('admin')
    })

    it('should update password field when typing', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      await user.type(passwordInput, 'password123')
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const toggleButton = screen.getByRole('button', { name: /toggle password/i })
      
      // Password should be hidden by default
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click to hide password again
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Submission', () => {
    it('should call onLogin with form data when submitted', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      
      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)
      
      expect(mockOnLogin).toHaveBeenCalledWith('admin', 'admin2024')
    })

    it('should not submit form with empty fields', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      await user.click(submitButton)
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('should not submit form with only username', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      
      await user.type(usernameInput, 'admin')
      await user.click(submitButton)
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('should not submit form with only password', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      
      await user.type(passwordInput, 'admin2024')
      await user.click(submitButton)
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })
  })

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should call onCancel when escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      await user.keyboard('{Escape}')
      
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should submit form when Enter key is pressed', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      
      await user.type(usernameInput, 'admin')
      await user.type(passwordInput, 'admin2024')
      await user.keyboard('{Enter}')
      
      expect(mockOnLogin).toHaveBeenCalledWith('admin', 'admin2024')
    })

    it('should focus password field when Tab is pressed from username', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      
      await user.click(usernameInput)
      await user.keyboard('{Tab}')
      
      expect(passwordInput).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      
      expect(usernameInput).toHaveAttribute('aria-label', 'Usuario administrador')
      expect(passwordInput).toHaveAttribute('aria-label', 'Contraseña administrador')
    })

    it('should have proper form labels', () => {
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      expect(screen.getByText('Usuario:')).toBeInTheDocument()
      expect(screen.getByText('Contraseña:')).toBeInTheDocument()
    })

    it('should have proper button types', () => {
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      
      expect(submitButton).toHaveAttribute('type', 'submit')
      expect(cancelButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Error Handling', () => {
    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Credenciales incorrectas'
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} error={errorMessage} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      
      const usernameInput = screen.getByPlaceholderText('Usuario')
      await user.type(usernameInput, 'a')
      
      // Error should be cleared when user starts typing
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    })

    it('should show validation error for empty submission', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} onCancel={mockOnCancel} />)
      
      const submitButton = screen.getByRole('button', { name: 'Acceder' })
      await user.click(submitButton)
      
      // Should show validation error
      expect(screen.getByText(/por favor complete todos los campos/i)).toBeInTheDocument()
    })
  })
})