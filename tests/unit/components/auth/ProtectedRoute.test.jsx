import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test/utils'
import ProtectedRoute from '../../../../src/components/auth/ProtectedRoute'

// Mock the useAuth hook
const mockUser = vi.fn()
const mockIsLoading = vi.fn()

vi.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser(),
    isLoading: mockIsLoading(),
  })
}))

// Test component to render inside protected route
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading.mockReturnValue(false)
  })

  it('should render children when user is authenticated', () => {
    mockUser.mockReturnValue({ id: 'admin-1', role: 'admin' })
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should render loading spinner when loading', () => {
    mockIsLoading.mockReturnValue(true)
    mockUser.mockReturnValue(null)
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/verificando acceso/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    mockUser.mockReturnValue(null)
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument()
    expect(screen.getByText(/debe iniciar sesión/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should allow access for admin role when requiredRole is admin', () => {
    mockUser.mockReturnValue({ id: 'admin-1', role: 'admin' })
    
    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should deny access for tutor when requiredRole is admin', () => {
    mockUser.mockReturnValue({ id: 'tutor-1', role: 'tutor' })
    
    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument()
    expect(screen.getByText(/no tiene permisos/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should allow access for tutor role when requiredRole is tutor', () => {
    mockUser.mockReturnValue({ id: 'tutor-1', role: 'tutor', course: '1ro Bach A' })
    
    renderWithProviders(
      <ProtectedRoute requiredRole="tutor">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should show appropriate messages for unauthorized access', () => {
    mockUser.mockReturnValue({ id: 'student-1', role: 'student' })
    
    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText('🚫')).toBeInTheDocument()
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument()
    expect(screen.getByText(/no tiene permisos/i)).toBeInTheDocument()
  })

  it('should handle multiple allowed roles', () => {
    mockUser.mockReturnValue({ id: 'tutor-1', role: 'tutor' })
    
    renderWithProviders(
      <ProtectedRoute requiredRole={['admin', 'tutor']}>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should deny access when user role is not in allowed roles array', () => {
    mockUser.mockReturnValue({ id: 'student-1', role: 'student' })
    
    renderWithProviders(
      <ProtectedRoute requiredRole={['admin', 'tutor']}>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should pass through additional props to children', () => {
    mockUser.mockReturnValue({ id: 'admin-1', role: 'admin' })
    
    const TestComponentWithProps = ({ testProp }) => (
      <div data-testid="protected-content">{testProp}</div>
    )
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponentWithProps testProp="test value" />
      </ProtectedRoute>
    )
    
    expect(screen.getByText('test value')).toBeInTheDocument()
  })
})