// src/contexts/CandidatesContext.jsx
// Performance optimized with React.memo and useCallback for 1000+ students
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import databaseService, { DOC_TYPES, EDUCATION_LEVELS } from '../services/database-indexeddb.js';
import performanceMonitor from '../utils/performanceMonitor';
import smartCache from '../utils/smartCache';

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
   * Load electoral lists from database (Performance Optimized)
   */
  const loadElectoralLists = useCallback(async () => {
    const timer = performanceMonitor?.measureElectoralListsLoad();
    console.log('🚀 Loading electoral lists from database...');
    
    // Try to get from cache first
    const cachedLists = smartCache.getElectoralLists();
    if (cachedLists && cachedLists.length > 0) {
      console.log('🎯 Using cached electoral lists:', cachedLists.length, 'lists');
      setCandidates(cachedLists);
      timer?.end({ cached: true, resultCount: cachedLists.length });
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const listsFromDB = await loadListsFromDB();
      
      console.log('📊 Lists loaded from DB:', listsFromDB);
      
      if (listsFromDB && listsFromDB.length > 0) {
        setCandidates(listsFromDB);
        
        // Cache the loaded lists
        smartCache.cacheElectoralLists(listsFromDB);
        
        console.log('✅ Successfully loaded electoral lists from database:', listsFromDB.length, 'lists');
        timer?.end({ cached: false, resultCount: listsFromDB.length });
      } else {
        // No lists found - set empty state
        setCandidates([]);
        console.log('⚠️ No electoral lists found in database');
        setError('No hay listas electorales registradas. Contacte al administrador.');
        timer?.end({ cached: false, resultCount: 0 });
      }
    } catch (err) {
      console.error('❌ Failed to load electoral lists:', err);
      setError(`Failed to load electoral lists: ${err.message}`);
      setCandidates([]);
      timer?.end({ cached: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

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
   * Load votes from database (DATABASE-FIRST STRATEGY) - List-based
   */
  const loadVotes = async () => {
    console.log('🗳️ Loading votes (DATABASE-FIRST)');
    
    try {
      // PRIMARY: Load from database first
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
        console.log(`✅ DATABASE-FIRST: Loaded ${result.docs.length} votes from database`);
        console.log('🗳️ Vote records by student:', Object.keys(votesByStudent));
        
        // Sync localStorage with database data (database is source of truth)
        try {
          localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesByStudent));
          console.log('🔄 Synced localStorage with database votes');
        } catch (err) {
          console.error('Failed to sync localStorage with database:', err);
        }

        // Sync student voting status from vote records (RE-ENABLED)
        await syncStudentVotingStatus(votesByStudent);
        
      } else {
        console.log('🗃️ No votes found in database, checking localStorage');
        setVotes({});
        // Only use localStorage if database is completely empty
        loadVotesFromLocalStorage();
      }
    } catch (err) {
      console.error('❌ Failed to load votes from database:', err);
      // Fallback to localStorage only if database fails
      loadVotesFromLocalStorage();
    }
  };

  /**
   * Sync student voting status based on vote records
   */
  const syncStudentVotingStatus = async (votesByStudent) => {
    console.log(`🔄 CandidatesContext: Starting syncStudentVotingStatus with ${Object.keys(votesByStudent || {}).length} votes`);
    console.log(`🔍 CandidatesContext: Votes to sync:`, votesByStudent);
    
    if (!votesByStudent || Object.keys(votesByStudent).length === 0) {
      console.log('📝 No votes to sync with student status');
      return;
    }

    try {
      const studentsToUpdate = [];
      
      for (const [studentId, voteData] of Object.entries(votesByStudent)) {
        console.log(`🔍 CandidatesContext: Processing vote for student ${studentId}`);
        console.log(`🔍 CandidatesContext: Vote data:`, voteData);
        
        // Find student record
        const studentResult = await databaseService.findDocuments('students', {
          selector: {
            type: 'student',
            $or: [
              { _id: studentId },
              { id: studentId }, 
              { cedula: studentId }
            ]
          },
          limit: 1
        });

        console.log(`🔍 CandidatesContext: Student query result for ${studentId}:`, studentResult);

        if (studentResult.docs && studentResult.docs.length > 0) {
          const student = studentResult.docs[0];
          console.log(`🔍 CandidatesContext: Found student:`, { 
            _id: student._id, 
            nombres: student.nombres, 
            votado: student.votado,
            status: student.status 
          });
          
          // Update student if not already marked as voted
          if (!student.votado) {
            const updatedStudent = {
              ...student,
              votado: true,
              votedAt: voteData.timestamp
            };
            
            studentsToUpdate.push({
              id: student._id,
              rev: student._rev,
              data: updatedStudent
            });
            
            console.log(`🔄 Syncing student ${studentId} as voted based on vote record`);
          } else {
            console.log(`📝 Student ${studentId} already marked as voted`);
          }
        } else {
          console.warn(`⚠️ CandidatesContext: No student found for studentId ${studentId}`);
          
          // BACKUP SYNC: Try to find student by cedula if the studentId contains it
          console.log(`🔄 CandidatesContext: Attempting backup sync for ${studentId}`);
          
          // Extract potential cedula from complex student IDs (e.g., "student_12345_timestamp_suffix" -> "12345")
          const cedulaMatch = studentId.match(/student_(\d+)/);
          if (cedulaMatch) {
            const potentialCedula = cedulaMatch[1];
            console.log(`🔍 CandidatesContext: Trying backup search with cedula: ${potentialCedula}`);
            
            const backupResult = await databaseService.findDocuments('students', {
              selector: {
                type: 'student',
                cedula: potentialCedula
              },
              limit: 1
            });
            
            if (backupResult.docs && backupResult.docs.length > 0) {
              const student = backupResult.docs[0];
              console.log(`✅ CandidatesContext: Found student via backup search:`, { 
                _id: student._id, 
                nombres: student.nombres, 
                cedula: student.cedula,
                votado: student.votado 
              });
              
              if (!student.votado) {
                const updatedStudent = {
                  ...student,
                  votado: true,
                  votedAt: voteData.timestamp
                };
                
                studentsToUpdate.push({
                  id: student._id,
                  rev: student._rev,
                  data: updatedStudent
                });
                
                console.log(`🔄 Backup sync: Adding student ${potentialCedula} to update list`);
              }
            } else {
              console.warn(`⚠️ CandidatesContext: Backup search also failed for cedula ${potentialCedula}`);
            }
          }
        }
      }

      // Bulk update students
      for (const update of studentsToUpdate) {
        try {
          await databaseService.updateDocument('students', update.id, update.rev, update.data);
        } catch (err) {
          console.error(`Failed to sync student ${update.id}:`, err);
        }
      }

      if (studentsToUpdate.length > 0) {
        console.log(`✅ Synced ${studentsToUpdate.length} student voting statuses from vote records`);
      }
      
    } catch (error) {
      console.error('❌ Error syncing student voting status:', error);
    }
  };

  /**
   * Load votes from localStorage (FALLBACK ONLY)
   */
  const loadVotesFromLocalStorage = () => {
    try {
      const savedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
      if (savedVotes) {
        const localVotes = JSON.parse(savedVotes);
        setVotes(localVotes);
        console.log(`💾 FALLBACK: Loaded ${Object.keys(localVotes).length} votes from localStorage`);
        console.log('⚠️ WARNING: Using localStorage data - may not reflect database changes');
      } else {
        setVotes({});
        console.log('💾 No votes found in localStorage either - starting with empty state');
      }
    } catch (err) {
      console.error('❌ Failed to load votes from localStorage:', err);
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
              _id: `vote_doc_${studentId}`, // Use consistent ID based on student
              studentId: studentId,
              listId: voteData.listId,
              level: voteData.level,
              course: voteData.course,
              timestamp: voteData.timestamp,
              tutorSession: voteData.tutorSession
            });
          }
        });

        // Use bulk create to ensure consistency
        if (votesToSave.length > 0) {
          const result = await databaseService.bulkCreate('votes', votesToSave, DOC_TYPES.VOTE);
          console.log(`✅ Bulk saved ${result.successful} votes to database`);
        }
        
      } catch (err) {
        console.error('Failed to save votes to database:', err);
        // Continue with localStorage only
      }
    }
  };

  /**
   * Cast a vote for a student (list-based) - Performance Optimized
   */
  const castVote = useCallback(async (studentId, listId) => {
    const timer = performanceMonitor?.measureVoteProcess();
    
    if (!user) {
      timer?.end({ error: 'User information incomplete' });
      throw new Error('User information incomplete');
    }

    // Check if student already voted (DATABASE-FIRST)
    const alreadyVoted = await hasVoted(studentId);
    if (alreadyVoted) {
      console.warn(`⚠️ Student ${studentId} has already voted - preventing duplicate vote`);
      timer?.end({ result: 'duplicate_vote_prevented' });
      return votes[studentId];
    }

    const voteRecord = {
      id: `vote_doc_${studentId}`, // Consistent ID
      studentId,
      listId,
      timestamp: new Date().toISOString(),
      course: user.course,
      level: user.level,
      tutorSession: user.sessionId
    };

    // Save individual vote to database immediately
    if (isDbReady) {
      try {
        await databaseService.createDocument('votes', {
          _id: voteRecord.id,
          studentId: voteRecord.studentId,
          listId: voteRecord.listId,
          level: voteRecord.level,
          course: voteRecord.course,
          timestamp: voteRecord.timestamp,
          tutorSession: voteRecord.tutorSession
        }, DOC_TYPES.VOTE);
        console.log(`✅ Vote saved to database for student: ${studentId}`);
      } catch (err) {
        console.error('Failed to save individual vote to database:', err);
        timer?.end({ error: 'Database save failed' });
        throw new Error('Failed to save vote to database');
      }
    }

    const newVotes = {
      ...votes,
      [studentId]: voteRecord  // One vote per student for a list
    };

    setVotes(newVotes);
    
    // Also update localStorage
    try {
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(newVotes));
    } catch (err) {
      console.error('Failed to save votes to localStorage:', err);
    }
    
    timer?.end({ result: 'vote_cast_successfully', studentId, listId });
    return voteRecord;
  }, [user, votes, isDbReady, hasVoted]);

  /**
   * Check if a student has voted (SIMPLIFIED - MEMORY-FIRST)
   */
  const hasVoted = async (studentId) => {
    console.log(`🔍 DEBUG hasVoted: Checking student ${studentId}`);
    console.log(`🔍 DEBUG hasVoted: In-memory votes:`, Object.keys(votes));
    
    // Check in-memory first (fast)
    const hasVotedInMemory = !!votes[studentId];
    console.log(`📋 Student ${studentId} voted status (memory): ${hasVotedInMemory}`);
    
    // If found in memory, return immediately
    if (hasVotedInMemory) {
      return true;
    }
    
    // If not in memory, check database as source of truth
    if (!isDbReady) {
      console.log(`⚠️ Database not ready, relying on memory for ${studentId}`);
      return false;
    }

    try {
      console.log(`🔍 DEBUG hasVoted: Querying database for student ${studentId}...`);
      
      // Check if vote exists in database
      const voteResult = await databaseService.findDocuments('votes', {
        selector: {
          type: DOC_TYPES.VOTE,
          studentId: studentId
        },
        limit: 1
      });

      console.log(`🔍 DEBUG hasVoted: Database query result:`, voteResult);

      const hasVoteInDB = voteResult.docs && voteResult.docs.length > 0;
      
      if (hasVoteInDB) {
        console.log(`✅ Student ${studentId} has voted (found in database)`);
        
        // Update in-memory state to match database
        const voteData = voteResult.docs[0];
        const newVotes = {
          ...votes,
          [studentId]: {
            id: voteData._id,
            studentId: voteData.studentId,
            listId: voteData.listId,
            timestamp: voteData.timestamp,
            course: voteData.course,
            level: voteData.level,
            tutorSession: voteData.tutorSession
          }
        };
        setVotes(newVotes);
        
        return true;
      }

      console.log(`⚠️ Student ${studentId} has NOT voted (confirmed in database)`);
      return false;
      
    } catch (error) {
      console.error(`❌ Error checking vote status for ${studentId}:`, error);
      // Fallback to memory check if database fails
      return !!votes[studentId];
    }
  };

  /**
   * Synchronous check if a student has voted (memory only - for UI)
   */
  const hasVotedSync = (studentId) => {
    return !!votes[studentId];
  };

  /**
   * Get vote for a specific student - Performance Optimized
   */
  const getVoteForStudent = useCallback((studentId) => {
    return votes[studentId] || null;
  }, [votes]);

  /**
   * Select a list (for UI state) - Performance Optimized
   */
  const selectCandidate = useCallback((type, listId) => {
    setSelectedVotes({ [type]: listId });
  }, []);

  /**
   * Clear all selections (for UI state) - Performance Optimized
   */
  const clearSelections = useCallback(() => {
    setSelectedVotes({});
  }, []);

  /**
   * Get selected list (UI state) - Performance Optimized
   */
  const getSelectedCandidate = useCallback((type) => {
    return selectedVotes[type] || null;
  }, [selectedVotes]);

  /**
   * Find list by ID - Performance Optimized
   */
  const getListById = useCallback((listId) => {
    return candidates.find(list => 
      (list._id && list._id === listId) || 
      (list.id && list.id === listId)
    ) || null;
  }, [candidates]);

  /**
   * Get voting results with statistics - List-based (Performance Optimized)
   */
  const getVotingResults = useMemo(() => {
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

    console.log('📊 Voting results computed:', { totalVotes, listsWithVotes: Object.keys(results).length });
    return results;
  }, [candidates, votes]);

  /**
   * Get available electoral lists - Performance Optimized
   */
  const getAvailableLists = useCallback(() => {
    return candidates || [];
  }, [candidates]);

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
   * Refresh electoral lists data from database (Performance Optimized)
   */
  const refreshCandidates = useCallback(async () => {
    if (user && isDbReady) {
      // Clear cache before refreshing to get fresh data
      smartCache.invalidatePattern('electoral-lists');
      await loadElectoralLists();
    }
  }, [user, isDbReady, loadElectoralLists]);

  /**
   * Get total number of electoral lists (Performance Optimized)
   */
  const getTotalLists = useMemo(() => {
    return candidates.length;
  }, [candidates]);

  /**
   * Get total number of votes cast (Performance Optimized)
   */
  const getTotalVotes = useMemo(() => {
    return Object.keys(votes).length;
  }, [votes]);

  /**
   * Check if there are any electoral lists loaded (Performance Optimized)
   */
  const hasLists = useMemo(() => {
    return candidates.length > 0;
  }, [candidates]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
    hasVotedSync,
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
    
    // Statistics (optimized with useMemo)
    getTotalLists,
    getTotalVotes,
    hasLists,
    
    // Debug utilities
    debugDatabaseState: async () => {
      console.log('🔍 DATABASE DEBUG STATE:');
      console.log('- DB Ready:', isDbReady);
      console.log('- In-memory votes:', Object.keys(votes).length, votes);
      
      if (isDbReady) {
        try {
          const allVotes = await databaseService.findDocuments('votes', {});
          console.log('- Database votes (all):', allVotes.docs?.length || 0, allVotes.docs);
          
          const votesByType = await databaseService.findDocuments('votes', {
            selector: { type: DOC_TYPES.VOTE }
          });
          console.log('- Database votes (by type):', votesByType.docs?.length || 0, votesByType.docs);
        } catch (error) {
          console.error('- Database query error:', error);
        }
      }
    }
  }), [
    candidates, votes, selectedVotes, loading, error, isDbReady,
    castVote, hasVoted, hasVotedSync, getVoteForStudent, resetAllVotes,
    selectCandidate, clearSelections, getSelectedCandidate,
    getListById, getVotingResults, getAvailableLists,
    loadElectoralLists, loadListsFromDB, refreshCandidates,
    getTotalLists, getTotalVotes, hasLists
  ]);

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