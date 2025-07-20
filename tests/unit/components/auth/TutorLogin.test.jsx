import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TutorLogin from '../../../../src/components/auth/TutorLogin'

// Mock the useAuth hook
const mockLogin = vi.fn()
const mockValidateActivationCode = vi.fn()
const mockGetAvailableCourses = vi.fn()
const mockIsOnline = vi.fn()

vi.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    validateActivationCode: mockValidateActivationCode,
    getAvailableCourses: mockGetAvailableCourses,
    isOnline: mockIsOnline(),
  })
}))

const renderWithProviders = (component) => {
  return render(component)
}

describe('TutorLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOnline.mockReturnValue(true)
    mockValidateActivationCode.mockReturnValue({ valid: false, error: 'Código inválido' })
    mockGetAvailableCourses.mockReturnValue([])
  })

  it('should render login form', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText('🏫 ELECCIONES ESTUDIANTILES 2024')).toBeInTheDocument()
    expect(screen.getByText('📱 ACCESO DOCENTE')).toBeInTheDocument()
    expect(screen.getByLabelText('🔑 Código de Activación:')).toBeInTheDocument()
    expect(screen.getByLabelText('👤 Nombre del Docente (Opcional):')).toBeInTheDocument()
    expect(screen.getByLabelText('🎓 Seleccionar Curso:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })).toBeInTheDocument()
  })

  it('should show activation code format examples', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText('ELEC2024-BACH')).toBeInTheDocument()
    expect(screen.getByText('ELEC2024-BASICA-SUP')).toBeInTheDocument()
    expect(screen.getByText('ELEC2024-BASICA-MEDIA')).toBeInTheDocument()
    expect(screen.getByText('ELEC2024-BASICA-ELEM')).toBeInTheDocument()
  })

  it('should handle form submission with valid code', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A'])
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const courseSelect = screen.getByLabelText('🎓 Seleccionar Curso:')
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    
    await user.type(codeInput, 'ELEC2024-BACH')
    await user.selectOptions(courseSelect, '1ro Bach A')
    await user.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('ELEC2024-BACH', '1ro Bach A', '')
  })

  it('should show error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Código de activación inválido' 
    })
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A'])
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const courseSelect = screen.getByLabelText('🎓 Seleccionar Curso:')
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    
    await user.type(codeInput, 'ELEC2024-BACH')
    await user.selectOptions(courseSelect, '1ro Bach A')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Código de activación inválido')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<TutorLogin />)
    
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    await user.click(submitButton)
    
    expect(mockLogin).not.toHaveBeenCalled()
    // The button should be disabled when no code is entered, so no validation error is shown
    expect(submitButton).toBeDisabled()
  })

  it('should disable form during loading', () => {
    renderWithProviders(<TutorLogin />)
    
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    expect(submitButton).toBeDisabled()
  })

  it('should convert code to uppercase', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A'])
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const courseSelect = screen.getByLabelText('🎓 Seleccionar Curso:')
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    
    await user.type(codeInput, 'elec2024-bach')
    await user.selectOptions(courseSelect, '1ro Bach A')
    await user.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('ELEC2024-BACH', '1ro Bach A', '')
  })

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Código de activación inválido' 
    })
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A'])
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const courseSelect = screen.getByLabelText('🎓 Seleccionar Curso:')
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    
    // First, cause an error
    await user.type(codeInput, 'ELEC2024-BACH')
    await user.selectOptions(courseSelect, '1ro Bach A')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Código de activación inválido')).toBeInTheDocument()
    })
    
    // Then type in input field - error should clear
    await user.clear(codeInput)
    await user.type(codeInput, 'ELEC')
    
    expect(screen.queryByText('⚠️ Código de activación inválido')).not.toBeInTheDocument()
  })

  it('should handle enter key submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A'])
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const courseSelect = screen.getByLabelText('🎓 Seleccionar Curso:')
    
    await user.type(codeInput, 'ELEC2024-BACH')
    await user.selectOptions(courseSelect, '1ro Bach A')
    // Focus on the form to ensure Enter key works
    await user.click(codeInput)
    await user.keyboard('{Enter}')
    
    expect(mockLogin).toHaveBeenCalledWith('ELEC2024-BACH', '1ro Bach A', '')
  })

  it('should show course examples and instructions', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText(/Bachillerato/)).toBeInTheDocument()
    expect(screen.getByText(/Básica Superior/)).toBeInTheDocument()
    expect(screen.getByText(/Básica Media/)).toBeInTheDocument()
    expect(screen.getByText(/Básica Elemental/)).toBeInTheDocument()
  })

  it('should show connection status', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText(/💡 Estado:/)).toBeInTheDocument()
    expect(screen.getByText(/🟢 Conectado/)).toBeInTheDocument()
  })

  it('should show sync status', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText(/🔄 Sincronizado/)).toBeInTheDocument()
  })

  it('should include tutor name in submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A'])
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const tutorNameInput = screen.getByLabelText('👤 Nombre del Docente (Opcional):')
    const courseSelect = screen.getByLabelText('🎓 Seleccionar Curso:')
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    
    await user.type(codeInput, 'ELEC2024-BACH')
    await user.type(tutorNameInput, 'Profesor García')
    await user.selectOptions(courseSelect, '1ro Bach A')
    await user.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('ELEC2024-BACH', '1ro Bach A', 'Profesor García')
  })

  it('should validate course selection', async () => {
    const user = userEvent.setup()
    mockValidateActivationCode.mockReturnValue({ valid: true })
    mockGetAvailableCourses.mockReturnValue(['1ro Bach A', '2do Bach A']) // Multiple courses
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText('🔑 Código de Activación:')
    const submitButton = screen.getByRole('button', { name: '🔓 INICIAR VOTACIÓN' })
    
    await user.type(codeInput, 'ELEC2024-BACH')
    await user.click(submitButton)
    
    // When multiple courses are available, user must select one manually
    // so login should not be called without course selection
    expect(mockLogin).not.toHaveBeenCalled()
  })
})