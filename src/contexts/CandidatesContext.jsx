// src/contexts/CandidatesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import databaseService, { DOC_TYPES, EDUCATION_LEVELS } from '../services/database-indexeddb.js';

const CandidatesContext = createContext();

// Datos mock de candidatos por nivel educativo
const MOCK_CANDIDATES = {
  BACHILLERATO: {
    PRESIDENTE: [
      {
        id: 'presidente_bach_001',
        nombre: 'Ana Sofía Pérez González',
        cargo: 'PRESIDENTE',
        lista: 'Lista Azul - Renovación',
        color: '#2563eb',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI1NjNlYiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QU5BPC90ZXh0Pjwvc3ZnPg==',
        propuestas: [
          'Mejorar la infraestructura de laboratorios de ciencias',
          'Implementar programa de becas de excelencia académica',
          'Crear espacios de estudio 24/7 para bachillerato',
          'Fortalecer el programa de orientación vocacional'
        ],
        experiencia: '3 años como representante estudiantil',
        slogan: 'Juntos hacia la excelencia académica'
      },
      {
        id: 'presidente_bach_002',
        nombre: 'Carlos Eduardo Martínez Silva',
        cargo: 'PRESIDENTE',
        lista: 'Lista Roja - Progreso',
        color: '#dc2626',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RjMjYyNiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0FSTE9TPC90ZXh0Pjwvc3ZnPg==',
        propuestas: [
          'Modernizar el sistema de comunicación estudiantil',
          'Impulsar programa de emprendimiento juvenil',
          'Crear centro de innovación tecnológica',
          'Establecer intercambios con otras instituciones'
        ],
        experiencia: 'Líder del club de robótica',
        slogan: 'Innovación y tecnología para el futuro'
      },
      {
        id: 'presidente_bach_003',
        nombre: 'María Fernanda Torres López',
        cargo: 'PRESIDENTE',
        lista: 'Lista Verde - Sustentabilidad',
        color: '#16a34a',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzE2YTM0YSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TUFSSUEgRjwvdGV4dD48L3N2Zz4=',
        propuestas: [
          'Implementar programa de reciclaje institucional',
          'Crear huertos estudiantiles urbanos',
          'Promover transporte sustentable a la institución',
          'Desarrollar conciencia ambiental en la comunidad'
        ],
        experiencia: 'Coordinadora del club ecológico',
        slogan: 'Un futuro verde para nuestra institución'
      }
    ],
    VICEPRESIDENTE: [
      {
        id: 'vice_bach_001',
        nombre: 'Luis Alberto Morales Vega',
        cargo: 'VICEPRESIDENTE',
        lista: 'Lista Azul - Renovación',
        color: '#2563eb',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI1NjNlYiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TFVJUzwvdGV4dD48L3N2Zz4=',
        propuestas: [
          'Fortalecer programas deportivos y culturales',
          'Mejorar comunicación entre estudiantes y autoridades',
          'Crear sistema de tutoría entre estudiantes',
          'Organizar eventos académicos y sociales'
        ],
        experiencia: 'Capitán del equipo de debate',
        slogan: 'Apoyo constante al liderazgo estudiantil'
      },
      {
        id: 'vice_bach_002',
        nombre: 'Patricia Alejandra Ruiz Castro',
        cargo: 'VICEPRESIDENTE',
        lista: 'Lista Roja - Progreso',
        color: '#dc2626',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RjMjYyNiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UEFUUklDSUE8L3RleHQ+PC9zdmc+',
        propuestas: [
          'Digitalizar procesos estudiantiles',
          'Crear plataforma de participación ciudadana',
          'Implementar sistema de sugerencias online',
          'Modernizar biblioteca y recursos digitales'
        ],
        experiencia: 'Desarrolladora de aplicaciones móviles',
        slogan: 'Tecnología al servicio de los estudiantes'
      },
      {
        id: 'vice_bach_003',
        nombre: 'Roberto Andrés Silva Herrera',
        cargo: 'VICEPRESIDENTE',
        lista: 'Lista Verde - Sustentabilidad',
        color: '#16a34a',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzE2YTM0YSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Uk9CRVJUT1A8L3RleHQ+PC9zdmc+',
        propuestas: [
          'Promover energías renovables en la institución',
          'Crear brigadas de limpieza estudiantil',
          'Implementar jardines verticales',
          'Educar sobre el cambio climático'
        ],
        experiencia: 'Voluntario en organizaciones ambientales',
        slogan: 'Cuidando nuestro planeta, cuidamos nuestro futuro'
      }
    ]
  },
  BASICA_SUPERIOR: {
    PRESIDENTE: [
      {
        id: 'presidente_sup_001',
        nombre: 'Sofía Isabel Ramírez Delgado',
        cargo: 'PRESIDENTE',
        lista: 'Lista Amarilla - Diversión',
        color: '#eab308',
        foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VhYjMwOCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U09GSUE8L3RleHQ+PC9zdmc+',
        propuestas: [
          'Más recreos y actividades lúdicas',
          'Mejorar la cafetería con comida saludable',
          'Crear festivales de talentos estudiantiles',
          'Organizar campeonatos deportivos interaulas'
        ],
        experiencia: 'Representante de clase por 2 años',
        slogan: 'Aprender jugando, crecer sonriendo'
      }
    ]
  }
};

// Datos de votos (se guardará en localStorage)
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
          // Retry after a short delay, but don't wait forever
          setTimeout(checkDbReady, 100);
        }
      } catch (error) {
        console.error('Database check failed, proceeding without DB:', error);
        setIsDbReady(false);
      }
    };
    
    // Set a timeout to force loading without DB if it takes too long
    const forceTimeout = setTimeout(() => {
      if (!isDbReady) {
        console.log('Database taking too long, proceeding without it');
        setIsDbReady(false);
      }
    }, 2000);
    
    checkDbReady();
    
    return () => clearTimeout(forceTimeout);
  }, []);

  useEffect(() => {
    console.log('CandidatesContext useEffect:', { user, isDbReady });
    if (user && user.level) {
      console.log('Initializing candidates for level:', user.level);
      if (isDbReady) {
        console.log('Using database');
        initializeCandidatesData(user.level);
        loadVotes();
      } else {
        console.log('Database not ready, using mock data directly');
        loadCandidatesForLevel(user.level);
      }
    } else if (user && !user.level) {
      console.log('User level not defined:', user);
    }
  }, [user, isDbReady]);

  /**
   * Initialize candidates data - try PouchDB first, fallback to mock data
   */
  const initializeCandidatesData = async (level) => {
    console.log('initializeCandidatesData called with level:', level);
    setLoading(true);
    setError(null);

    try {
      // First try to load from PouchDB
      const candidatesFromDB = await loadCandidatesFromDB(level);
      console.log('Candidates from DB:', candidatesFromDB);
      
      if (candidatesFromDB && Object.keys(candidatesFromDB).length > 0) {
        setCandidates(candidatesFromDB);
        console.log('Set candidates from DB:', candidatesFromDB);
      } else {
        // If no candidates in DB, initialize with mock data
        console.log('No candidates in DB, initializing with mock data');
        await initializeMockCandidates(level);
      }
    } catch (err) {
      console.error('Failed to initialize candidates:', err);
      setError(err.message);
      // Fallback to mock data
      console.log('Falling back to mock data due to error');
      loadCandidatesForLevel(level);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load candidates from PouchDB
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
        // Group candidates by cargo
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
      console.error('Failed to load candidates from DB:', err);
      return {};
    }
  };

  /**
   * Initialize mock candidates in PouchDB if database is empty
   */
  const initializeMockCandidates = async (level) => {
    const mockCandidates = MOCK_CANDIDATES[level] || {};
    
    if (Object.keys(mockCandidates).length === 0) {
      setCandidates({});
      return;
    }

    try {
      console.log(`Initializing mock candidates for ${level}`);
      
      // Convert mock data to PouchDB format
      const candidatesForDB = [];
      
      Object.entries(mockCandidates).forEach(([cargo, candidatesList]) => {
        candidatesList.forEach(candidate => {
          candidatesForDB.push({
            nombre: candidate.nombre,
            apellidos: '', // Mock data doesn't have apellidos
            cargo: cargo,
            level: level,
            ticketId: candidate.lista,
            foto: candidate.foto,
            propuestas: Array.isArray(candidate.propuestas) ? candidate.propuestas.join(', ') : candidate.propuestas,
            experiencia: candidate.experiencia,
            slogan: candidate.slogan,
            color: candidate.color,
            votos: 0,
            // Migration metadata
            migratedFrom: 'mockData',
            originalId: candidate.id
          });
        });
      });

      if (candidatesForDB.length > 0) {
        const result = await databaseService.bulkCreate('candidates', candidatesForDB, DOC_TYPES.CANDIDATE);
        
        if (result.success) {
          // Reload candidates from DB
          const reloadedCandidates = await loadCandidatesFromDB(level);
          setCandidates(reloadedCandidates);
        } else {
          // Fallback to mock data
          setCandidates(mockCandidates);
        }
      }
    } catch (err) {
      console.error('Failed to initialize mock candidates:', err);
      // Fallback to mock data
      setCandidates(mockCandidates);
    }
  };

  /**
   * Fallback to original localStorage method
   */
  const loadCandidatesForLevel = (level) => {
    console.log('loadCandidatesForLevel called with level:', level);
    const levelCandidates = MOCK_CANDIDATES[level] || {};
    console.log('Mock candidates for level:', level, levelCandidates);
    setCandidates(levelCandidates);
  };

  /**
   * Load votes from PouchDB and localStorage
   */
  const loadVotes = async () => {
    try {
      // Try to load from PouchDB first
      const result = await databaseService.findDocuments('votes', {
        selector: {
          type: DOC_TYPES.VOTE,
          level: user?.level,
          course: user?.course
        }
      });

      if (result.docs && result.docs.length > 0) {
        // Convert PouchDB votes to the expected format
        const votesByStudent = {};
        result.docs.forEach(vote => {
          if (!votesByStudent[vote.studentId]) {
            votesByStudent[vote.studentId] = {};
          }
          
          // Find candidate info to get cargo
          const candidateId = vote.candidateId;
          let cargo = 'UNKNOWN';
          
          // Try to determine cargo from candidate data
          Object.entries(candidates).forEach(([cargoName, candidatesList]) => {
            const found = candidatesList.find(c => 
              (c._id && c._id === candidateId) || 
              (c.id && c.id === candidateId) ||
              (c.originalId && c.originalId === candidateId)
            );
            if (found) {
              cargo = cargoName;
            }
          });

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
      } else {
        // Fallback to localStorage
        loadVotesFromLocalStorage();
      }
    } catch (err) {
      console.error('Failed to load votes from PouchDB:', err);
      // Fallback to localStorage
      loadVotesFromLocalStorage();
    }
  };

  /**
   * Load votes from localStorage (fallback)
   */
  const loadVotesFromLocalStorage = () => {
    const savedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    }
  };

  /**
   * Save votes to both PouchDB and localStorage
   */
  const saveVotes = async (newVotes) => {
    // Always save to localStorage as backup
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(newVotes));
    
    // Try to save to PouchDB if available
    if (isDbReady) {
      try {
        // Convert votes to PouchDB format and save
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

        // Save votes to PouchDB (replace existing)
        for (const vote of votesToSave) {
          await databaseService.createDocument('votes', vote, DOC_TYPES.VOTE);
        }
      } catch (err) {
        console.error('Failed to save votes to PouchDB:', err);
        // Continue with localStorage only
      }
    }
  };

  const castVote = async (studentId, candidateId, cargo) => {
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

  const hasVoted = (studentId, cargo = null) => {
    if (!votes[studentId]) return false;
    
    if (cargo) {
      return !!votes[studentId][cargo];
    }
    
    // Verificar si ha votado por algún cargo
    return Object.keys(votes[studentId] || {}).length > 0;
  };

  const getVoteForStudent = (studentId, cargo) => {
    return votes[studentId]?.[cargo] || null;
  };

  const selectCandidate = (cargo, candidateId) => {
    setSelectedVotes(prev => ({
      ...prev,
      [cargo]: candidateId
    }));
  };

  const clearSelections = () => {
    setSelectedVotes({});
  };

  const getSelectedCandidate = (cargo) => {
    return selectedVotes[cargo] || null;
  };

  const getCandidateById = (candidateId) => {
    for (const cargo in candidates) {
      const candidatesList = candidates[cargo];
      const found = candidatesList.find(c => 
        c.id === candidateId || 
        c._id === candidateId || 
        c.originalId === candidateId
      );
      if (found) return found;
    }
    return null;
  };

  const getVotingResults = () => {
    const results = {};
    
    // Inicializar contadores
    for (const cargo in candidates) {
      results[cargo] = {};
      candidates[cargo].forEach(candidate => {
        results[cargo][candidate.id] = {
          candidate,
          votes: 0,
          percentage: 0
        };
      });
    }

    // Contar votos
    for (const studentId in votes) {
      for (const cargo in votes[studentId]) {
        const vote = votes[studentId][cargo];
        if (results[cargo] && results[cargo][vote.candidateId]) {
          results[cargo][vote.candidateId].votes++;
        }
      }
    }

    // Calcular porcentajes
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

  const getAvailableCargos = () => {
    return Object.keys(candidates);
  };

  const resetAllVotes = async () => {
    setVotes({});
    localStorage.removeItem(VOTES_STORAGE_KEY);
    
    // Also clear votes from PouchDB if available
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
      } catch (err) {
        console.error('Failed to clear votes from PouchDB:', err);
      }
    }
  };

  const value = {
    candidates,
    votes,
    selectedVotes,
    loading,
    error,
    isDbReady,
    castVote,
    hasVoted,
    getVoteForStudent,
    selectCandidate,
    clearSelections,
    getSelectedCandidate,
    getCandidateById,
    getVotingResults,
    getAvailableCargos,
    resetAllVotes,
    // Database operations
    initializeCandidatesData,
    loadCandidatesFromDB,
    initializeMockCandidates
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