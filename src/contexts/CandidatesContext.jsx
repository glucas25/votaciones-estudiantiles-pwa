// src/contexts/CandidatesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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

  useEffect(() => {
    if (user && user.level) {
      loadCandidatesForLevel(user.level);
      loadVotes();
    }
  }, [user]);

  const loadCandidatesForLevel = (level) => {
    const levelCandidates = MOCK_CANDIDATES[level] || {};
    setCandidates(levelCandidates);
  };

  const loadVotes = () => {
    const savedVotes = localStorage.getItem(VOTES_STORAGE_KEY);
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    }
  };

  const saveVotes = (newVotes) => {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(newVotes));
  };

  const castVote = (studentId, candidateId, cargo) => {
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
    saveVotes(newVotes);
    
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
      const found = candidatesList.find(c => c.id === candidateId);
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

  const resetAllVotes = () => {
    setVotes({});
    localStorage.removeItem(VOTES_STORAGE_KEY);
  };

  const value = {
    candidates,
    votes,
    selectedVotes,
    castVote,
    hasVoted,
    getVoteForStudent,
    selectCandidate,
    clearSelections,
    getSelectedCandidate,
    getCandidateById,
    getVotingResults,
    getAvailableCargos,
    resetAllVotes
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