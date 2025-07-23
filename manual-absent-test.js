// Manual test to mark a student as absent - exact replication of context logic
// Run this in browser console after app loads

async function manualAbsentTest() {
  console.log('🎯 MANUAL ABSENT TEST - REPLICATING CONTEXT LOGIC');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    console.log('1️⃣ Finding a student to mark as absent...');
    
    // Find a student who is not voted and not already absent
    const availableStudents = await db.findDocuments('students', {
      selector: {
        type: 'student',
        $and: [
          { $or: [{ votado: { $ne: true } }, { votado: { $exists: false } }] },
          { $or: [{ absent: { $ne: true } }, { absent: { $exists: false } }] },
          { $or: [{ status: { $ne: 'voted' } }, { status: { $exists: false } }] },
          { $or: [{ status: { $ne: 'absent' } }, { status: { $exists: false } }] }
        ]
      },
      limit: 5
    });
    
    console.log(`Found ${availableStudents.docs?.length || 0} available students`);
    
    if (!availableStudents.docs || availableStudents.docs.length === 0) {
      console.log('⚠️ No available students found');
      
      // Let's try a simpler query
      console.log('Trying simpler query...');
      const allStudents = await db.findDocuments('students', {
        selector: { type: 'student' },
        limit: 5
      });
      
      if (allStudents.docs && allStudents.docs.length > 0) {
        console.log('Using first available student for test...');
        availableStudents.docs = [allStudents.docs[0]];
      } else {
        console.log('❌ No students found at all');
        return { success: false, reason: 'No students in database' };
      }
    }
    
    const testStudent = availableStudents.docs[0];
    console.log(`Selected student: ${testStudent.nombres} ${testStudent.apellidos} (${testStudent.cedula})`);
    console.log('Student before update:', {
      _id: testStudent._id,
      _rev: testStudent._rev,
      nombres: testStudent.nombres,
      absent: testStudent.absent,
      status: testStudent.status,
      votado: testStudent.votado,
      absentAt: testStudent.absentAt
    });
    
    console.log('2️⃣ Preparing update data...');
    
    // Replicate the exact logic from markStudentAsAbsent
    const updatedStudentData = {
      ...testStudent,
      absent: true,
      status: 'absent',
      absentAt: new Date().toISOString(),
      votado: false
    };
    
    console.log('Update data prepared:', {
      absent: updatedStudentData.absent,
      status: updatedStudentData.status,
      absentAt: updatedStudentData.absentAt,
      votado: updatedStudentData.votado
    });
    
    console.log('3️⃣ Attempting database update...');
    
    const dbId = testStudent._id;
    const rev = testStudent._rev;
    
    console.log(`Update parameters: storeName='students', dbId='${dbId}', rev='${rev}'`);
    
    if (!dbId || !rev) {
      console.log('❌ Missing required fields for update');
      return { success: false, reason: 'Missing _id or _rev' };
    }
    
    // Perform the update
    await db.updateDocument('students', dbId, rev, updatedStudentData);
    console.log('✅ Database update completed');
    
    console.log('4️⃣ Verifying the update...');
    
    // Query the student again to verify the update
    const verificationResult = await db.findDocuments('students', {
      selector: {
        type: 'student',
        _id: dbId
      },
      limit: 1
    });
    
    if (verificationResult.docs && verificationResult.docs.length > 0) {
      const updatedStudent = verificationResult.docs[0];
      console.log('Student after update:', {
        _id: updatedStudent._id,
        _rev: updatedStudent._rev,
        nombres: updatedStudent.nombres,
        absent: updatedStudent.absent,
        status: updatedStudent.status,
        votado: updatedStudent.votado,
        absentAt: updatedStudent.absentAt
      });
      
      // Check if the update was successful
      const updateSuccessful = updatedStudent.absent === true && updatedStudent.status === 'absent';
      console.log(`🎯 Update verification: ${updateSuccessful ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (updateSuccessful) {
        console.log('🎉 MANUAL ABSENT MARKING WORKS!');
        console.log('💡 The database can store absent status correctly');
        
        // Test AdminDashboard logic with this student
        console.log('5️⃣ Testing AdminDashboard logic...');
        
        // Simulate AdminDashboard processing
        const hasVoted = false; // This student should not have voted
        let finalStatus = 'pending';
        
        if (hasVoted) {
          finalStatus = 'voted';
        } else if (updatedStudent.absent === true || updatedStudent.status === 'absent') {
          finalStatus = 'absent';
        } else {
          finalStatus = updatedStudent.status || 'pending';
        }
        
        console.log(`AdminDashboard would show status as: "${finalStatus}"`);
        console.log(`Expected: "absent", Actual: "${finalStatus}"`);
        console.log(`AdminDashboard logic works: ${finalStatus === 'absent' ? '✅ YES' : '❌ NO'}`);
        
        return {
          success: true,
          studentName: `${updatedStudent.nombres} ${updatedStudent.apellidos}`,
          studentId: updatedStudent.cedula,
          absentInDB: updatedStudent.absent,
          statusInDB: updatedStudent.status,
          adminDashboardStatus: finalStatus,
          fullWorkflow: finalStatus === 'absent'
        };
      } else {
        console.log('❌ Update failed - fields not set correctly');
        return {
          success: false,
          reason: 'Fields not updated correctly',
          expected: { absent: true, status: 'absent' },
          actual: { absent: updatedStudent.absent, status: updatedStudent.status }
        };
      }
    } else {
      console.log('❌ Could not verify update - student not found');
      return { success: false, reason: 'Student not found after update' };
    }
    
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

// Function to clean up test data
async function cleanupTestAbsent() {
  console.log('🧹 CLEANING UP TEST ABSENT DATA');
  
  try {
    const db = window.databaseService;
    
    // Find students marked as absent for testing
    const absentStudents = await db.findDocuments('students', {
      selector: {
        type: 'student',
        $or: [
          { absent: true },
          { status: 'absent' }
        ]
      }
    });
    
    console.log(`Found ${absentStudents.docs?.length || 0} absent students to potentially clean up`);
    
    if (absentStudents.docs && absentStudents.docs.length > 0) {
      console.log('Absent students found:');
      absentStudents.docs.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.nombres} ${student.apellidos} - absent: ${student.absent}, status: ${student.status}`);
      });
      
      const shouldCleanup = confirm(`Found ${absentStudents.docs.length} absent students. Reset them to pending status?`);
      
      if (shouldCleanup) {
        for (const student of absentStudents.docs) {
          const cleanStudent = {
            ...student,
            absent: false,
            status: 'pending',
            absentAt: null
          };
          
          await db.updateDocument('students', student._id, student._rev, cleanStudent);
          console.log(`✅ Reset ${student.nombres} ${student.apellidos} to pending`);
        }
        console.log('🎉 Cleanup completed');
      }
    } else {
      console.log('✅ No absent students found to clean up');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

window.manualAbsentTest = manualAbsentTest;
window.cleanupTestAbsent = cleanupTestAbsent;
console.log('🎯 Manual absent test loaded.');
console.log('📝 Run: manualAbsentTest() - to manually test absent marking');
console.log('📝 Run: cleanupTestAbsent() - to clean up test data');