// src/contexts/StudentsContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useDatabase, useStudents as useStudentsDB } from '../hooks/useDatabase.js';
import { coursesMatch, findMatchingCourse, generateCourseSuggestions } from '../utils/courseMatching.js';

const StudentsContext = createContext();

export const StudentsProvider = ({ children }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentStates, setStudentStates] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, pending, voted, absent
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isReady } = useDatabase();
  const { 
    students: dbStudents, 
    loading: dbLoading, 
    error: dbError,
    loadStudents
  } = useStudentsDB();

  // Cargar estudiantes del curso cuando el usuario cambie o la base de datos esté lista
  useEffect(() => {
    console.log('🔍 StudentsContext useEffect triggered:', {
      user: user?.course,
      isReady,
      dbStudentsLength: dbStudents?.length,
      dbStudentsAvailable: !!dbStudents
    });
    
    if (user && user.course && isReady && dbStudents !== undefined) {
      console.log('📚 Cargando estudiantes para curso del tutor:', user.course);
      console.log('📊 Total estudiantes en DB antes de filtrar:', dbStudents.length);
      loadStudentsForCourse(user.course);
      loadStudentStates(user.course);
    } else {
      console.log('⚠️ Condiciones no cumplidas para cargar estudiantes:', {
        hasUser: !!user,
        hasCourse: !!user?.course,
        isReady,
        hasDbStudents: !!dbStudents,
        dbStudentsUndefined: dbStudents === undefined,
        dbStudentsLength: dbStudents?.length
      });
    }
  }, [user, isReady, dbStudents]);

  const loadStudentsForCourse = (course) => {
    // Verificar que dbStudents esté disponible
    if (!dbStudents || !Array.isArray(dbStudents)) {
      console.warn('🟡 dbStudents no está disponible aún');
      setStudents([]);
      setLoading(false);
      return;
    }
    
    // Debug: mostrar todos los cursos disponibles
    const allCourses = [...new Set(dbStudents.map(s => s.curso || s.course).filter(Boolean))];
    console.log('📋 Cursos disponibles en la base de datos:', allCourses);
    console.log('🎯 Curso que busca el tutor:', course);
    
    // Filtrar estudiantes de la base de datos por curso (exact match primero)
    let courseStudents = dbStudents.filter(student => {
      const studentCourse = student.curso || student.course;
      const exactMatch = studentCourse === course;
      const flexMatch = coursesMatch(studentCourse, course);
      console.log(`🔍 Estudiante "${student.nombres} ${student.apellidos}" curso:"${studentCourse}" vs tutor:"${course}"`);
      console.log(`   ├─ Exact match: ${exactMatch ? '✅' : '❌'}`);
      console.log(`   └─ Flex match: ${flexMatch ? '✅' : '❌'}`);
      return exactMatch || flexMatch;
    });
    
    // Si no se encontraron coincidencias exactas, buscar coincidencias parciales
    if (courseStudents.length === 0) {
      const matchingCourse = findMatchingCourse(course, allCourses);
      if (matchingCourse) {
        console.log(`🔄 Curso alternativo encontrado: "${matchingCourse}" para "${course}"`);
        courseStudents = dbStudents.filter(student => {
          const studentCourse = student.curso || student.course;
          return coursesMatch(studentCourse, matchingCourse);
        });
      } else {
        // Generar sugerencias
        const suggestions = generateCourseSuggestions(course, allCourses);
        console.log('💡 Sugerencias de cursos:', suggestions.slice(0, 3));
      }
    }
    
    console.log(`📚 Cargando estudiantes para curso: "${course}"`);
    console.log(`📊 Estudiantes encontrados: ${courseStudents.length}`);
    
    if (courseStudents.length === 0) {
      console.log('⚠️ No se encontraron estudiantes para este curso. Detalles:');
      console.log('- Total estudiantes en BD:', dbStudents.length);
      console.log('- Cursos únicos:', allCourses);
      console.log('- Ejemplo de estudiante:', dbStudents[0]);
    }
    
    setStudents(courseStudents);
    setLoading(false);
  };

  // Helper to get consistent student ID
  const getStudentId = (student) => {
    return student._id || student.id || student.cedula;
  };

  const loadStudentStates = (course) => {
    const statesKey = `student_states_${course}`;
    const savedStates = localStorage.getItem(statesKey);
    
    if (savedStates) {
      try {
        setStudentStates(JSON.parse(savedStates));
        console.log(`💾 Estados cargados desde localStorage para ${course}`);
      } catch (error) {
        console.error('❌ Error al parsear estados guardados:', error);
        setStudentStates({});
      }
    } else {
      // Inicializar estados por defecto basándose en estudiantes de la base de datos
      const initialStates = {};
      
      // Verificar que dbStudents esté disponible
      if (dbStudents && Array.isArray(dbStudents)) {
        const courseStudents = dbStudents.filter(student => 
          student.curso === course || student.course === course
        );
        
        courseStudents.forEach(student => {
          const studentId = getStudentId(student);
          initialStates[studentId] = {
            status: 'pending', // pending, voted, absent
            votedAt: null,
            isAbsent: false
          };
        });
        
        console.log(`🎆 Estados inicializados para ${courseStudents.length} estudiantes en ${course}`);
      } else {
        console.warn('🟡 No hay estudiantes disponibles para inicializar estados');
      }
      
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

  const markStudentAsVoted = (student) => {
    const studentId = typeof student === 'string' ? student : getStudentId(student);
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'voted',
        votedAt: new Date().toISOString(),
        isAbsent: false
      }
    };
    
    console.log(`✅ Estudiante marcado como votado: ${studentId}`);
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const markStudentAsAbsent = (student) => {
    const studentId = typeof student === 'string' ? student : getStudentId(student);
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'absent',
        isAbsent: true,
        votedAt: null
      }
    };
    
    console.log(`❌ Estudiante marcado como ausente: ${studentId}`);
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const markStudentAsPresent = (student) => {
    const studentId = typeof student === 'string' ? student : getStudentId(student);
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'pending',
        isAbsent: false,
        votedAt: null
      }
    };
    
    console.log(`⏳ Estudiante marcado como presente: ${studentId}`);
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const getFilteredStudents = () => {
    let filtered = students;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        (student.nombres || student.nombre || '').toLowerCase().includes(term) ||
        (student.apellidos || '').toLowerCase().includes(term) ||
        `${student.nombres || student.nombre || ''} ${student.apellidos || ''}`.toLowerCase().includes(term) ||
        (student.cedula || '').toString().includes(term)
      );
    }

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(student => {
        const studentId = getStudentId(student);
        const state = studentStates[studentId];
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
      const studentId = getStudentId(student);
      const state = studentStates[studentId];
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

  // Mass operations for admin functionality
  const addStudent = (newStudent) => {
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    
    // Initialize state for new student
    const newStates = {
      ...studentStates,
      [newStudent.id]: {
        status: 'pending',
        votedAt: null,
        isAbsent: false
      }
    };
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const updateStudent = (updatedStudent) => {
    const updatedStudents = students.map(s => 
      s.id === updatedStudent.id ? updatedStudent : s
    );
    setStudents(updatedStudents);
  };

  const removeStudent = (studentId) => {
    const updatedStudents = students.filter(s => s.id !== studentId);
    setStudents(updatedStudents);
    
    // Remove from states
    const newStates = { ...studentStates };
    delete newStates[studentId];
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const bulkImportStudents = (importedStudents) => {
    const existingIds = new Set(students.map(s => s.id));
    const newStudents = importedStudents.filter(s => !existingIds.has(s.id));
    
    if (newStudents.length > 0) {
      const updatedStudents = [...students, ...newStudents];
      setStudents(updatedStudents);
      
      // Initialize states for new students
      const newStates = { ...studentStates };
      newStudents.forEach(student => {
        newStates[student.id] = {
          status: 'pending',
          votedAt: null,
          isAbsent: false
        };
      });
      
      setStudentStates(newStates);
      saveStudentStates(newStates);
    }
    
    return newStudents.length;
  };

  const bulkUpdateStatus = (studentIds, newStatus) => {
    const newStates = { ...studentStates };
    studentIds.forEach(id => {
      if (newStates[id]) {
        newStates[id] = {
          ...newStates[id],
          status: newStatus,
          votedAt: newStatus === 'voted' ? new Date().toISOString() : null,
          isAbsent: newStatus === 'absent'
        };
      }
    });
    
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const getStudentsByLevel = (level) => {
    return students.filter(student => student.nivel === level);
  };

  const getStudentsByCourse = (course) => {
    return students.filter(student => student.curso === course);
  };

  const searchStudents = (term) => {
    if (!term) return students;
    
    const lowerTerm = term.toLowerCase();
    return students.filter(student => 
      student.nombres?.toLowerCase().includes(lowerTerm) ||
      student.apellidos?.toLowerCase().includes(lowerTerm) ||
      student.cedula?.includes(term) ||
      student.curso?.toLowerCase().includes(lowerTerm) ||
      `${student.nombres} ${student.apellidos}`.toLowerCase().includes(lowerTerm)
    );
  };

  const value = {
    students,
    studentStates,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    loading: loading || dbLoading,
    error: error || dbError,
    isReady: isReady && dbStudents !== undefined,
    totalStudentsInDB: dbStudents ? dbStudents.length : 0,
    markStudentAsVoted,
    markStudentAsAbsent,
    markStudentAsPresent,
    getFilteredStudents,
    getStudentsByStatus,
    getStats,
    resetAllVotes,
    // Mass operations
    addStudent,
    updateStudent,
    removeStudent,
    bulkImportStudents,
    bulkUpdateStatus,
    getStudentsByLevel,
    getStudentsByCourse,
    searchStudents,
    // Utility methods
    getStudentId,
    refreshStudents: () => {
      console.log('🔄 RefreshStudents called');
      if (isReady) {
        loadStudents();
        if (user && user.course) {
          loadStudentsForCourse(user.course);
        }
      }
    }
  };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudentsContext = () => {
  const context = useContext(StudentsContext);
  if (!context) {
    throw new Error('useStudentsContext debe ser usado dentro de StudentsProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useStudents = useStudentsContext;