// src/hooks/useDatabase.js
import { useState, useEffect, useCallback } from 'react'
import databaseService, { DOC_TYPES } from '../services/database-indexeddb.js'

/**
 * Main database hook for React components
 * Provides high-level database operations with React integration
 */
export function useDatabase() {
  const [isReady, setIsReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({
    local: false,
    online: false,
    databases: {},
    performance: {}
  })
  // Initialize database
  useEffect(() => {
    initializeDatabase()
  }, [])

  /**
   * Initialize database
   */
  const initializeDatabase = useCallback(async () => {
    try {
      // Wait for database service to be ready
      if (!databaseService.isReady()) {
        await new Promise(resolve => {
          const checkReady = () => {
            if (databaseService.isReady()) {
              resolve()
            } else {
              setTimeout(checkReady, 100)
            }
          }
          checkReady()
        })
      }

      // Update connection status
      const status = await databaseService.getConnectionStatus()
      setConnectionStatus(status)
      setIsReady(true)

    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }, [])

  /**
   * Migration function (no-op for IndexedDB)
   */
  const performMigration = useCallback(async () => {
    console.log('Migration not needed in simplified version')
    return { success: true }
  }, [])

  /**
   * Refresh connection status
   */
  const refreshStatus = useCallback(async () => {
    try {
      const status = await databaseService.getConnectionStatus()
      setConnectionStatus(status)
    } catch (error) {
      console.error('Failed to refresh status:', error)
    }
  }, [])

  /**
   * Get database statistics
   */
  const getStats = useCallback(async () => {
    try {
      return await databaseService.getDatabaseStats()
    } catch (error) {
      console.error('Failed to get database stats:', error)
      return null
    }
  }, [])

  /**
   * Export all data for backup
   */
  const exportData = useCallback(async () => {
    try {
      return await databaseService.exportAllData()
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }, [])

  /**
   * Import data from backup
   */
  const importData = useCallback(async (backupData) => {
    try {
      const result = await databaseService.importBackupData(backupData)
      
      // Refresh status after import
      await refreshStatus()
      
      return result
    } catch (error) {
      console.error('Failed to import data:', error)
      throw error
    }
  }, [refreshStatus])

  /**
   * Clear all cache
   */
  const clearCache = useCallback(() => {
    databaseService.clearAllCache()
  }, [])

  return {
    // Status
    isReady,
    connectionStatus,
    migrationStatus: { needed: false, inProgress: false, completed: true, error: null },
    
    // Actions
    refreshStatus,
    performMigration,
    getStats,
    exportData,
    importData,
    clearCache,
    
    // Database service reference
    databaseService
  }
}

/**
 * Hook for students database operations
 */
export function useStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load all students
   */
  const loadStudents = useCallback(async (filters = {}) => {
    console.log('📚 useStudents: loadStudents called with filters:', filters);
    setLoading(true)
    setError(null)
    
    try {
      const query = {
        selector: {
          type: DOC_TYPES.STUDENT,
          ...filters
        },
        sort: ['level', 'course', 'numero']
      }

      console.log('🔍 useStudents: Executing query:', query);
      const result = await databaseService.findDocuments('students', query);
      console.log('📊 useStudents: Query result:', {
        docsCount: result.docs?.length || 0,
        success: result.success,
        error: result.error
      });
      setStudents(result.docs || [])
      
    } catch (err) {
      console.error('❌ useStudents: Error loading students:', err);
      setError(err.message)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Search students
   */
  const searchStudents = useCallback(async (searchTerm) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await databaseService.searchDocuments('students', searchTerm, ['nombre', 'apellidos', 'cedula'])
      setStudents(result.docs || [])
      
    } catch (err) {
      setError(err.message)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Add student
   */
  const addStudent = useCallback(async (studentData) => {
    try {
      const result = await databaseService.createDocument('students', studentData, DOC_TYPES.STUDENT)
      
      if (result.success) {
        // Reload students to update list
        await loadStudents()
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [loadStudents])

  /**
   * Update student
   */
  const updateStudent = useCallback(async (studentData) => {
    try {
      const result = await databaseService.updateDocument('students', studentData)
      
      if (result.success) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student._id === studentData._id ? { ...student, ...studentData } : student
        ))
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [])

  /**
   * Delete student
   */
  const deleteStudent = useCallback(async (studentId, rev) => {
    try {
      const result = await databaseService.deleteDocument('students', studentId, rev)
      
      if (result.success) {
        // Remove from local state
        setStudents(prev => prev.filter(student => student._id !== studentId))
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [])

  /**
   * Bulk import students
   */
  const importStudents = useCallback(async (studentsData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await databaseService.bulkCreate('students', studentsData, DOC_TYPES.STUDENT)
      
      if (result.success) {
        // Reload students
        await loadStudents()
      }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadStudents])

  /**
   * Get students by level
   */
  const getStudentsByLevel = useCallback(async (level) => {
    return loadStudents({ level })
  }, [loadStudents])

  /**
   * Get students by course
   */
  const getStudentsByCourse = useCallback(async (level, course) => {
    return loadStudents({ level, course })
  }, [loadStudents])

  // Load students on mount
  useEffect(() => {
    console.log('🎆 useStudents hook: Loading students on mount');
    loadStudents();
  }, [loadStudents])

  return {
    students,
    loading,
    error,
    loadStudents,
    searchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    getStudentsByLevel,
    getStudentsByCourse
  }
}

/**
 * Hook for candidates database operations
 */
export function useCandidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load all candidates
   */
  const loadCandidates = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const query = {
        selector: {
          type: DOC_TYPES.CANDIDATE,
          ...filters
        },
        sort: ['level', 'cargo', 'nombre']
      }

      const result = await databaseService.findDocuments('candidates', query)
      setCandidates(result.docs || [])
      
    } catch (err) {
      setError(err.message)
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Add candidate
   */
  const addCandidate = useCallback(async (candidateData) => {
    try {
      const result = await databaseService.createDocument('candidates', candidateData, DOC_TYPES.CANDIDATE)
      
      if (result.success) {
        await loadCandidates()
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [loadCandidates])

  /**
   * Update candidate
   */
  const updateCandidate = useCallback(async (candidateData) => {
    try {
      const result = await databaseService.updateDocument('candidates', candidateData)
      
      if (result.success) {
        setCandidates(prev => prev.map(candidate => 
          candidate._id === candidateData._id ? { ...candidate, ...candidateData } : candidate
        ))
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [])

  /**
   * Delete candidate
   */
  const deleteCandidate = useCallback(async (candidateId, rev) => {
    try {
      const result = await databaseService.deleteDocument('candidates', candidateId, rev)
      
      if (result.success) {
        setCandidates(prev => prev.filter(candidate => candidate._id !== candidateId))
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [])

  /**
   * Get candidates by level
   */
  const getCandidatesByLevel = useCallback(async (level) => {
    return loadCandidates({ level })
  }, [loadCandidates])

  // Load candidates on mount
  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  return {
    candidates,
    loading,
    error,
    loadCandidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidatesByLevel
  }
}

/**
 * Hook for votes database operations
 */
export function useVotes() {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load votes with filters
   */
  const loadVotes = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const query = {
        selector: {
          type: DOC_TYPES.VOTE,
          ...filters
        },
        sort: [{ timestamp: 'desc' }]
      }

      const result = await databaseService.findDocuments('votes', query)
      setVotes(result.docs || [])
      
    } catch (err) {
      setError(err.message)
      setVotes([])
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Register vote
   */
  const registerVote = useCallback(async (voteData) => {
    try {
      const voteWithTimestamp = {
        ...voteData,
        timestamp: new Date().toISOString()
      }

      const result = await databaseService.createDocument('votes', voteWithTimestamp, DOC_TYPES.VOTE)
      
      if (result.success) {
        await loadVotes()
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [loadVotes])

  /**
   * Get vote statistics
   */
  const getVoteStats = useCallback(async () => {
    try {
      const allVotes = await databaseService.findDocuments('votes', {
        selector: { type: DOC_TYPES.VOTE }
      })

      const stats = {
        total: allVotes.docs.length,
        byLevel: {},
        byCourse: {},
        byCandidate: {}
      }

      allVotes.docs.forEach(vote => {
        // By level
        stats.byLevel[vote.level] = (stats.byLevel[vote.level] || 0) + 1
        
        // By course
        const courseKey = `${vote.level}-${vote.course}`
        stats.byCourse[courseKey] = (stats.byCourse[courseKey] || 0) + 1
        
        // By candidate
        stats.byCandidate[vote.candidateId] = (stats.byCandidate[vote.candidateId] || 0) + 1
      })

      return stats
    } catch (error) {
      setError(error.message)
      throw error
    }
  }, [])

  return {
    votes,
    loading,
    error,
    loadVotes,
    registerVote,
    getVoteStats
  }
}