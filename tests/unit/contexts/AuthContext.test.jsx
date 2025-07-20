import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext.jsx'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('AuthProvider initialization', () => {
    it('should initialize with no user by default', () => {
      render(
        <AuthProvider>
          <div data-testid="user">no user</div>
        </AuthProvider>
      )
      
      expect(screen.getByTestId('user')).toHaveTextContent('no user')
    })

    it('should restore user from valid session', async () => {
      const mockSession = {
        role: 'tutor',
        activationCode: 'ELEC2024-BACH',
        course: '1ro Bach A',
        level: 'BACHILLERATO',
        levelName: 'Bachillerato',
        tutorName: 'Profesor García',
        loginTime: new Date().toISOString(),
        sessionId: 'test-session'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))

      const TestComponent = () => {
        const { user } = useAuth()
        return <div data-testid="user">{user?.role || 'no user'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('tutor')
      })
    })

    it('should clear invalid session on initialization', async () => {
      const mockSession = {
        role: 'admin',
        loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        sessionId: 'test-session'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))

      render(
        <AuthProvider>
          <div data-testid="user">no user</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('voting_session')
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('loginAsAdmin', () => {
    it('should login admin successfully', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const { loginAsAdmin, user: currentUser } = useAuth()
        return (
          <div>
            <div data-testid="user">{currentUser?.role || 'no user'}</div>
            <button data-testid="login-admin" onClick={() => loginAsAdmin('admin2024')}>
              Login Admin
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await user.click(screen.getByTestId('login-admin'))

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('voting_session', expect.any(String))
        expect(screen.getByTestId('user')).toHaveTextContent('admin')
      })
    })

    it('should handle admin login failure', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const { loginAsAdmin, user: currentUser } = useAuth()
        return (
          <div>
            <div data-testid="user">{currentUser?.role || 'no user'}</div>
            <button data-testid="login-admin" onClick={() => loginAsAdmin('wrong')}>
              Login Admin
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await user.click(screen.getByTestId('login-admin'))

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('login', () => {
    it('should login tutor successfully', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const { login, user: currentUser } = useAuth()
        return (
          <div>
            <div data-testid="user">{currentUser?.role || 'no user'}</div>
            <button data-testid="login-tutor" onClick={() => login('ELEC2024-BACH', '1ro Bach A', 'Profesor García')}>
              Login Tutor
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await user.click(screen.getByTestId('login-tutor'))

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('voting_session', expect.any(String))
        expect(screen.getByTestId('user')).toHaveTextContent('tutor')
      })
    })

    it('should handle tutor login failure', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const { login, user: currentUser } = useAuth()
        return (
          <div>
            <div data-testid="user">{currentUser?.role || 'no user'}</div>
            <button data-testid="login-tutor" onClick={() => login('INVALID', '1ro Bach A', 'Profesor García')}>
              Login Tutor
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await user.click(screen.getByTestId('login-tutor'))

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('logout', () => {
    it('should logout user and clear session', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const { loginAsAdmin, logout, user: currentUser } = useAuth()
        return (
          <div>
            <div data-testid="user">{currentUser?.role || 'no user'}</div>
            <button data-testid="login-admin" onClick={() => loginAsAdmin('admin2024')}>
              Login Admin
            </button>
            <button data-testid="logout" onClick={() => logout()}>
              Logout
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await user.click(screen.getByTestId('login-admin'))
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('admin')
      })

      await user.click(screen.getByTestId('logout'))
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('voting_session')
        expect(screen.getByTestId('user')).toHaveTextContent('no user')
      })
    })
  })

  describe('loading states', () => {
    it('should show loading during login process', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const { loginAsAdmin, isLoading } = useAuth()
        return (
          <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'not loading'}</div>
            <button data-testid="login-admin" onClick={() => loginAsAdmin('admin2024')}>
              Login Admin
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await user.click(screen.getByTestId('login-admin'))

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      })
    })
  })

  describe('hook usage outside provider', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      const TestComponent = () => {
        const { user } = useAuth()
        return <div>{user ? 'user' : 'no user'}</div>
      }

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth debe ser usado dentro de AuthProvider')
    })
  })
})