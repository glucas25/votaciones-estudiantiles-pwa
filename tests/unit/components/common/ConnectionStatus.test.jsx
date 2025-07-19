import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/utils'
import ConnectionStatus from '../../../../src/components/common/ConnectionStatus'

// Mock useDatabase hook
const mockConnectionStatus = vi.fn()
const mockRefreshStatus = vi.fn()

vi.mock('../../../../src/hooks/useDatabase', () => ({
  default: () => ({
    connectionStatus: mockConnectionStatus(),
    refreshStatus: mockRefreshStatus,
  })
}))

describe('ConnectionStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date.now() for consistent time display
    vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('10:30:00 AM')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render system status header', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('📊')).toBeInTheDocument()
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
  })

  it('should show online connection status', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('🟢')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('should show offline connection status', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: false,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('🔴')).toBeInTheDocument()
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
  })

  it('should show local database status', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('Base Local Conectada')).toBeInTheDocument()
  })

  it('should show local database error status', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: false,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('Base Local No disponible')).toBeInTheDocument()
  })

  it('should show loading states', () => {
    mockConnectionStatus.mockReturnValue({
      loading: true,
      online: false,
      local: false,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getAllByText('🔄')).toHaveLength(2) // One for connection, one for database
    expect(screen.getAllByText('Verificando...')).toHaveLength(2)
  })

  it('should show application status as running', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('Vite Funcionando')).toBeInTheDocument()
  })

  it('should show current time', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('10:30:00 AM')).toBeInTheDocument()
  })

  it('should show offline mode message when offline', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: false,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('⚠️')).toBeInTheDocument()
    expect(screen.getByText(/modo offline activado/i)).toBeInTheDocument()
    expect(screen.getByText(/los datos se mantienen localmente/i)).toBeInTheDocument()
  })

  it('should show system operational message when local database is connected', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('✅')).toBeInTheDocument()
    expect(screen.getByText(/sistema local totalmente operativo/i)).toBeInTheDocument()
  })

  it('should show database error message', () => {
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: false,
      error: 'Database connection failed'
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    expect(screen.getByText('🔧')).toBeInTheDocument()
    expect(screen.getByText('Error de base de datos:')).toBeInTheDocument()
    expect(screen.getByText('Database connection failed')).toBeInTheDocument()
  })

  it('should call refreshStatus when refresh button is clicked', async () => {
    const user = userEvent.setup()
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    const refreshButton = screen.getByRole('button', { name: /actualizar/i })
    await user.click(refreshButton)
    
    expect(mockRefreshStatus).toHaveBeenCalled()
  })

  it('should disable refresh button when loading', () => {
    mockConnectionStatus.mockReturnValue({
      loading: true,
      online: true,
      local: true,
      error: null
    })
    
    renderWithProviders(<ConnectionStatus />)
    
    const refreshButton = screen.getByRole('button', { name: /actualizar/i })
    expect(refreshButton).toBeDisabled()
  })

  it('should show correct icons for different states', () => {
    const { rerender } = renderWithProviders(<ConnectionStatus />)
    
    // Online state
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: true,
      local: true,
      error: null
    })
    rerender(<ConnectionStatus />)
    expect(screen.getByText('🟢')).toBeInTheDocument()
    
    // Offline state
    mockConnectionStatus.mockReturnValue({
      loading: false,
      online: false,
      local: true,
      error: null
    })
    rerender(<ConnectionStatus />)
    expect(screen.getByText('🔴')).toBeInTheDocument()
    
    // Loading state
    mockConnectionStatus.mockReturnValue({
      loading: true,
      online: false,
      local: false,
      error: null
    })
    rerender(<ConnectionStatus />)
    expect(screen.getAllByText('🔄')).toHaveLength(2)
  })
})