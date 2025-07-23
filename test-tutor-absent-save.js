// Test script to verify absent saving from tutor panel
// Run this in browser console after tutor panel loads

async function testTutorAbsentSave() {
  console.log('🧪 TESTING TUTOR ABSENT SAVE FUNCTIONALITY');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    // 1. Get current StudentsContext from window (if available)
    console.log('1️⃣ Checking StudentsContext availability...');
    
    // Try to access React context from global scope
    const studentsContext = window.React && window.React.studentsContext;
    if (!studentsContext) {
      console.log('⚠️ StudentsContext not directly accessible from global scope');
      console.log('💡 Please run this test by manually calling markStudentAsAbsent from tutor panel');
    }
    
    // 2. Get a student who could be marked as absent
    console.log('2️⃣ Finding a student to test absent marking...');
    const students = await db.findDocuments('students', { 
      selector: { 
        type: 'student',
        $and: [
          { votado: { $ne: true } },
          { absent: { $ne: true } }
        ]
      } 
    });
    
    if (!students.docs || students.docs.length === 0) {
      console.log('⚠️ No students available for absent testing');
      return { success: false, reason: 'No available students' };
    }
    
    const testStudent = students.docs[0];
    console.log(`Selected test student: ${testStudent.nombres} ${testStudent.apellidos} (${testStudent.cedula})`);
    
    // 3. Test the direct database query logic that was added
    console.log('3️⃣ Testing direct database query logic...');
    
    const studentId = testStudent._id || testStudent.id || testStudent.cedula;
    console.log(`Testing with studentId: ${studentId}`);
    
    // Simulate the direct query that markStudentAsAbsent would do
    const directQuery = await db.findDocuments('students', {
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
    
    console.log('Direct query result:', directQuery);
    
    if (directQuery.docs && directQuery.docs.length > 0) {
      const foundStudent = directQuery.docs[0];
      console.log('✅ Student found via direct query:', {
        _id: foundStudent._id,
        _rev: foundStudent._rev,
        nombres: foundStudent.nombres,
        curso: foundStudent.curso,
        hasRequiredFields: !!(foundStudent._id && foundStudent._rev)
      });
      
      // 4. Test the actual update logic (simulate without actually updating)
      console.log('4️⃣ Testing update logic (simulation)...');
      
      const updatedStudentData = {
        ...foundStudent,
        absent: true,
        status: 'absent',
        absentAt: new Date().toISOString(),
        votado: false
      };
      
      console.log('Would update with data:', {
        _id: foundStudent._id,
        _rev: foundStudent._rev,
        absent: updatedStudentData.absent,
        status: updatedStudentData.status,
        absentAt: updatedStudentData.absentAt
      });
      
      // Check if we have the required fields for update
      const canUpdate = foundStudent._id && foundStudent._rev;
      console.log(`🎯 Update feasibility: ${canUpdate ? '✅ CAN UPDATE' : '❌ MISSING FIELDS'}`);
      
      if (canUpdate) {
        console.log('💡 The direct query method should work for tutor absent marking');
        return {
          success: true,
          method: 'direct_query',
          studentName: `${foundStudent.nombres} ${foundStudent.apellidos}`,
          studentId: studentId,
          hasRequiredFields: true,
          wouldUpdate: true
        };
      } else {
        console.log('❌ Missing required fields for update');
        return {
          success: false,
          reason: 'Missing _id or _rev fields',
          studentId: studentId
        };
      }
    } else {
      console.log('❌ Student not found via direct query');
      return {
        success: false,
        reason: 'Student not found in direct query',
        studentId: studentId
      };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Also create a function to test the actual marking (to be called from tutor context)
async function actuallyTestAbsentMarking() {
  console.log('🎯 ACTUALLY TESTING ABSENT MARKING FROM TUTOR');
  
  try {
    // This should be called when you're actually in the tutor panel
    const db = window.databaseService;
    
    // Get a test student
    const students = await db.findDocuments('students', { 
      selector: { 
        type: 'student',
        $and: [
          { votado: { $ne: true } },
          { absent: { $ne: true } }
        ]
      },
      limit: 1
    });
    
    if (!students.docs || students.docs.length === 0) {
      console.log('⚠️ No students available for testing');
      return;
    }
    
    const testStudent = students.docs[0];
    console.log(`Will mark as absent: ${testStudent.nombres} ${testStudent.apellidos}`);
    
    // You would manually call this from the browser console while in tutor panel:
    console.log('💡 To test, call: markStudentAsAbsent(testStudent) from the tutor panel context');
    console.log('💡 Test student object:', testStudent);
    
    // Store test student in window for manual testing
    window.testStudentForAbsent = testStudent;
    console.log('✅ Test student stored in window.testStudentForAbsent');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

window.testTutorAbsentSave = testTutorAbsentSave;
window.actuallyTestAbsentMarking = actuallyTestAbsentMarking;
console.log('🧪 Tutor absent save test loaded.');
console.log('📝 Run: testTutorAbsentSave() - to test the logic');
console.log('📝 Run: actuallyTestAbsentMarking() - to prepare manual test');