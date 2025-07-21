// src/contexts/CandidatesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import databaseService, { DOC_TYPES, EDUCATION_LEVELS } from '../services/database-indexeddb.js';

const CandidatesContext = createContext();

// Datos de votos (se guardará en localStorage como respaldo)
const VOTES_STORAGE_KEY = 'voting_results_2024';

export const CandidatesProvider = ({ children }) => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState({});
  const [votes, setVotes] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);

  // Check if database is ready
  useEffect(() => {
    const checkDbReady = () => {
      try {
        if (databaseService.isReady()) {
          setIsDbReady(true);
          console.log('Database is ready');
        } else {
          // Retry after a short delay
          setTimeout(checkDbReady, 100);
        }
      } catch (error) {
        console.error('Database check failed:', error);
        setError('Database connection failed');
        setIsDbReady(false);
      }
    };
    
    // Set a timeout to handle database initialization issues
    const forceTimeout = setTimeout(() => {
      if (!isDbReady) {
        console.warn('Database taking too long to initialize');
        setError('Database initialization timeout');
        setIsDbReady(false);
      }
    }, 5000);
    
    checkDbReady();
    
    return () => clearTimeout(forceTimeout);
  }, []);

  // Load candidates and votes when user and database are ready
  useEffect(() => {
    console.log('CandidatesContext useEffect:', { user, isDbReady });
    if (user && user.level && isDbReady) {
      console.log('Loading candidates and votes for level:', user.level);
      loadCandidatesForLevel(user.level);
      loadVotes();
    } else if (user && !user.level) {
      console.warn('User level not defined:', user);
      setError('User education level not specified');
    } else if (user && !isDbReady) {
      console.log('Waiting for database to be ready...');
    }
  }, [user, isDbReady]);

  /**
   * Load candidates from database for a specific education level
   */
  const loadCandidatesForLevel = async (level) => {
    console.log('Loading candidates for level:', level);
    setLoading(true);
    setError(null);

    try {
      const candidatesFromDB = await loadCandidatesFromDB(level);
      
      if (candidatesFromDB && Object.keys(candidatesFromDB).length > 0) {
        setCandidates(candidatesFromDB);
        console.log('Successfully loaded candidates from database:', candidatesFromDB);
      } else {
        // No candidates found - set empty state
        setCandidates({});
        console.log('No candidates found in database for level:', level);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
      setError(`Failed to load candidates: ${err.message}`);
      setCandidates({});
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load candidates from database
   */
  const loadCandidatesFromDB = async (level) => {
    try {
      const result = await databaseService.findDocuments('candidates', {
        selector: {
          type: DOC_TYPES.CANDIDATE,
          level: level
        },
        sort: ['cargo', 'nombre']
      });

      if (result.docs && result.docs.length > 0) {
        // Group candidates by cargo (position)
        const candidatesByPosition = {};
        result.docs.forEach(candidate => {
          if (!candidatesByPosition[candidate.cargo]) {
            candidatesByPosition[candidate.cargo] = [];
          }
          candidatesByPosition[candidate.cargo].push(candidate);
        });
        
        return candidatesByPosition;
      }
      
      return {};
    } catch (err) {
      console.error('Failed to load candidates from database:', err);
      throw new Error(`Database query failed: ${err.message}`);
    }
  };

  /**
   * Load votes from database and localStorage (fallback)
   */
  const loadVotes = async () => {
    try {
      // Try to load from database first
      const result = await databaseService.findDocuments('votes', {
        selector: {
          type: DOC_TYPES.VOTE,
          level: user?.level,
          course: user?.course
        }
      });

      if (result.docs && result.docs.length > 0) {
        // Convert database votes to the expected format
        const votesByStudent = {};
        result.docs.forEach(vote => {
          if (!votesByStudent[vote.studentId]) {
            votesByStudent[vote.studentId] = {};
          }
          
          // Find candidate info to get cargo
          const candidateId = vote.candidateId;
          let cargo = vote.cargo || 'UNKNOWN';
          
          // Try to determine cargo from candidate data if not stored
          if (cargo === 'UNKNOWN') {
            Object.entries(candidates).forEach(([cargoName, candidatesList]) => {
              const found = candidatesList.find(c => 
                (c._id && c._id === candidateId) || 
                (c.id && c.id === candidateId)
              );
              if (found) {
                cargo = cargoName;
              }
            });
          }

          votesByStudent[vote.studentId][cargo] = {
            id: vote._id,
            studentId: vote.studentId,
            candidateId: vote.candidateId,
            cargo: cargo,
            timestamp: vote.timestamp,
            course: vote.course,
            level: vote.level
          };
        });
        
        setVotes(votesByStudent);
        console.log('Successfully loaded votes from database');
      } else {
        // Fallback to localStorage if no votes in database
        loadVotesFromLocalStorage();
      }
    } catch (err) {
      console.error('Failed to load votes from database:', err);
      // Fallback to localStorage
      loadVotesFromLocalStorage();
    }
  };

  /**
   * Load votes from localStorage (fallback method)
   */
  const loadVotesFromLocalStorage = () => {
    try {
      const savedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
      if (savedVotes) {
        setVotes(JSON.parse(savedVotes));
        console.log('Loaded votes from localStorage');
      } else {
        setVotes({});
      }
    } catch (err) {
      console.error('Failed to load votes from localStorage:', err);
      setVotes({});
    }
  };

  /**
   * Save votes to both database and localStorage
   */
  const saveVotes = async (newVotes) => {
    // Always save to localStorage as backup
    try {
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(newVotes));
    } catch (err) {
      console.error('Failed to save votes to localStorage:', err);
    }
    
    // Try to save to database if available
    if (isDbReady) {
      try {
        // Convert votes to database format and save
        const votesToSave = [];
        
        Object.entries(newVotes).forEach(([studentId, studentVotes]) => {
          Object.entries(studentVotes).forEach(([cargo, voteData]) => {
            votesToSave.push({
              studentId: studentId,
              candidateId: voteData.candidateId,
              cargo: cargo,
              level: voteData.level,
              course: voteData.course,
              timestamp: voteData.timestamp
            });
          });
        });

        // Save votes to database (replace existing)
        for (const vote of votesToSave) {
          await databaseService.createDocument('votes', vote, DOC_TYPES.VOTE);
        }
        
        console.log('Successfully saved votes to database');
      } catch (err) {
        console.error('Failed to save votes to database:', err);
        // Continue with localStorage only
      }
    }
  };

  /**
   * Cast a vote for a student
   */
  const castVote = async (studentId, candidateId, cargo) => {
    if (!user || !user.course || !user.level) {
      throw new Error('User information incomplete');
    }

    const voteRecord = {
      id: `vote_${Date.now()}_${studentId}`,
      studentId,
      candidateId,
      cargo,
      timestamp: new Date().toISOString(),
      course: user.course,
      level: user.level,
      tutorSession: user.sessionId
    };

    const newVotes = {
      ...votes,
      [studentId]: {
        ...votes[studentId],
        [cargo]: voteRecord
      }
    };

    setVotes(newVotes);
    await saveVotes(newVotes);
    
    return voteRecord;
  };

  /**
   * Check if a student has voted
   */
  const hasVoted = (studentId, cargo = null) => {
    if (!votes[studentId]) return false;
    
    if (cargo) {
      return !!votes[studentId][cargo];
    }
    
    // Check if has voted for any position
    return Object.keys(votes[studentId] || {}).length > 0;
  };

  /**
   * Get vote for a specific student and position
   */
  const getVoteForStudent = (studentId, cargo) => {
    return votes[studentId]?.[cargo] || null;
  };

  /**
   * Select a candidate (for UI state)
   */
  const selectCandidate = (cargo, candidateId) => {
    setSelectedVotes(prev => ({
      ...prev,
      [cargo]: candidateId
    }));
  };

  /**
   * Clear all selections (for UI state)
   */
  const clearSelections = () => {
    setSelectedVotes({});
  };

  /**
   * Get selected candidate for a position (UI state)
   */
  const getSelectedCandidate = (cargo) => {
    return selectedVotes[cargo] || null;
  };

  /**
   * Find candidate by ID
   */
  const getCandidateById = (candidateId) => {
    for (const cargo in candidates) {
      const candidatesList = candidates[cargo];
      const found = candidatesList.find(c => 
        c.id === candidateId || 
        c._id === candidateId
      );
      if (found) return found;
    }
    return null;
  };

  /**
   * Get voting results with statistics
   */
  const getVotingResults = () => {
    const results = {};
    
    // Initialize counters
    for (const cargo in candidates) {
      results[cargo] = {};
      candidates[cargo].forEach(candidate => {
        const candidateId = candidate.id || candidate._id;
        results[cargo][candidateId] = {
          candidate,
          votes: 0,
          percentage: 0
        };
      });
    }

    // Count votes
    for (const studentId in votes) {
      for (const cargo in votes[studentId]) {
        const vote = votes[studentId][cargo];
        if (results[cargo] && results[cargo][vote.candidateId]) {
          results[cargo][vote.candidateId].votes++;
        }
      }
    }

    // Calculate percentages
    for (const cargo in results) {
      const totalVotes = Object.values(results[cargo]).reduce((sum, candidate) => sum + candidate.votes, 0);
      
      if (totalVotes > 0) {
        for (const candidateId in results[cargo]) {
          const votes = results[cargo][candidateId].votes;
          results[cargo][candidateId].percentage = Math.round((votes / totalVotes) * 100);
        }
      }
    }

    return results;
  };

  /**
   * Get available positions (cargos)
   */
  const getAvailableCargos = () => {
    return Object.keys(candidates);
  };

  /**
   * Reset all votes
   */
  const resetAllVotes = async () => {
    setVotes({});
    
    try {
      localStorage.removeItem(VOTES_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear votes from localStorage:', err);
    }
    
    // Also clear votes from database if available
    if (isDbReady) {
      try {
        const result = await databaseService.findDocuments('votes', {
          selector: {
            type: DOC_TYPES.VOTE,
            level: user?.level,
            course: user?.course
          }
        });

        if (result.docs && result.docs.length > 0) {
          for (const vote of result.docs) {
            await databaseService.deleteDocument('votes', vote._id, vote._rev);
          }
        }
        
        console.log('Successfully cleared all votes from database');
      } catch (err) {
        console.error('Failed to clear votes from database:', err);
      }
    }
  };

  /**
   * Refresh candidates data from database
   */
  const refreshCandidates = async () => {
    if (user && user.level && isDbReady) {
      await loadCandidatesForLevel(user.level);
    }
  };

  /**
   * Get total number of candidates
   */
  const getTotalCandidates = () => {
    return Object.values(candidates).reduce((total, candidatesList) => total + candidatesList.length, 0);
  };

  /**
   * Get total number of votes cast
   */
  const getTotalVotes = () => {
    return Object.values(votes).reduce((total, studentVotes) => total + Object.keys(studentVotes).length, 0);
  };

  /**
   * Check if there are any candidates loaded
   */
  const hasCandidates = () => {
    return Object.keys(candidates).length > 0;
  };

  const value = {
    // State
    candidates,
    votes,
    selectedVotes,
    loading,
    error,
    isDbReady,
    
    // Voting operations
    castVote,
    hasVoted,
    getVoteForStudent,
    resetAllVotes,
    
    // UI state operations
    selectCandidate,
    clearSelections,
    getSelectedCandidate,
    
    // Data retrieval
    getCandidateById,
    getVotingResults,
    getAvailableCargos,
    
    // Database operations
    loadCandidatesForLevel,
    loadCandidatesFromDB,
    refreshCandidates,
    
    // Statistics
    getTotalCandidates,
    getTotalVotes,
    hasCandidates
  };

  return (
    <CandidatesContext.Provider value={value}>
      {children}
    </CandidatesContext.Provider>
  );
};

export const useCandidates = () => {
  const context = useContext(CandidatesContext);
  if (!context) {
    throw new Error('useCandidates debe ser usado dentro de CandidatesProvider');
  }
  return context;
};