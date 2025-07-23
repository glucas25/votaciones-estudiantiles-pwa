// Simulate marking a student as absent from tutor panel
// Run this in browser console after app loads

async function simulateMarkAbsent() {
  console.log('🧪 SIMULATING MARK STUDENT AS ABSENT');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    // 1. Get a random student who is not voted and not absent
    console.log('1️⃣ Finding a student to mark as absent...');
    const students = await db.findDocuments('students', { selector: { type: 'student' } });
    
    if (!students.docs || students.docs.length === 0) {
      console.log('⚠️ No students found');
      return { success: false, reason: 'No students available' };
    }
    
    // Find a student who is not voted and not already absent
    const availableStudents = students.docs.filter(s => 
      !s.votado && !s.absent && s.status !== 'voted' && s.status !== 'absent'
    );
    
    if (availableStudents.length === 0) {
      console.log('⚠️ No available students to mark as absent');
      return { success: false, reason: 'No available students' };
    }
    
    const testStudent = availableStudents[0];
    console.log(`Selected student for test: ${testStudent.nombres} ${testStudent.apellidos} (${testStudent.cedula})`);
    console.log('Student before update:', {
      _id: testStudent._id,
      nombres: testStudent.nombres,
      apellidos: testStudent.apellidos,
      absent: testStudent.absent,
      status: testStudent.status,
      votado: testStudent.votado
    });
    
    // 2. Simulate marking as absent (like StudentsContext.markStudentAsAbsent)
    console.log('2️⃣ Simulating mark as absent...');
    
    const updatedStudentData = {
      ...testStudent,
      absent: true,
      status: 'absent',
      absentAt: new Date().toISOString(),
      votado: false
    };
    
    const dbId = testStudent._id;
    const rev = testStudent._rev;
    
    if (!dbId || !rev) {
      console.log('❌ Missing _id or _rev for database update');
      return { success: false, reason: 'Missing database identifiers' };
    }
    
    console.log(`Updating student in database - ID: ${dbId}, Rev: ${rev}`);
    
    // 3. Actually update the database
    await db.updateDocument('students', dbId, rev, updatedStudentData);
    console.log('✅ Student successfully marked as absent in database');
    
    // 4. Verify the update worked
    console.log('3️⃣ Verifying database update...');
    const updatedStudent = await db.findDocuments('students', {
      selector: {
        type: 'student',
        _id: dbId
      },
      limit: 1
    });
    
    if (updatedStudent.docs && updatedStudent.docs.length > 0) {
      const student = updatedStudent.docs[0];
      console.log('Student after update:', {
        _id: student._id,
        nombres: student.nombres,
        apellidos: student.apellidos,
        absent: student.absent,
        status: student.status,
        votado: student.votado,
        absentAt: student.absentAt
      });
      
      const updateSuccess = student.absent === true && student.status === 'absent';
      console.log(`🎯 Update verification: ${updateSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      return {
        success: updateSuccess,
        studentName: `${student.nombres} ${student.apellidos}`,
        studentId: student.cedula,
        finalStatus: student.status,
        finalAbsent: student.absent,
        absentAt: student.absentAt
      };
    } else {
      console.log('❌ Could not find updated student');
      return { success: false, reason: 'Student not found after update' };
    }
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    return { success: false, error: error.message };
  }
}

window.simulateMarkAbsent = simulateMarkAbsent;
console.log('🧪 Mark absent simulation loaded. Run: simulateMarkAbsent()');