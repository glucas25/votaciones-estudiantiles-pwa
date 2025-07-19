import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils'
import App from '../../src/App'

// Mock services
vi.mock('../../src/services/auth', () => ({
  default: {
    loginAdmin: vi.fn(),
    loginTutor: vi.fn(),
    getSession: vi.fn(),
    saveSession: vi.fn(),
    clearSession: vi.fn(),
    isSessionValid: vi.fn()
  }
}))

vi.mock('../../src/services/database', () => ({
  database: {
    getConnectionStatus: vi.fn().mockResolvedValue({ local: true, online: true })
  },
  initDatabase: vi.fn().mockResolvedValue({})
}))

import authService from '../../src/services/auth'

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getSession.mockReturnValue(null)
    authService.isSessionValid.mockReturnValue(true)
  })

  it('should complete full admin authentication flow', async () => {
    const user = userEvent.setup()
    
    // Mock successful admin login
    authService.loginAdmin.mockResolvedValue({
      success: true,
      user: {
        id: 'admin-1',
        role: 'admin',
        loginTime: new Date().toISOString()
      }
    })
    
    renderWithProviders(<App />)
    
    // Should start at homepage
    expect(screen.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeInTheDocument()
    
    // Click admin role
    await user.click(screen.getByText('Administrador'))
    
    // Should navigate to admin login
    expect(screen.getByText('🏛️ ACCESO ADMINISTRATIVO')).toBeInTheDocument()
    
    // Fill login form
    await user.type(screen.getByLabelText(/usuario/i), 'admin')
    await user.type(screen.getByLabelText(/contraseña/i), 'admin2024')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    // Should redirect to admin dashboard
    await waitFor(() => {
      expect(screen.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeInTheDocument()
    })
    
    // Verify admin session was saved
    expect(authService.saveSession).toHaveBeenCalled()
  })

  it('should complete full tutor authentication flow', async () => {
    const user = userEvent.setup()
    
    // Mock successful tutor login
    authService.loginTutor.mockResolvedValue({
      success: true,
      user: {
        id: 'tutor-1',
        role: 'tutor',
        course: '1ro Bach A',
        level: 'BACHILLERATO',
        activationCode: 'BCH1A2024',
        loginTime: new Date().toISOString()
      }
    })
    
    renderWithProviders(<App />)
    
    // Should start at homepage
    expect(screen.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeInTheDocument()
    
    // Click tutor role
    await user.click(screen.getByText('Docente/Tutor'))
    
    // Should navigate to tutor login
    expect(screen.getByText('👨‍🏫 ACCESO DOCENTE')).toBeInTheDocument()
    
    // Fill activation code
    await user.type(screen.getByLabelText(/código de activación/i), 'BCH1A2024')
    await user.click(screen.getByRole('button', { name: /acceder al sistema/i }))
    
    // Should redirect to tutor panel
    await waitFor(() => {
      expect(screen.getByText('📱 Gestión de Votación')).toBeInTheDocument()
    })
    
    // Verify tutor session was saved
    expect(authService.saveSession).toHaveBeenCalled()
  })

  it('should handle authentication errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock failed admin login
    authService.loginAdmin.mockResolvedValue({
      success: false,
      error: 'Credenciales incorrectas'
    })
    
    renderWithProviders(<App />)
    
    // Navigate to admin login
    await user.click(screen.getByText('Administrador'))
    
    // Attempt login with wrong credentials
    await user.type(screen.getByLabelText(/usuario/i), 'admin')
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    // Should show error and stay on login page
    await waitFor(() => {
      expect(screen.getByText('❌ Credenciales incorrectas')).toBeInTheDocument()
    })
    
    expect(screen.getByText('🏛️ ACCESO ADMINISTRATIVO')).toBeInTheDocument()
    expect(authService.saveSession).not.toHaveBeenCalled()
  })

  it('should restore session on app initialization', async () => {
    // Mock existing session
    const mockSession = {
      user: {
        id: 'admin-1',
        role: 'admin',
        loginTime: new Date().toISOString()
      },
      timestamp: Date.now()
    }
    
    authService.getSession.mockReturnValue(mockSession)
    authService.isSessionValid.mockReturnValue(true)
    
    renderWithProviders(<App />)
    
    // Should directly show admin dashboard
    await waitFor(() => {
      expect(screen.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeInTheDocument()
    })
    
    // Should not show homepage
    expect(screen.queryByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).not.toBeInTheDocument()
  })

  it('should clear invalid session on app initialization', async () => {
    // Mock expired session
    const expiredSession = {
      user: {
        id: 'admin-1',
        role: 'admin',
        loginTime: new Date().toISOString()
      },
      timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    }
    
    authService.getSession.mockReturnValue(expiredSession)
    authService.isSessionValid.mockReturnValue(false)
    
    renderWithProviders(<App />)
    
    // Should clear session and show homepage
    await waitFor(() => {
      expect(authService.clearSession).toHaveBeenCalled()
      expect(screen.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeInTheDocument()
    })
  })

  it('should handle logout flow correctly', async () => {
    const user = userEvent.setup()
    
    // Start with logged in admin
    authService.loginAdmin.mockResolvedValue({
      success: true,
      user: {
        id: 'admin-1',
        role: 'admin',
        loginTime: new Date().toISOString()
      }
    })
    
    renderWithProviders(<App />)
    
    // Login as admin
    await user.click(screen.getByText('Administrador'))
    await user.type(screen.getByLabelText(/usuario/i), 'admin')
    await user.type(screen.getByLabelText(/contraseña/i), 'admin2024')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    await waitFor(() => {
      expect(screen.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeInTheDocument()
    })
    
    // Logout
    await user.click(screen.getByRole('button', { name: /🚪 salir/i }))
    
    // Should return to homepage
    await waitFor(() => {
      expect(screen.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeInTheDocument()
    })
    
    expect(authService.clearSession).toHaveBeenCalled()
  })

  it('should show loading states during authentication', async () => {
    const user = userEvent.setup()
    
    // Mock slow login response
    authService.loginAdmin.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          user: { id: 'admin-1', role: 'admin' }
        }), 500)
      )
    )
    
    renderWithProviders(<App />)
    
    await user.click(screen.getByText('Administrador'))
    await user.type(screen.getByLabelText(/usuario/i), 'admin')
    await user.type(screen.getByLabelText(/contraseña/i), 'admin2024')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    // Should show loading state
    expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeDisabled()
    
    // Should complete after delay
    await waitFor(() => {
      expect(screen.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should handle role-based navigation correctly', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<App />)
    
    // Test navigation to different role logins
    await user.click(screen.getByText('Administrador'))
    expect(screen.getByText('🏛️ ACCESO ADMINISTRATIVO')).toBeInTheDocument()
    
    // Go back to homepage (if there's a back button or navigate manually)
    // This would depend on actual navigation implementation
    renderWithProviders(<App />)
    
    await user.click(screen.getByText('Docente/Tutor'))
    expect(screen.getByText('👨‍🏫 ACCESO DOCENTE')).toBeInTheDocument()
  })
})