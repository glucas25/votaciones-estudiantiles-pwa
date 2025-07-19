import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/utils'
import AdminLogin from '../../../../src/components/auth/AdminLogin'

// Mock the useAuth hook
const mockLoginAdmin = vi.fn()
const mockIsLoading = vi.fn()

vi.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    loginAdmin: mockLoginAdmin,
    isLoading: mockIsLoading(),
  })
}))

describe('AdminLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading.mockReturnValue(false)
  })

  it('should render login form', () => {
    renderWithProviders(<AdminLogin />)
    
    expect(screen.getByText('🏛️ ACCESO ADMINISTRATIVO')).toBeInTheDocument()
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('should handle form submission with valid credentials', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue({ success: true })
    
    renderWithProviders(<AdminLogin />)
    
    const usernameInput = screen.getByLabelText(/usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin2024')
    await user.click(submitButton)
    
    expect(mockLoginAdmin).toHaveBeenCalledWith('admin', 'admin2024')
  })

  it('should show error message on login failure', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue({ 
      success: false, 
      error: 'Credenciales incorrectas' 
    })
    
    renderWithProviders(<AdminLogin />)
    
    const usernameInput = screen.getByLabelText(/usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Credenciales incorrectas')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<AdminLogin />)
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(submitButton)
    
    expect(mockLoginAdmin).not.toHaveBeenCalled()
  })

  it('should disable form during loading', () => {
    mockIsLoading.mockReturnValue(true)
    
    renderWithProviders(<AdminLogin />)
    
    const submitButton = screen.getByRole('button', { name: /iniciando sesión/i })
    expect(submitButton).toBeDisabled()
  })

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue({ 
      success: false, 
      error: 'Credenciales incorrectas' 
    })
    
    renderWithProviders(<AdminLogin />)
    
    const usernameInput = screen.getByLabelText(/usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    // First, cause an error
    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'wrong')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Credenciales incorrectas')).toBeInTheDocument()
    })
    
    // Then type in username field - error should clear
    await user.clear(usernameInput)
    await user.type(usernameInput, 'newadmin')
    
    expect(screen.queryByText('❌ Credenciales incorrectas')).not.toBeInTheDocument()
  })

  it('should show password visibility toggle', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<AdminLogin />)
    
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i })
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue({ success: true })
    
    renderWithProviders(<AdminLogin />)
    
    const usernameInput = screen.getByLabelText(/usuario/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    
    await user.type(usernameInput, 'admin')
    await user.tab()
    
    expect(passwordInput).toHaveFocus()
    
    await user.type(passwordInput, 'admin2024')
    await user.keyboard('{Enter}')
    
    expect(mockLoginAdmin).toHaveBeenCalledWith('admin', 'admin2024')
  })
})