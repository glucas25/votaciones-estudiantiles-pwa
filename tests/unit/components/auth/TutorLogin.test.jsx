import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/utils'
import TutorLogin from '../../../../src/components/auth/TutorLogin'

// Mock the useAuth hook
const mockLoginTutor = vi.fn()
const mockIsLoading = vi.fn()

vi.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    loginTutor: mockLoginTutor,
    isLoading: mockIsLoading(),
  })
}))

describe('TutorLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading.mockReturnValue(false)
  })

  it('should render login form', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText('👨‍🏫 ACCESO DOCENTE')).toBeInTheDocument()
    expect(screen.getByLabelText(/código de activación/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /acceder al sistema/i })).toBeInTheDocument()
  })

  it('should show activation code format examples', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText('BCH1A2024')).toBeInTheDocument()
    expect(screen.getByText('BSP8B2024')).toBeInTheDocument()
    expect(screen.getByText('BMD5A2024')).toBeInTheDocument()
  })

  it('should handle form submission with valid code', async () => {
    const user = userEvent.setup()
    mockLoginTutor.mockResolvedValue({ success: true })
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText(/código de activación/i)
    const submitButton = screen.getByRole('button', { name: /acceder al sistema/i })
    
    await user.type(codeInput, 'BCH1A2024')
    await user.click(submitButton)
    
    expect(mockLoginTutor).toHaveBeenCalledWith('BCH1A2024')
  })

  it('should show error message on login failure', async () => {
    const user = userEvent.setup()
    mockLoginTutor.mockResolvedValue({ 
      success: false, 
      error: 'Código de activación inválido' 
    })
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText(/código de activación/i)
    const submitButton = screen.getByRole('button', { name: /acceder al sistema/i })
    
    await user.type(codeInput, 'INVALID')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Código de activación inválido')).toBeInTheDocument()
    })
  })

  it('should validate required field', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<TutorLogin />)
    
    const submitButton = screen.getByRole('button', { name: /acceder al sistema/i })
    await user.click(submitButton)
    
    expect(mockLoginTutor).not.toHaveBeenCalled()
  })

  it('should disable form during loading', () => {
    mockIsLoading.mockReturnValue(true)
    
    renderWithProviders(<TutorLogin />)
    
    const submitButton = screen.getByRole('button', { name: /accediendo/i })
    expect(submitButton).toBeDisabled()
  })

  it('should convert code to uppercase', async () => {
    const user = userEvent.setup()
    mockLoginTutor.mockResolvedValue({ success: true })
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText(/código de activación/i)
    const submitButton = screen.getByRole('button', { name: /acceder al sistema/i })
    
    await user.type(codeInput, 'bch1a2024')
    await user.click(submitButton)
    
    expect(mockLoginTutor).toHaveBeenCalledWith('BCH1A2024')
  })

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup()
    mockLoginTutor.mockResolvedValue({ 
      success: false, 
      error: 'Código de activación inválido' 
    })
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText(/código de activación/i)
    const submitButton = screen.getByRole('button', { name: /acceder al sistema/i })
    
    // First, cause an error
    await user.type(codeInput, 'INVALID')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('❌ Código de activación inválido')).toBeInTheDocument()
    })
    
    // Then type in input field - error should clear
    await user.clear(codeInput)
    await user.type(codeInput, 'BCH')
    
    expect(screen.queryByText('❌ Código de activación inválido')).not.toBeInTheDocument()
  })

  it('should handle enter key submission', async () => {
    const user = userEvent.setup()
    mockLoginTutor.mockResolvedValue({ success: true })
    
    renderWithProviders(<TutorLogin />)
    
    const codeInput = screen.getByLabelText(/código de activación/i)
    
    await user.type(codeInput, 'BCH1A2024')
    await user.keyboard('{Enter}')
    
    expect(mockLoginTutor).toHaveBeenCalledWith('BCH1A2024')
  })

  it('should show course examples and instructions', () => {
    renderWithProviders(<TutorLogin />)
    
    expect(screen.getByText(/bachillerato/i)).toBeInTheDocument()
    expect(screen.getByText(/básica superior/i)).toBeInTheDocument()
    expect(screen.getByText(/básica media/i)).toBeInTheDocument()
  })
})