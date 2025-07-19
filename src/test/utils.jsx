import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import { StudentsProvider } from '../contexts/StudentsContext'
import { CandidatesProvider } from '../contexts/CandidatesContext'

// Custom render function with providers
export function renderWithProviders(ui, {
  preloadedState = {},
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <AuthProvider>
        <StudentsProvider>
          <CandidatesProvider>
            {children}
          </CandidatesProvider>
        </StudentsProvider>
      </AuthProvider>
    )
  }
  
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// Mock user data
export const mockUsers = {
  admin: {
    id: 'admin-1',
    role: 'admin',
    loginTime: new Date().toISOString()
  },
  tutor: {
    id: 'tutor-1',
    role: 'tutor',
    course: '1ro Bach A',
    level: 'BACHILLERATO',
    levelName: 'Bachillerato',
    tutorName: 'Prof. García',
    loginTime: new Date().toISOString()
  }
}

// Mock students data
export const mockStudents = [
  {
    _id: 'student-1',
    cedula: '1010101010',
    nombres: 'Juan',
    apellidos: 'Pérez García',
    course: '1ro Bach A',
    level: 'BACHILLERATO',
    status: 'pending',
    numero: 1
  },
  {
    _id: 'student-2',
    cedula: '2020202020',
    nombres: 'María',
    apellidos: 'López Torres',
    course: '1ro Bach A',
    level: 'BACHILLERATO',
    status: 'voted',
    numero: 2
  }
]

// Mock candidates data
export const mockCandidates = {
  BACHILLERATO: {
    PRESIDENTE: [
      {
        id: 'presidente-1',
        nombre: 'Ana Sofía Pérez',
        cargo: 'PRESIDENTE',
        lista: 'Lista Azul',
        color: '#2563eb',
        propuestas: ['Mejorar laboratorios', 'Más becas']
      }
    ],
    VICEPRESIDENTE: [
      {
        id: 'vice-1',
        nombre: 'Carlos Ruiz',
        cargo: 'VICEPRESIDENTE',
        lista: 'Lista Azul',
        color: '#2563eb',
        propuestas: ['Mejor transporte', 'Más actividades']
      }
    ]
  }
}

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export * from '@testing-library/react'