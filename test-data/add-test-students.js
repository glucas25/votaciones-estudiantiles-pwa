// test-data/add-test-students.js
// Utility to add test students to the database for debugging

import databaseService, { DOC_TYPES } from '../src/services/database-indexeddb.js';

const TEST_STUDENTS = [
  // 1ro Bach A
  {
    _id: 'student_001',
    type: DOC_TYPES.STUDENT,
    cedula: '1234567001',
    nombres: 'Juan Carlos',
    apellidos: 'Pérez García',
    course: '1ro Bach A',
    curso: '1ro Bach A',
    level: 'BACHILLERATO',
    nivel: 'BACHILLERATO',
    numero: 1,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'student_002', 
    type: DOC_TYPES.STUDENT,
    cedula: '1234567002',
    nombres: 'María José',
    apellidos: 'González López',
    course: '1ro Bach A',
    curso: '1ro Bach A',
    level: 'BACHILLERATO',
    nivel: 'BACHILLERATO',
    numero: 2,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'student_003',
    type: DOC_TYPES.STUDENT,
    cedula: '1234567003',
    nombres: 'Pedro Andrés',
    apellidos: 'Martínez Silva',
    course: '1ro Bach A',
    curso: '1ro Bach A',
    level: 'BACHILLERATO',
    nivel: 'BACHILLERATO',
    numero: 3,
    createdAt: new Date().toISOString()
  },
  // 1ro Bach B
  {
    _id: 'student_004',
    type: DOC_TYPES.STUDENT,
    cedula: '1234567004',
    nombres: 'Ana Lucía',
    apellidos: 'Rodríguez Torres',
    course: '1ro Bach B',
    curso: '1ro Bach B',
    level: 'BACHILLERATO',
    nivel: 'BACHILLERATO',
    numero: 1,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'student_005',
    type: DOC_TYPES.STUDENT,
    cedula: '1234567005',
    nombres: 'Carlos Eduardo',
    apellidos: 'Vásquez Morales',
    course: '1ro Bach B',
    curso: '1ro Bach B',
    level: 'BACHILLERATO',
    nivel: 'BACHILLERATO',
    numero: 2,
    createdAt: new Date().toISOString()
  },
  // 8vo A
  {
    _id: 'student_006',
    type: DOC_TYPES.STUDENT,
    cedula: '1234567006',
    nombres: 'Sofía Valentina',
    apellidos: 'Herrera Castro',
    course: '8vo A',
    curso: '8vo A',
    level: 'BASICA_SUPERIOR',
    nivel: 'BASICA_SUPERIOR',
    numero: 1,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'student_007',
    type: DOC_TYPES.STUDENT,
    cedula: '1234567007',
    nombres: 'Diego Alejandro',
    apellidos: 'Jiménez Ruiz',
    course: '8vo A',
    curso: '8vo A',
    level: 'BASICA_SUPERIOR',
    nivel: 'BASICA_SUPERIOR',
    numero: 2,
    createdAt: new Date().toISOString()
  }
];

export async function addTestStudents() {
  try {
    console.log('📚 Adding test students to database...');
    
    // Wait for database to be ready
    await databaseService.initPromise;
    
    // Add each student
    for (const student of TEST_STUDENTS) {
      try {
        const result = await databaseService.createDocument('students', student, DOC_TYPES.STUDENT);
        if (result.success) {
          console.log(`✅ Added student: ${student.nombres} ${student.apellidos} (${student.course})`);
        } else {
          console.log(`⚠️ Student already exists: ${student.nombres} ${student.apellidos}`);
        }
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`⚠️ Student already exists: ${student.nombres} ${student.apellidos}`);
        } else {
          console.error(`❌ Error adding student ${student.nombres}:`, error);
        }
      }
    }
    
    console.log('🎉 Finished adding test students');
    return { success: true, count: TEST_STUDENTS.length };
    
  } catch (error) {
    console.error('❌ Error adding test students:', error);
    return { success: false, error: error.message };
  }
}

// For use in browser console
window.addTestStudents = addTestStudents;

export default addTestStudents;