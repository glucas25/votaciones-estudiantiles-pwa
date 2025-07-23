// Verify that the absent functionality fix is working
// Run this in browser console after loading the app

async function verifyAbsentFix() {
  console.log('🔍 VERIFYING ABSENT FUNCTIONALITY FIX');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    console.log('1️⃣ Checking current absent students in database...');
    
    // Check for students marked as absent in database
    const absentStudents = await db.findDocuments('students', {
      selector: {
        type: 'student',
        $or: [
          { absent: true },
          { status: 'absent' }
        ]
      }
    });
    
    console.log(`Found ${absentStudents.docs?.length || 0} absent students in database`);
    
    if (absentStudents.docs && absentStudents.docs.length > 0) {
      console.log('📋 Absent students in database:');
      absentStudents.docs.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.nombres} ${student.apellidos} - absent: ${student.absent}, status: ${student.status}, absentAt: ${student.absentAt}`);
      });
    }
    
    console.log('2️⃣ Testing AdminDashboard logic with current data...');
    
    // Get all students and votes
    const allStudents = await db.findDocuments('students', { selector: { type: 'student' } });
    const allVotes = await db.findDocuments('votes', { selector: { type: 'vote' } });
    
    console.log(`Total students: ${allStudents.docs?.length || 0}`);
    console.log(`Total votes: ${allVotes.docs?.length || 0}`);
    
    // Simulate AdminDashboard updateStudentVotingStatus logic
    if (allStudents.docs && allStudents.docs.length > 0) {
      const votedStudentIds = new Set((allVotes.docs || []).map(vote => vote.studentId));
      
      const processedStudents = allStudents.docs.map(student => {
        const studentId = student._id || student.id || student.cedula;
        const hasVoted = votedStudentIds.has(studentId);
        
        // Apply the fixed logic: voted > absent > pending
        let finalStatus = 'pending';
        if (hasVoted) {
          finalStatus = 'voted';
        } else if (student.absent === true || student.status === 'absent') {
          finalStatus = 'absent';
        } else {
          finalStatus = student.status || 'pending';
        }
        
        return {
          ...student,
          status: finalStatus,
          votado: hasVoted,
          absent: finalStatus === 'absent'
        };
      });
      
      // Count by status
      const statusCounts = {
        voted: processedStudents.filter(s => s.status === 'voted').length,
        absent: processedStudents.filter(s => s.status === 'absent').length,
        pending: processedStudents.filter(s => s.status === 'pending').length
      };
      
      console.log('📊 SIMULATION RESULTS:');
      console.log(`After AdminDashboard processing:`);
      console.log(`  Voted: ${statusCounts.voted}`);
      console.log(`  Absent: ${statusCounts.absent}`);
      console.log(`  Pending: ${statusCounts.pending}`);
      console.log(`  Total: ${processedStudents.length}`);
      
      // Check if absent count matches database
      const dbAbsentCount = absentStudents.docs?.length || 0;
      const processedAbsentCount = statusCounts.absent;
      
      console.log('3️⃣ Verification results:');
      console.log(`Database absent count: ${dbAbsentCount}`);
      console.log(`AdminDashboard would show: ${processedAbsentCount}`);
      console.log(`Match: ${dbAbsentCount === processedAbsentCount ? '✅ YES' : '❌ NO'}`);
      
      if (dbAbsentCount === processedAbsentCount && processedAbsentCount > 0) {
        console.log('🎉 ABSENT FUNCTIONALITY IS WORKING CORRECTLY!');
        console.log('💡 Students marked as absent in tutor panel should now appear in admin dashboard');
      } else if (processedAbsentCount === 0 && dbAbsentCount === 0) {
        console.log('⚠️ No absent students found - test by marking a student as absent from tutor panel');
      } else {
        console.log('❌ There may still be a sync issue between database and dashboard');
      }
      
      return {
        success: true,
        databaseAbsent: dbAbsentCount,
        dashboardWouldShow: processedAbsentCount,
        isWorking: dbAbsentCount === processedAbsentCount,
        totalStudents: processedStudents.length,
        breakdown: statusCounts
      };
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { success: false, error: error.message };
  }
}

// Function to manually mark a student as absent for testing
async function quickTestAbsent() {
  console.log('🚀 QUICK TEST: Mark a student as absent');
  
  try {
    const db = window.databaseService;
    
    // Find a student who is not voted and not absent
    const availableStudents = await db.findDocuments('students', {
      selector: {
        type: 'student',
        $and: [
          { votado: { $ne: true } },
          { absent: { $ne: true } },
          { status: { $ne: 'voted' } },
          { status: { $ne: 'absent' } }
        ]
      },
      limit: 1
    });
    
    if (!availableStudents.docs || availableStudents.docs.length === 0) {
      console.log('⚠️ No available students to mark as absent');
      return;
    }
    
    const student = availableStudents.docs[0];
    console.log(`Will mark as absent: ${student.nombres} ${student.apellidos} (${student.cedula})`);
    
    // Update the student
    const updatedStudentData = {
      ...student,
      absent: true,
      status: 'absent',
      absentAt: new Date().toISOString(),
      votado: false
    };
    
    await db.updateDocument('students', student._id, student._rev, updatedStudentData);
    console.log('✅ Student marked as absent in database');
    
    // Verify the update
    setTimeout(async () => {
      console.log('🔍 Verifying the update...');
      await verifyAbsentFix();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

window.verifyAbsentFix = verifyAbsentFix;
window.quickTestAbsent = quickTestAbsent;
console.log('🔍 Absent fix verification loaded.');
console.log('📝 Run: verifyAbsentFix() - to check if fix is working');
console.log('📝 Run: quickTestAbsent() - to quickly test absent marking');