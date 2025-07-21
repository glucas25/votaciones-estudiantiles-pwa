// src/contexts/CandidatesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import databaseService, { DOC_TYPES, EDUCATION_LEVELS } from '../services/database-indexeddb.js';

const CandidatesContext = createContext();

// Datos de votos (se guardará en localStorage como respaldo)
const VOTES_STORAGE_KEY = 'voting_results_2024';

export const CandidatesProvider = ({ children }) => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]); // Changed to array for electoral lists
  const [votes, setVotes] = useState({});
  const [selectedVotes, setSelectedVotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);

  // Check if database is ready
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 50 * 200ms = 10 seconds maximum
    
    const checkDbReady = async () => {
      try {
        // Wait for database to initialize
        await databaseService.ensureReady();
        
        if (databaseService.isReady()) {
          setIsDbReady(true);
          setError(null);
          console.log('✅ CandidatesContext: Database is ready for voting');
          return;
        }
        
        // Retry if not ready yet
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkDbReady, 200);
        } else {
          console.error('Database failed to initialize after maximum retries');
          setError('No se pudo conectar con la base de datos. Por favor, recargue la página.');
          setIsDbReady(false);
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkDbReady, 200);
        } else {
          setError('Error de base de datos. Por favor, recargue la página.');
          setIsDbReady(false);
        }
      }
    };
    
    checkDbReady();
  }, []);

  // Load electoral lists and votes when user and database are ready
  useEffect(() => {
    console.log('🔄 CandidatesContext useEffect triggered:', { user: !!user, userRole: user?.role, isDbReady });
    if (user && isDbReady) {
      console.log('✅ Both user and database ready - loading electoral lists for user:', user);
      loadElectoralLists();
      loadVotes();
    } else if (user && !isDbReady) {
      console.log('⏳ User ready but database not ready...');
    } else if (!user && isDbReady) {
      console.log('⏳ Database ready but user not ready...');
      // Let's also try loading lists without user dependency for debugging
      console.log('🧪 DEBUG: Loading lists without user dependency...');
      loadElectoralLists();
    } else {
      console.log('⏳ Neither user nor database ready...');
    }
  }, [user, isDbReady]);

  /**
   * Load electoral lists from database
   */
  const loadElectoralLists = async () => {
    console.log('🚀 Loading electoral lists from database...');
    setLoading(true);
    setError(null);

    try {
      const listsFromDB = await loadListsFromDB();
      
      console.log('📊 Lists loaded from DB:', listsFromDB);
      
      if (listsFromDB && listsFromDB.length > 0) {
        setCandidates(listsFromDB);
        console.log('✅ Successfully loaded electoral lists from database:', listsFromDB.length, 'lists');
      } else {
        // No lists found - set empty state
        setCandidates([]);
        console.log('⚠️ No electoral lists found in database');
        setError('No hay listas electorales registradas. Contacte al administrador.');
      }
    } catch (err) {
      console.error('❌ Failed to load electoral lists:', err);
      setError(`Failed to load electoral lists: ${err.message}`);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load electoral lists from database
   */
  const loadListsFromDB = async () => {
    try {
      console.log('🔍 Searching for electoral lists in database...');
      
      // First, let's see ALL candidates documents for debugging
      const allCandidates = await databaseService.findDocuments('candidates', {});
      console.log('🗂️ ALL candidates documents in database:', allCandidates);
      
      
      const result = await databaseService.findDocuments('candidates', {
        selector: {
          type: 'list'  // Look for list-type documents
        },
        sort: ['createdAt']
      });

      console.log('🗃️ Database query result for type=list:', result);

      if (result.docs && result.docs.length > 0) {
        console.log('✅ Found electoral lists in database:', result.docs.length, result.docs);
        return result.docs;
      }
      
      // Try to find lists with old type 'candidate' that have listName
      console.log('🔄 Checking for legacy lists with type=candidate...');
      const legacyResult = await databaseService.findDocuments('candidates', {
        selector: {
          type: 'candidate',
          listName: { $exists: true }  // Lists should have listName field
        },
        sort: ['createdAt']
      });

      console.log('🗃️ Database query result for legacy lists:', legacyResult);

      if (legacyResult.docs && legacyResult.docs.length > 0) {
        console.log('✅ Found legacy electoral lists in database:', legacyResult.docs.length, legacyResult.docs);
        return legacyResult.docs;
      }
      
      console.log('⚠️ No electoral lists found in database (checked both type=list and legacy)');
      
      // Final attempt: return all documents that might be lists
      console.log('🔄 Final attempt: trying to find lists by other criteria...');
      if (allCandidates.docs && allCandidates.docs.length > 0) {
        const potentialLists = allCandidates.docs.filter(doc => 
          doc.listName || doc.presidentName || doc.vicePresidentName
        );
        if (potentialLists.length > 0) {
          console.log('🎯 Found potential lists by field detection:', potentialLists);
          return potentialLists;
        }
      }
      
      return [];
    } catch (err) {
      console.error('❌ Failed to load electoral lists from database:', err);
      throw new Error(`Database query failed: ${err.message}`);
    }
  };

  /**
   * Load votes from database and localStorage (fallback) - List-based
   */
  const loadVotes = async () => {
    try {
      // Try to load from database first
      const result = await databaseService.findDocuments('votes', {
        selector: {
          type: DOC_TYPES.VOTE
        }
      });

      if (result.docs && result.docs.length > 0) {
        // Convert database votes to the expected format for lists
        const votesByStudent = {};
        result.docs.forEach(vote => {
          votesByStudent[vote.studentId] = {
            id: vote._id,
            studentId: vote.studentId,
            listId: vote.listId || vote.candidateId, // Support legacy candidateId field
            timestamp: vote.timestamp,
            course: vote.course,
            level: vote.level,
            tutorSession: vote.tutorSession
          };
        });
        
        setVotes(votesByStudent);
        console.log('Successfully loaded list-based votes from database');
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
   * Save votes to both database and localStorage - List-based
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
        
        Object.entries(newVotes).forEach(([studentId, voteData]) => {
          if (voteData) {
            votesToSave.push({
              studentId: studentId,
              listId: voteData.listId,
              level: voteData.level,
              course: voteData.course,
              timestamp: voteData.timestamp,
              tutorSession: voteData.tutorSession
            });
          }
        });

        // Save votes to database (replace existing)
        for (const vote of votesToSave) {
          await databaseService.createDocument('votes', vote, DOC_TYPES.VOTE);
        }
        
        console.log('Successfully saved list-based votes to database');
      } catch (err) {
        console.error('Failed to save votes to database:', err);
        // Continue with localStorage only
      }
    }
  };

  /**
   * Cast a vote for a student (list-based)
   */
  const castVote = async (studentId, listId) => {
    if (!user) {
      throw new Error('User information incomplete');
    }

    const voteRecord = {
      id: `vote_${Date.now()}_${studentId}`,
      studentId,
      listId,
      timestamp: new Date().toISOString(),
      course: user.course,
      level: user.level,
      tutorSession: user.sessionId
    };

    const newVotes = {
      ...votes,
      [studentId]: voteRecord  // One vote per student for a list
    };

    setVotes(newVotes);
    await saveVotes(newVotes);
    
    return voteRecord;
  };

  /**
   * Check if a student has voted
   */
  const hasVoted = (studentId) => {
    return !!votes[studentId];
  };

  /**
   * Get vote for a specific student
   */
  const getVoteForStudent = (studentId) => {
    return votes[studentId] || null;
  };

  /**
   * Select a list (for UI state)
   */
  const selectCandidate = (type, listId) => {
    setSelectedVotes({ [type]: listId });
  };

  /**
   * Clear all selections (for UI state)
   */
  const clearSelections = () => {
    setSelectedVotes({});
  };

  /**
   * Get selected list (UI state)
   */
  const getSelectedCandidate = (type) => {
    return selectedVotes[type] || null;
  };

  /**
   * Find list by ID
   */
  const getListById = (listId) => {
    return candidates.find(list => 
      (list._id && list._id === listId) || 
      (list.id && list.id === listId)
    ) || null;
  };

  /**
   * Get voting results with statistics - List-based
   */
  const getVotingResults = () => {
    const results = {};
    
    // Initialize counters for each electoral list
    candidates.forEach(list => {
      const listId = list._id || list.id;
      results[listId] = {
        list,
        votes: 0,
        percentage: 0
      };
    });

    // Count votes
    const totalVotes = Object.keys(votes).length;
    for (const studentId in votes) {
      const vote = votes[studentId];
      if (vote && results[vote.listId]) {
        results[vote.listId].votes++;
      }
    }

    // Calculate percentages
    if (totalVotes > 0) {
      for (const listId in results) {
        const listVotes = results[listId].votes;
        results[listId].percentage = Math.round((listVotes / totalVotes) * 100);
      }
    }

    return results;
  };

  /**
   * Get available electoral lists
   */
  const getAvailableLists = () => {
    return candidates || [];
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
            type: DOC_TYPES.VOTE
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
   * Refresh electoral lists data from database
   */
  const refreshCandidates = async () => {
    if (user && isDbReady) {
      await loadElectoralLists();
    }
  };

  /**
   * Get total number of electoral lists
   */
  const getTotalLists = () => {
    return candidates.length;
  };

  /**
   * Get total number of votes cast
   */
  const getTotalVotes = () => {
    return Object.keys(votes).length;
  };

  /**
   * Check if there are any electoral lists loaded
   */
  const hasLists = () => {
    return candidates.length > 0;
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
    getListById,
    getVotingResults,
    getAvailableLists,
    
    // Database operations
    loadElectoralLists,
    loadListsFromDB,
    refreshCandidates,
    
    // Statistics
    getTotalLists,
    getTotalVotes,
    hasLists
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