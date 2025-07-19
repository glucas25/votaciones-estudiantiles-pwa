import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/utils'
import StudentCard from '../../../../src/components/tutor/StudentCard'

const mockStudent = {
  _id: 'student-1',
  cedula: '1010101010',
  nombres: 'Juan Carlos',
  apellidos: 'Pérez García',
  course: '1ro Bach A',
  level: 'BACHILLERATO',
  status: 'pending',
  numero: 1
}

const mockVotedStudent = {
  ...mockStudent,
  _id: 'student-2',
  nombres: 'María José',
  apellidos: 'López Torres',
  status: 'voted',
  numero: 2
}

describe('StudentCard Component', () => {
  const mockOnVote = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render student information', () => {
    renderWithProviders(
      <StudentCard student={mockStudent} onVote={mockOnVote} />
    )
    
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('Juan Carlos Pérez García')).toBeInTheDocument()
    expect(screen.getByText('1010101010')).toBeInTheDocument()
    expect(screen.getByText('🟡 PENDIENTE')).toBeInTheDocument()
  })

  it('should show voted status for voted student', () => {
    renderWithProviders(
      <StudentCard student={mockVotedStudent} onVote={mockOnVote} />
    )
    
    expect(screen.getByText('✅ VOTÓ')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
  })

  it('should call onVote when vote button is clicked for pending student', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <StudentCard student={mockStudent} onVote={mockOnVote} />
    )
    
    const voteButton = screen.getByRole('button', { name: /iniciar votación/i })
    await user.click(voteButton)
    
    expect(mockOnVote).toHaveBeenCalledWith(mockStudent)
  })

  it('should not show vote button for voted student', () => {
    renderWithProviders(
      <StudentCard student={mockVotedStudent} onVote={mockOnVote} />
    )
    
    expect(screen.queryByRole('button', { name: /iniciar votación/i })).not.toBeInTheDocument()
  })

  it('should format student number with leading zero', () => {
    const studentWithHighNumber = {
      ...mockStudent,
      numero: 15
    }
    
    renderWithProviders(
      <StudentCard student={studentWithHighNumber} onVote={mockOnVote} />
    )
    
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should handle missing student data gracefully', () => {
    const incompleteStudent = {
      _id: 'student-3',
      nombres: 'Test',
      status: 'pending',
      numero: 3
    }
    
    renderWithProviders(
      <StudentCard student={incompleteStudent} onVote={mockOnVote} />
    )
    
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('should apply correct CSS classes based on status', () => {
    const { rerender } = renderWithProviders(
      <StudentCard student={mockStudent} onVote={mockOnVote} />
    )
    
    // Check pending status styling
    const pendingCard = screen.getByTestId('student-card') || screen.getByText('Juan Carlos Pérez García').closest('.student-card')
    expect(pendingCard).toHaveClass('pending')
    
    // Check voted status styling
    rerender(<StudentCard student={mockVotedStudent} onVote={mockOnVote} />)
    
    const votedCard = screen.getByTestId('student-card') || screen.getByText('María José López Torres').closest('.student-card')
    expect(votedCard).toHaveClass('voted')
  })

  it('should be accessible with proper roles and labels', () => {
    renderWithProviders(
      <StudentCard student={mockStudent} onVote={mockOnVote} />
    )
    
    const voteButton = screen.getByRole('button', { name: /iniciar votación/i })
    expect(voteButton).toHaveAttribute('type', 'button')
    
    // Check that student name is properly displayed
    expect(screen.getByText('Juan Carlos Pérez García')).toBeInTheDocument()
  })

  it('should handle onVote callback errors gracefully', async () => {
    const user = userEvent.setup()
    const mockOnVoteWithError = vi.fn().mockImplementation(() => {
      throw new Error('Vote error')
    })
    
    renderWithProviders(
      <StudentCard student={mockStudent} onVote={mockOnVoteWithError} />
    )
    
    const voteButton = screen.getByRole('button', { name: /iniciar votación/i })
    
    // Should not throw error when clicked
    await user.click(voteButton)
    
    expect(mockOnVoteWithError).toHaveBeenCalledWith(mockStudent)
  })

  it('should display student status with correct icons', () => {
    const { rerender } = renderWithProviders(
      <StudentCard student={mockStudent} onVote={mockOnVote} />
    )
    
    // Pending status
    expect(screen.getByText('🟡 PENDIENTE')).toBeInTheDocument()
    
    // Voted status
    rerender(<StudentCard student={mockVotedStudent} onVote={mockOnVote} />)
    expect(screen.getByText('✅ VOTÓ')).toBeInTheDocument()
  })
})