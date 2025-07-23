// Quick test script to verify student voting status synchronization
// Run this in browser console when the app is loaded

async function testStudentVotingSync() {
  console.log('🧪 TESTING STUDENT VOTING SYNC');
  
  try {
    // Get the database service from window
    if (!window.databaseService) {
      console.error('❌ Database service not available on window');
      return;
    }
    
    const db = window.databaseService;
    
    // 1. Check votes in database
    console.log('1️⃣ Checking votes in database...');
    const votesResult = await db.findDocuments('votes', {
      selector: { type: 'vote' }
    });
    
    console.log(`Found ${votesResult.docs?.length || 0} votes in database:`, votesResult.docs);
    
    if (!votesResult.docs || votesResult.docs.length === 0) {
      console.log('⚠️ No votes found - test cannot continue');
      return {
        votes: 0,
        studentsVoted: 0,
        issue: 'No votes in database'
      };
    }
    
    // 2. Check student status for voted students
    console.log('2️⃣ Checking student status for voted students...');
    const votedStudentIds = votesResult.docs.map(v => v.studentId);
    console.log('Student IDs who voted:', votedStudentIds);
    
    let studentsWithCorrectStatus = 0;
    let studentsWithWrongStatus = 0;
    
    for (const studentId of votedStudentIds) {
      const studentResult = await db.findDocuments('students', {
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
      
      if (studentResult.docs && studentResult.docs.length > 0) {
        const student = studentResult.docs[0];
        const isMarkedAsVoted = student.votado === true || student.status === 'voted';
        console.log(`Student ${studentId}:`, {
          votado: student.votado,
          status: student.status,
          isMarkedAsVoted
        });
        
        if (isMarkedAsVoted) {
          studentsWithCorrectStatus++;
        } else {
          studentsWithWrongStatus++;
          console.warn(`⚠️ Student ${studentId} voted but not marked as voted in database`);
        }
      } else {
        console.error(`❌ Student ${studentId} not found in database`);
      }
    }
    
    // 3. Summary
    console.log('📊 SYNC TEST RESULTS:');
    console.log(`Total votes: ${votesResult.docs.length}`);
    console.log(`Students correctly marked as voted: ${studentsWithCorrectStatus}`);
    console.log(`Students incorrectly still pending: ${studentsWithWrongStatus}`);
    
    return {
      votes: votesResult.docs.length,
      studentsCorrect: studentsWithCorrectStatus,
      studentsWrong: studentsWithWrongStatus,
      success: studentsWithWrongStatus === 0
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error: error.message };
  }
}

// Make function available globally
window.testStudentVotingSync = testStudentVotingSync;
console.log('✅ Test function loaded. Run: testStudentVotingSync()');