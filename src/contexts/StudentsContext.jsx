// src/contexts/StudentsContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useDatabase, useStudents as useStudentsDB } from '../hooks/useDatabase.js';
import { coursesMatch, findMatchingCourse, generateCourseSuggestions } from '../utils/courseMatching.js';
import databaseService, { DOC_TYPES } from '../services/database-indexeddb.js';

const StudentsContext = createContext();

export const StudentsProvider = ({ children }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentStates, setStudentStates] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, pending, voted, absent
  const [loading, setLoading] = useState(true); // Iniciamos en true hasta tener datos completos
  const [dataReady, setDataReady] = useState(false); // Nuevo estado para datos completos
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
      dbStudentsAvailable: !!dbStudents,
      timestamp: new Date().toISOString()
    });
    
    const loadData = async () => {
      if (!user || !user.course || !isReady) {
        console.log('⚠️ Condiciones básicas no cumplidas:', {
          hasUser: !!user,
          hasCourse: !!user?.course,
          isReady
        });
        return;
      }

      // Esperar a que dbStudents esté disponible con timeout
      let attempts = 0;
      const maxAttempts = 20; // 2 segundos max
      
      while ((!dbStudents || !Array.isArray(dbStudents)) && attempts < maxAttempts) {
        console.log(`⏳ Esperando dbStudents... intento ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!dbStudents || !Array.isArray(dbStudents)) {
        console.error('❌ dbStudents no disponible después de esperar');
        return;
      }

      console.log('📚 Cargando estudiantes para curso del tutor:', user.course);
      console.log('📊 Total estudiantes en DB antes de filtrar:', dbStudents.length);
      
      setLoading(true);
      setDataReady(false);
      
      try {
        // Cargar estudiantes primero, luego estados - SECUENCIAL para evitar race conditions
        loadStudentsForCourse(user.course);
        
        // Delay más largo para asegurar que los estudiantes se cargaron
        setTimeout(async () => {
          await loadStudentStates(user.course);
          // Una vez que tanto estudiantes como estados están cargados, marcar como ready
          setDataReady(true);
          setLoading(false);
          console.log('✅ Datos completos cargados - Students y States listos');
        }, 200);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError(error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.course, isReady]); // Removida dependencia dbStudents para evitar loops infinitos

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
  };

  // Helper to get consistent student ID
  const getStudentId = (student) => {
    return student._id || student.id || student.cedula;
  };

  /**
   * Validate data consistency between localStorage and database
   */
  const validateDataConsistency = async () => {
    if (!user?.course || !databaseService || !databaseService.isReady()) {
      return { consistent: false, error: 'Database not ready' };
    }

    try {
      // Get database states directly from database
      const studentsResult = await databaseService.findDocuments('students', {
        selector: {
          type: 'student',
          $or: [
            { curso: user.course },
            { course: user.course }
          ]
        }
      });

      const dbStates = {};
      if (studentsResult.docs && studentsResult.docs.length > 0) {
        studentsResult.docs.forEach(student => {
          const studentId = getStudentId(student);
          dbStates[studentId] = {
            status: student.votado ? 'voted' : 'pending',
            votedAt: student.votedAt || null,
            isAbsent: student.absent || false
          };
        });
      }
      
      // Get localStorage states
      const statesKey = `student_states_${user.course}`;
      const savedStates = localStorage.getItem(statesKey);
      const localStates = savedStates ? JSON.parse(savedStates) : {};
      
      // Compare
      const dbKeys = Object.keys(dbStates);
      const localKeys = Object.keys(localStates);
      
      const inconsistencies = [];
      
      // Check for differences
      dbKeys.forEach(studentId => {
        const dbStatus = dbStates[studentId]?.status;
        const localStatus = localStates[studentId]?.status;
        
        if (dbStatus !== localStatus) {
          inconsistencies.push({
            studentId,
            database: dbStatus,
            localStorage: localStatus
          });
        }
      });
      
      // Check for localStorage entries not in database
      localKeys.forEach(studentId => {
        if (!dbStates[studentId] && localStates[studentId]?.status !== 'pending') {
          inconsistencies.push({
            studentId,
            database: 'not found',
            localStorage: localStates[studentId]?.status
          });
        }
      });
      
      const consistent = inconsistencies.length === 0;
      
      console.log(`🔍 Data consistency check for ${user.course}:`, {
        consistent,
        dbStates: dbKeys.length,
        localStates: localKeys.length,
        inconsistencies: inconsistencies.length
      });
      
      if (!consistent) {
        console.warn('⚠️ Data inconsistencies found:', inconsistencies);
        // Auto-fix: Update localStorage to match database
        console.log('🔄 Auto-fixing inconsistencies by syncing localStorage with database...');
        const statesKey = `student_states_${user.course}`;
        localStorage.setItem(statesKey, JSON.stringify(dbStates));
        setStudentStates(dbStates);
      }
      
      return {
        consistent,
        inconsistencies,
        dbStatesCount: dbKeys.length,
        localStatesCount: localKeys.length,
        autoFixed: !consistent
      };
      
    } catch (error) {
      console.error('❌ Error validating data consistency:', error);
      return { consistent: false, error: error.message };
    }
  };

  const loadStudentStates = async (course) => {
    console.log(`🔍 Loading student states for course: ${course} (DATABASE-FIRST) at ${new Date().toISOString()}`);
    
    try {
      // STRATEGY 1: Load states from database first
      await loadStatesFromDatabase(course);
      
      // STRATEGY 2: Merge with localStorage only as fallback for missing data
      mergeWithLocalStorageStates(course);
      
      // STRATEGY 3: Validate consistency and auto-fix if needed
      setTimeout(async () => {
        const validationResult = await validateDataConsistency();
        if (validationResult.autoFixed) {
          console.log('✅ Data consistency auto-fixed');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error loading student states from database:', error);
      // Fallback to localStorage only if database fails completely
      loadStatesFromLocalStorageOnly(course);
    }
  };

  /**
   * Load student voting states from database (PRIMARY SOURCE)
   */
  const loadStatesFromDatabase = async (course) => {
    if (!databaseService || !databaseService.isReady()) {
      throw new Error('Database not ready');
    }

    // Get all students for this course from database
    const studentsResult = await databaseService.findDocuments('students', {
      selector: {
        type: 'student',
        $or: [
          { curso: course },
          { course: course }
        ]
      }
    });

    const databaseStates = {};
    
    if (studentsResult.docs && studentsResult.docs.length > 0) {
      studentsResult.docs.forEach(student => {
        const studentId = getStudentId(student);
        // Determine status based on database fields
        let status = 'pending';
        if (student.absent) {
          status = 'absent';
        } else if (student.votado) {
          status = 'voted';
        }
        
        databaseStates[studentId] = {
          status: status,
          votedAt: student.votedAt || null,
          isAbsent: student.absent || false
        };
        
      });
      
      console.log(`✅ Loaded ${Object.keys(databaseStates).length} student states from DATABASE for ${course}`);
      
      // Cross-reference with vote records to ensure consistency (RE-ENABLED)
      await crossReferenceWithVotes(databaseStates, course);
      
      setStudentStates(databaseStates);
      return databaseStates;
    } else {
      console.log(`⚠️ No students found in database for course: ${course}`);
      return {};
    }
  };

  /**
   * Cross-reference student states with vote records for consistency
   */
  const crossReferenceWithVotes = async (states, course) => {
    try {
      console.log(`🔍 DEBUG crossReferenceWithVotes: Starting cross-reference for course ${course}`);
      console.log(`🔍 DEBUG crossReferenceWithVotes: Initial states:`, Object.keys(states).length, 'students');
      
      // Get only student IDs from this course to filter votes properly
      const studentIds = Object.keys(states);
      console.log(`🔍 DEBUG crossReferenceWithVotes: Course student IDs:`, studentIds);
      
      // Get all vote records (we'll filter them on the client side)
      const votesResult = await databaseService.findDocuments('votes', {
        selector: {
          type: DOC_TYPES.VOTE
        }
      });

      console.log(`🔍 DEBUG crossReferenceWithVotes: Vote query result:`, votesResult);
      console.log(`🔍 DEBUG crossReferenceWithVotes: Found ${votesResult.docs?.length || 0} total vote records`);

      if (votesResult.docs && votesResult.docs.length > 0) {
        let updatedCount = 0;
        
        // Filter votes to only include students from this course
        const courseVotes = votesResult.docs.filter(vote => {
          const included = studentIds.includes(vote.studentId);
          if (!included) {
            console.log(`🔍 DEBUG crossReferenceWithVotes: Vote ${vote._id} for student ${vote.studentId} not in course student IDs`);
          }
          return included;
        });
        console.log(`🔍 DEBUG crossReferenceWithVotes: Filtered to ${courseVotes.length} votes for this course`);
        
        if (courseVotes.length === 0 && votesResult.docs.length > 0) {
          console.log(`⚠️ DEBUG crossReferenceWithVotes: No course matches found!`);
          console.log(`⚠️ Vote student IDs:`, votesResult.docs.map(v => v.studentId));
          console.log(`⚠️ Course student IDs sample:`, studentIds.slice(0, 5));
        }
        
        courseVotes.forEach(vote => {
          const studentId = vote.studentId;
          console.log(`🔍 DEBUG crossReferenceWithVotes: Processing vote for student ${studentId}`);
          
          // Only update if student has a vote record but is marked as pending (not absent)
          if (states[studentId] && states[studentId].status === 'pending') {
            console.log(`🔄 Cross-reference: Updating student ${studentId} to voted based on vote record`);
            states[studentId] = {
              status: 'voted',
              votedAt: vote.timestamp,
              isAbsent: states[studentId].isAbsent || false  // Preserve existing absent status
            };
            updatedCount++;
          } else if (states[studentId]) {
            console.log(`📝 Cross-reference: Student ${studentId} already has status: ${states[studentId].status}`);
          }
        });

        if (updatedCount > 0) {
          console.log(`✅ Cross-reference: Updated ${updatedCount} student states based on vote records`);
        } else {
          console.log(`📝 Cross-reference: No updates needed - all states consistent`);
        }
      } else {
        console.log(`📝 Cross-reference: No vote records found in database`);
      }
    } catch (error) {
      console.error('❌ Error cross-referencing with votes:', error);
    }
  };

  /**
   * Merge database states with localStorage (only for missing data)
   */
  const mergeWithLocalStorageStates = (course) => {
    const statesKey = `student_states_${course}`;
    const savedStates = localStorage.getItem(statesKey);
    
    if (savedStates) {
      try {
        const localStates = JSON.parse(savedStates);
        
        setStudentStates(prevStates => {
          const merged = { ...localStates };
          
          // Database data takes precedence over localStorage
          Object.keys(prevStates).forEach(studentId => {
            merged[studentId] = prevStates[studentId];
          });
          
          const addedFromLocal = Object.keys(localStates).filter(id => !prevStates[id]).length;
          if (addedFromLocal > 0) {
            console.log(`🔄 Merged ${addedFromLocal} additional states from localStorage`);
          }
          
          return merged;
        });
      } catch (error) {
        console.error('❌ Error parsing localStorage states:', error);
      }
    }
  };

  /**
   * Fallback: Load from localStorage only (when database fails)
   */
  const loadStatesFromLocalStorageOnly = (course) => {
    const statesKey = `student_states_${course}`;
    const savedStates = localStorage.getItem(statesKey);
    
    if (savedStates) {
      try {
        setStudentStates(JSON.parse(savedStates));
        console.log(`💾 FALLBACK: States loaded from localStorage for ${course}`);
      } catch (error) {
        console.error('❌ Error parsing localStorage states:', error);
        setStudentStates({});
      }
    } else {
      // Initialize empty states if no localStorage data
      const initialStates = {};
      
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

  const markStudentAsVoted = async (student) => {
    const studentId = typeof student === 'string' ? student : getStudentId(student);
    console.log(`🔄 StudentsContext: Starting markStudentAsVoted for: ${studentId}`);
    console.log(`🔍 StudentsContext: Input student object:`, student);
    console.log(`🔍 StudentsContext: Resolved student ID:`, studentId);
    
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'voted',
        votedAt: new Date().toISOString(),
        isAbsent: false
      }
    };
    
    console.log(`✅ StudentsContext: Marking student as voted: ${studentId}`);
    console.log('📊 StudentsContext: Previous states count:', Object.keys(studentStates).length);
    console.log('📊 StudentsContext: New states count:', Object.keys(newStates).length);
    console.log('📊 StudentsContext: Updated state for student:', newStates[studentId]);
    
    setStudentStates(newStates);
    saveStudentStates(newStates);
    
    // Also update student in database if available
    try {
      console.log(`🔍 StudentsContext: Searching for student ${studentId} in ${students.length} students`);
      const studentData = students.find(s => getStudentId(s) === studentId);
      console.log(`🔍 StudentsContext: Found student data:`, studentData ? { _id: studentData._id, _rev: studentData._rev, nombres: studentData.nombres } : 'NOT FOUND');
      
      if (studentData && databaseService && databaseService.isReady()) {
        const updatedStudentData = {
          ...studentData,
          status: 'voted',
          votado: true,
          votedAt: new Date().toISOString()
        };
        
        // Update student in database with correct parameters
        const dbId = studentData._id;
        const rev = studentData._rev;
        
        console.log(`🔍 StudentsContext: Database IDs - dbId: ${dbId}, rev: ${rev}`);
        
        if (dbId && rev) {
          console.log(`🔄 StudentsContext: Updating student ${studentId} in database...`);
          await databaseService.updateDocument('students', dbId, rev, updatedStudentData);
          console.log(`✅ StudentsContext: Student ${studentId} voting status updated in database`);
        } else {
          console.warn(`⚠️ StudentsContext: Cannot update student ${studentId} - missing _id (${dbId}) or _rev (${rev})`);
          console.warn(`⚠️ StudentsContext: Student data keys:`, Object.keys(studentData));
        }
      } else {
        if (!studentData) {
          console.error(`❌ StudentsContext: Student ${studentId} not found in students array`);
        }
        if (!databaseService) {
          console.error(`❌ StudentsContext: Database service not available`);
        }
        if (!databaseService?.isReady()) {
          console.error(`❌ StudentsContext: Database service not ready`);
        }
      }
    } catch (error) {
      console.error('❌ StudentsContext: Failed to update student voting status in database:', error);
      console.error('❌ StudentsContext: Error stack:', error.stack);
      // Don't throw - continue with local state update
    }
  };

  const markStudentAsAbsent = async (student) => {
    const studentId = typeof student === 'string' ? student : getStudentId(student);
    console.log(`🔄 StudentsContext: Starting markStudentAsAbsent for: ${studentId}`);
    console.log(`🔍 StudentsContext: Input student object:`, student);
    console.log(`🔍 StudentsContext: Current user context:`, user?.course);
    console.log(`🔍 StudentsContext: Students array length:`, students?.length);
    
    // Update database first
    try {
      console.log(`🔍 StudentsContext: Searching for student ${studentId} in ${students.length} students for absent marking`);
      
      // Log first few students for debugging
      if (students && students.length > 0) {
        console.log(`🔍 StudentsContext: First 3 students in array:`, students.slice(0, 3).map(s => ({
          _id: s._id,
          nombres: s.nombres,
          curso: s.curso,
          resolvedId: getStudentId(s)
        })));
      }
      
      const studentData = students?.find(s => getStudentId(s) === studentId);
      console.log(`🔍 StudentsContext: Found student data for absent:`, studentData ? { 
        _id: studentData._id, 
        _rev: studentData._rev, 
        nombres: studentData.nombres,
        curso: studentData.curso,
        inputStudentId: studentId,
        resolvedId: getStudentId(studentData)
      } : 'NOT FOUND');
      
      // If not found in current students array, try to query database directly
      if (!studentData) {
        console.log(`🔍 StudentsContext: Student not found in local array, querying database directly...`);
        
        const directQuery = await databaseService.findDocuments('students', {
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
        
        console.log(`🔍 StudentsContext: Direct database query result:`, directQuery);
        
        if (directQuery.docs && directQuery.docs.length > 0) {
          const dbStudent = directQuery.docs[0];
          console.log(`✅ StudentsContext: Found student in database directly:`, {
            _id: dbStudent._id,
            _rev: dbStudent._rev,
            nombres: dbStudent.nombres,
            curso: dbStudent.curso
          });
          
          // Use the student from database
          const updatedStudentData = {
            ...dbStudent,
            absent: true,
            status: 'absent',
            absentAt: new Date().toISOString(),
            votado: false
          };
          
          await databaseService.updateDocument('students', updatedStudentData);
          console.log(`✅ StudentsContext: Student ${studentId} marked as absent in database (via direct query)`);
          
          // Update local state
          const newStates = {
            ...studentStates,
            [studentId]: {
              ...studentStates[studentId],
              status: 'absent',
              isAbsent: true,
              votedAt: null
            }
          };
          
          console.log(`❌ StudentsContext: Estudiante marcado como ausente: ${studentId}`);
          console.log('📊 StudentsContext: New absent state for student:', newStates[studentId]);
          setStudentStates(newStates);
          saveStudentStates(newStates);
          return; // Exit early since we handled it
        }
      }
      
      if (studentData && databaseService && databaseService.isReady()) {
        const updatedStudentData = {
          ...studentData,
          absent: true,
          status: 'absent',
          absentAt: new Date().toISOString(),
          votado: false
        };
        
        // Update student in database with correct parameters
        const dbId = studentData._id;
        const rev = studentData._rev;
        
        console.log(`🔍 StudentsContext: Database IDs for absent - dbId: ${dbId}, rev: ${rev}`);
        
        if (dbId && rev) {
          console.log(`🔄 StudentsContext: Updating student ${studentId} as absent in database...`);
          await databaseService.updateDocument('students', updatedStudentData);
          console.log(`✅ StudentsContext: Student ${studentId} marked as absent in database`);
        } else {
          console.warn(`⚠️ StudentsContext: Cannot update student ${studentId} as absent - missing _id (${dbId}) or _rev (${rev})`);
          console.warn(`⚠️ StudentsContext: Student data keys for absent:`, Object.keys(studentData));
        }
      } else {
        if (!studentData) {
          console.error(`❌ StudentsContext: Student ${studentId} not found in students array for absent marking`);
        }
        if (!databaseService) {
          console.error(`❌ StudentsContext: Database service not available for absent marking`);
        }
        if (!databaseService?.isReady()) {
          console.error(`❌ StudentsContext: Database service not ready for absent marking`);
        }
      }
    } catch (error) {
      console.error('❌ StudentsContext: Failed to update student absent status in database:', error);
      console.error('❌ StudentsContext: Absent error stack:', error.stack);
      // Continue with local state update even if database fails
    }

    // Update local state
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'absent',
        isAbsent: true,
        votedAt: null
      }
    };
    
    console.log(`❌ StudentsContext: Estudiante marcado como ausente: ${studentId}`);
    console.log('📊 StudentsContext: New absent state for student:', newStates[studentId]);
    setStudentStates(newStates);
    saveStudentStates(newStates);
  };

  const markStudentAsPresent = async (student) => {
    const studentId = typeof student === 'string' ? student : getStudentId(student);
    console.log(`🔄 StudentsContext: Starting markStudentAsPresent for: ${studentId}`);
    console.log(`🔍 StudentsContext: Input student object:`, student);
    console.log(`🔍 StudentsContext: Current user context:`, user?.course);
    
    // Update database first
    try {
      console.log(`🔍 StudentsContext: Searching for student ${studentId} in ${students.length} students for present marking`);
      const studentData = students?.find(s => getStudentId(s) === studentId);
      console.log(`🔍 StudentsContext: Found student data for present:`, studentData ? { _id: studentData._id, _rev: studentData._rev, nombres: studentData.nombres } : 'NOT FOUND');
      
      // If not found in current students array, try to query database directly
      if (!studentData) {
        console.log(`🔍 StudentsContext: Student not found in local array for present, querying database directly...`);
        
        const directQuery = await databaseService.findDocuments('students', {
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
        
        console.log(`🔍 StudentsContext: Direct database query result for present:`, directQuery);
        
        if (directQuery.docs && directQuery.docs.length > 0) {
          const dbStudent = directQuery.docs[0];
          console.log(`✅ StudentsContext: Found student in database directly for present:`, {
            _id: dbStudent._id,
            _rev: dbStudent._rev,
            nombres: dbStudent.nombres,
            curso: dbStudent.curso
          });
          
          // Use the student from database
          const updatedStudentData = {
            ...dbStudent,
            absent: false,
            status: 'pending',
            absentAt: null,
            votado: false
          };
          
          await databaseService.updateDocument('students', updatedStudentData);
          console.log(`✅ StudentsContext: Student ${studentId} marked as present in database (via direct query)`);
          
          // Update local state
          const newStates = {
            ...studentStates,
            [studentId]: {
              ...studentStates[studentId],
              status: 'pending',
              isAbsent: false,
              votedAt: null
            }
          };
          
          console.log(`⏳ StudentsContext: Estudiante marcado como presente: ${studentId}`);
          console.log('📊 StudentsContext: New present state for student:', newStates[studentId]);
          setStudentStates(newStates);
          saveStudentStates(newStates);
          return; // Exit early since we handled it
        }
      }
      
      if (studentData && databaseService && databaseService.isReady()) {
        const updatedStudentData = {
          ...studentData,
          absent: false,
          status: 'pending',
          absentAt: null,
          votado: false
        };
        
        // Update student in database with correct parameters
        const dbId = studentData._id;
        const rev = studentData._rev;
        
        console.log(`🔍 StudentsContext: Database IDs for present - dbId: ${dbId}, rev: ${rev}`);
        
        if (dbId && rev) {
          console.log(`🔄 StudentsContext: Updating student ${studentId} as present in database...`);
          await databaseService.updateDocument('students', updatedStudentData);
          console.log(`✅ StudentsContext: Student ${studentId} marked as present in database`);
        } else {
          console.warn(`⚠️ StudentsContext: Cannot update student ${studentId} as present - missing _id (${dbId}) or _rev (${rev})`);
          console.warn(`⚠️ StudentsContext: Student data keys for present:`, Object.keys(studentData));
        }
      } else {
        if (!studentData) {
          console.error(`❌ StudentsContext: Student ${studentId} not found in students array for present marking`);
        }
        if (!databaseService) {
          console.error(`❌ StudentsContext: Database service not available for present marking`);
        }
        if (!databaseService?.isReady()) {
          console.error(`❌ StudentsContext: Database service not ready for present marking`);
        }
      }
    } catch (error) {
      console.error('❌ StudentsContext: Failed to update student present status in database:', error);
      console.error('❌ StudentsContext: Present error stack:', error.stack);
      // Continue with local state update even if database fails
    }

    // Update local state
    const newStates = {
      ...studentStates,
      [studentId]: {
        ...studentStates[studentId],
        status: 'pending',
        isAbsent: false,
        votedAt: null
      }
    };
    
    console.log(`⏳ StudentsContext: Estudiante marcado como presente: ${studentId}`);
    console.log('📊 StudentsContext: New present state for student:', newStates[studentId]);
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

  const getStudentsByStatus = useMemo(() => {
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

    console.log('📊 StudentsContext: getStudentsByStatus recalculated', {
      totalStudents: students.length,
      totalStates: Object.keys(studentStates).length,
      pending: pending.length,
      voted: voted.length,
      absent: absent.length,
      studentStatesPreview: Object.keys(studentStates).slice(0, 3).map(id => ({
        id,
        status: studentStates[id]?.status
      }))
    });

    return { pending, voted, absent };
  }, [students, studentStates]);

  const getStats = useMemo(() => {
    const { pending, voted, absent } = getStudentsByStatus;
    
    const stats = {
      total: students.length,
      voted: voted.length,
      pending: pending.length,
      absent: absent.length,
      participation: students.length > 0 ? Math.round((voted.length / students.length) * 100) : 0
    };
    
    console.log('📊 StudentsContext: Stats recalculated', stats);
    return stats;
  }, [students.length, getStudentsByStatus]);

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

  /**
   * Reset student voting states and database records (for new elections)
   * Preserves student list but cleans votes and states
   */
  const resetStudentStatesForNewElection = async () => {
    try {
      console.log('🔄 Resetting student states for new election...');
      
      // 1. Reset local states to pending
      const resetStates = {};
      students.forEach(student => {
        const studentId = getStudentId(student);
        resetStates[studentId] = {
          status: 'pending',
          votedAt: null,
          isAbsent: false
        };
      });
      
      setStudentStates(resetStates);
      saveStudentStates(resetStates);
      
      // 2. Update all student documents in database to reset voting status
      if (databaseService && databaseService.isReady()) {
        const updatePromises = students.map(async (student) => {
          try {
            const updatedStudent = {
              ...student,
              votado: false,
              absent: false,
              votedAt: null,
              absentAt: null
            };
            
            await databaseService.updateDocument('students', updatedStudent);
          } catch (error) {
            console.error(`Failed to reset student ${getStudentId(student)}:`, error);
          }
        });
        
        await Promise.all(updatePromises);
        console.log(`✅ Reset ${students.length} student records in database`);
      }
      
      console.log('🎉 Student states reset completed successfully');
      return { success: true, count: students.length };
      
    } catch (error) {
      console.error('❌ Error resetting student states:', error);
      throw error;
    }
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
    dataReady, // Nuevo: indica cuando tanto estudiantes como estados están cargados
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
    resetStudentStatesForNewElection,
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
    validateDataConsistency,
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