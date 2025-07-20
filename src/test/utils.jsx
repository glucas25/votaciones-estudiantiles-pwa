import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import { StudentsProvider } from '../contexts/StudentsContext.jsx'
import { CandidatesProvider } from '../contexts/CandidatesContext.jsx'
import { ElectionConfigProvider } from '../contexts/ElectionConfigContext.jsx'

/**
 * Render component with all necessary providers
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authState = { user: null, isLoading: false },
    studentsState = { students: [], loading: false },
    candidatesState = { candidates: {}, loading: false },
    configState = { config: {}, loading: false },
    ...renderOptions
  } = options

  function Wrapper({ children }) {
    return (
      <AuthProvider initialState={authState}>
        <StudentsProvider initialState={studentsState}>
          <CandidatesProvider initialState={candidatesState}>
            <ElectionConfigProvider initialState={configState}>
              {children}
            </ElectionConfigProvider>
          </CandidatesProvider>
        </StudentsProvider>
      </AuthProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Create mock student data
 */
export function createMockStudent(overrides = {}) {
  return {
    id: 'student-1',
    nombres: 'Juan',
    apellidos: 'Pérez',
    cedula: '1234567890',
    level: 'BACHILLERATO',
    course: '1ro Bach A',
    status: 'ACTIVE',
    ...overrides
  }
}

/**
 * Create mock candidate data
 */
export function createMockCandidate(overrides = {}) {
  return {
    id: 'candidate-1',
    nombres: 'María',
    apellidos: 'González',
    cedula: '0987654321',
    level: 'BACHILLERATO',
    course: '1ro Bach A',
    position: 'PRESIDENTE',
    votes: 0,
    ...overrides
  }
}

/**
 * Create mock user session
 */
export function createMockSession(overrides = {}) {
  return {
    user: {
      id: 'user-1',
      role: 'admin',
      loginTime: new Date().toISOString()
    },
    ...overrides
  }
}

/**
 * Wait for async operations to complete
 */
export function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Mock database service
 */
export const mockDatabaseService = {
  initializeDatabase: vi.fn().mockResolvedValue({ success: true }),
  isReady: vi.fn().mockReturnValue(true),
  createDocument: vi.fn().mockResolvedValue({ success: true, id: 'test-id' }),
  findDocuments: vi.fn().mockResolvedValue({ success: true, docs: [] }),
  updateDocument: vi.fn().mockResolvedValue({ success: true, id: 'test-id' }),
  deleteDocument: vi.fn().mockResolvedValue({ success: true }),
  bulkCreate: vi.fn().mockResolvedValue({ success: true, results: [] }),
  bulkUpdate: vi.fn().mockResolvedValue({ success: true }),
  exportBackupData: vi.fn().mockResolvedValue({ success: true, data: {} }),
  importBackupData: vi.fn().mockResolvedValue({ success: true })
}

/**
 * Mock auth service
 */
export const mockAuthService = {
  loginAdmin: vi.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
  loginTutor: vi.fn().mockResolvedValue({ success: true, user: { role: 'tutor' } }),
  getSession: vi.fn().mockResolvedValue(null),
  clearSession: vi.fn().mockResolvedValue({ success: true }),
  isSessionValid: vi.fn().mockReturnValue(false),
  validateActivationCode: vi.fn().mockReturnValue({ valid: false, data: null }),
  saveSession: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue({ success: true })
}