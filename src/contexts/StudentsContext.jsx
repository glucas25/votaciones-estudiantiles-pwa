// src/contexts/StudentsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const StudentsContext = createContext();

// Datos mock de estudiantes por curso
const MOCK_STUDENTS = {
  '1ro Bach A': [
    { id: 'bach1a_001', cedula: '0987654321', nombres: 'María José', apellidos: 'García López', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_002', cedula: '0987654322', nombres: 'Carlos Eduardo', apellidos: 'Martínez Sánchez', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_003', cedula: '0987654323', nombres: 'Ana Lucía', apellidos: 'Rodríguez Torres', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_004', cedula: '0987654324', nombres: 'José Antonio', apellidos: 'Silva Morales', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_005', cedula: '0987654325', nombres: 'Pedro Alejandro', apellidos: 'Alvarado Díaz', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_006', cedula: '0987654326', nombres: 'Isabella María', apellidos: 'Castro Herrera', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_007', cedula: '0987654327', nombres: 'Roberto Carlos', apellidos: 'Jiménez Vargas', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_008', cedula: '0987654328', nombres: 'Camila Andrea', apellidos: 'López Moreno', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_009', cedula: '0987654329', nombres: 'Miguel Ángel', apellidos: 'Herrera Vega', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_010', cedula: '0987654330', nombres: 'Valentina Sofia', apellidos: 'Torres Luna', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_011', cedula: '0987654331', nombres: 'Andrés Felipe', apellidos: 'Vargas Silva', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_012', cedula: '0987654332', nombres: 'Sofía Elena', apellidos: 'Mendoza Ruiz', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_013', cedula: '0987654333', nombres: 'Diego Fernando', apellidos: 'Paredes Castro', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_014', cedula: '0987654334', nombres: 'Fernanda Isabel', apellidos: 'Guerrero Vega', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_015', cedula: '0987654335', nombres: 'Sebastián David', apellidos: 'Morales Torres', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_016', cedula: '0987654336', nombres: 'Daniela Alejandra', apellidos: 'Rojas Martín', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_017', cedula: '0987654337', nombres: 'Alejandro José', apellidos: 'Sandoval Pérez', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_018', cedula: '0987654338', nombres: 'Gabriela María', apellidos: 'Delgado Flores', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_019', cedula: '0987654339', nombres: 'Kevin Andrés', apellidos: 'Molina Espinoza', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_020', cedula: '0987654340', nombres: 'Nicole Paola', apellidos: 'Salazar Romero', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_021', cedula: '0987654341', nombres: 'Mateo Santiago', apellidos: 'Aguilar Vera', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_022', cedula: '0987654342', nombres: 'Andrea Carolina', apellidos: 'Navarro Soto', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_023', cedula: '0987654343', nombres: 'Francisco Javier', apellidos: 'Ramírez Ortega', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_024', cedula: '0987654344', nombres: 'Melanie Victoria', apellidos: 'Cordero Bravo', curso: '1ro Bach A', nivel: 'BACHILLERATO' },
    { id: 'bach1a_025', cedula: '0987654345', nombres: 'Emilio Sebastián', apellidos: 'Pacheco Medina', curso: '1ro Bach A', nivel: 'BACHILLERATO' }
  ],
  '1ro Bach B': [
    { id: 'bach1b_001', cedula: '0987654346', nombres: 'Ariana Michelle', apellidos: 'Vásquez Reyes', curso: '1ro Bach B', nivel: 'BACHILLERATO' },
    { id: 'bach1b_002', cedula: '0987654347', nombres: 'Joaquín Gabriel', apellidos: 'Figueroa Morales', curso: '1ro Bach B', nivel: 'BACHILLERATO' },
    { id: 'bach1b_003', cedula: '0987654348', nombres: 'Samantha Nicole', apellidos: 'Cabrera León', curso: '1ro Bach B', nivel: 'BACHILLERATO' }
    // Más estudiantes...
  ],
  '8vo A': [
    { id: '8voa_001', cedula: '0987654400', nombres: 'Luis Fernando', apellidos: 'González Pérez', curso: '8vo A', nivel: 'BASICA_SUPERIOR' },
    { id: '8voa_002', cedula: '0987654401', nombres: 'María Fernanda', apellidos: 'Ramírez Castro', curso: '8vo A', nivel: 'BASICA_SUPERIOR' }
    // Más estudiantes...
  ]
  // Agregar más cursos según necesidades de prueba
};

export const StudentsProvider = ({ children }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentStates, setStudentStates] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, pending, voted, absent

  // Cargar estudiantes del curso cuando el usuario cambie
  useEffect(() => {
    if (user && user.course) {
      loadStudentsForCourse(user.course);
      loadStudentStates(user.course);
    }
  }, [user]);

  const loadStudentsForCourse = (course) => {
    const courseStudents = MOCK_STUDENTS[course] || [];
    setStudents(courseStudents);
  };

  const loadStudentStates = (course) => {
    const statesKey = `student_states_${course}`;
    const savedStates = localStorage.getItem(statesKey);
    
    if (savedStates) {
      setStudentStates(JSON.parse(savedStates));
    } else {
      // Inicializar estados por defecto
      const initialStates = {};
      const courseStudents = MOCK_STUDENTS[course] || [];
      
      courseStudents.forEach(student => {
        initialStates[student.id] = {
          status: 'pending', // pending, voted, absent
          votedAt: null,
          isAbsent: false
        };
      });
      
      setStudentStates(initialStates);
      localStorage.setItem(statesKey, JSON.stringify(initialStates));
    }
  };

  const saveStudentStates = (newStates) => {
    if (user && user.course) {
      const statesKey = `student_states_${user.course}`;
      localStorage.setItem(statesKey, JSON.stringify(newStates));
    }
  };

  const markStudentAsVoted = (studentId) => {
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'voted',
        votedAt: new Date().toISOString(),
        isAbsent: false
      }
    };
    
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const markStudentAsAbsent = (studentId) => {
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'absent',
        isAbsent: true,
        votedAt: null
      }
    };
    
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const markStudentAsPresent = (studentId) => {
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'pending',
        isAbsent: false,
        votedAt: null
      }
    };
    
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const getFilteredStudents = () => {
    let filtered = students;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.nombres.toLowerCase().includes(term) ||
        student.apellidos.toLowerCase().includes(term) ||
        `${student.nombres} ${student.apellidos}`.toLowerCase().includes(term)
      );
    }

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(student => {
        const state = studentStates[student.id];
        if (!state) return filterType === 'pending';
        return state.status === filterType;
      });
    }

    return filtered;
  };

  const getStudentsByStatus = () => {
    const pending = [];
    const voted = [];
    const absent = [];

    students.forEach(student => {
      const state = studentStates[student.id];
      if (!state || state.status === 'pending') {
        pending.push(student);
      } else if (state.status === 'voted') {
        voted.push(student);
      } else if (state.status === 'absent') {
        absent.push(student);
      }
    });

    return { pending, voted, absent };
  };

  const getStats = () => {
    const { pending, voted, absent } = getStudentsByStatus();
    
    return {
      total: students.length,
      voted: voted.length,
      pending: pending.length,
      absent: absent.length,
      participation: students.length > 0 ? Math.round((voted.length / students.length) * 100) : 0
    };
  };

  const resetAllVotes = () => {
    const resetStates = {};
    students.forEach(student => {
      resetStates[student.id] = {
        status: 'pending',
        votedAt: null,
        isAbsent: false
      };
    });
    
    setStudentStates(resetStates);
    saveStudentStates(resetStates);
  };

  const value = {
    students,
    studentStates,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    markStudentAsVoted,
    markStudentAsAbsent,
    markStudentAsPresent,
    getFilteredStudents,
    getStudentsByStatus,
    getStats,
    resetAllVotes
  };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentsContext);
  if (!context) {
    throw new Error('useStudents debe ser usado dentro de StudentsProvider');
  }
  return context;
};