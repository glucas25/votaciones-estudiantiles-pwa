import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProtectedRoute from '../../../../src/components/auth/ProtectedRoute'

// Mock the useAuth hook
const mockUser = vi.fn()
const mockIsLoading = vi.fn()
const mockIsAuthenticated = vi.fn()
const mockError = vi.fn()

vi.mock('../../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser(),
    isLoading: mockIsLoading(),
  }),
  useAuthContext: () => ({
    isAuthenticated: mockIsAuthenticated(),
    isLoading: mockIsLoading(),
    error: mockError(),
  })
}))

// Mock TutorLogin component
vi.mock('../../../../src/components/auth/TutorLogin', () => ({
  default: () => <div data-testid="tutor-login">Tutor Login Form</div>
}))

// Test component to render inside protected route
const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

const renderWithProviders = (component) => {
  return render(component)
}

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading.mockReturnValue(false)
    mockIsAuthenticated.mockReturnValue(true)
    mockError.mockReturnValue(null)
  })

  it('should render children when user is authenticated', () => {
    mockIsAuthenticated.mockReturnValue(true)
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should render loading spinner when loading', () => {
    mockIsLoading.mockReturnValue(true)
    mockIsAuthenticated.mockReturnValue(false)
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/verificando acceso/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should show TutorLogin when user is not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false)
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('tutor-login')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should show access required message when showLogin is false', () => {
    mockIsAuthenticated.mockReturnValue(false)
    
    renderWithProviders(
      <ProtectedRoute showLogin={false}>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/acceso requerido/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should show error message when there is an error', () => {
    mockError.mockReturnValue('Database connection failed')
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByText(/error: database connection failed/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should allow access for admin role when requiredRole is admin', () => {
    mockIsAuthenticated.mockReturnValue(true)
    
    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should deny access for tutor when requiredRole is admin', () => {
    mockIsAuthenticated.mockReturnValue(false)
    
    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('tutor-login')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should allow access for tutor role when requiredRole is tutor', () => {
    mockIsAuthenticated.mockReturnValue(true)
    
    renderWithProviders(
      <ProtectedRoute requiredRole="tutor">
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should handle multiple allowed roles', () => {
    mockIsAuthenticated.mockReturnValue(true)
    
    renderWithProviders(
      <ProtectedRoute requiredRole={['admin', 'tutor']}>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should deny access when user role is not in allowed roles array', () => {
    mockIsAuthenticated.mockReturnValue(false)
    
    renderWithProviders(
      <ProtectedRoute requiredRole={['admin', 'tutor']}>
        <TestComponent />
      </ProtectedRoute>
    )
    
    expect(screen.getByTestId('tutor-login')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should pass through additional props to children', () => {
    mockIsAuthenticated.mockReturnValue(true)
    
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