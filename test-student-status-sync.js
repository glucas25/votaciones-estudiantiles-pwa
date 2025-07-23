// Test script for student status synchronization
// Run this in browser console after the app loads

async function testStudentStatusSync() {
  console.log('🧪 TESTING STUDENT STATUS SYNC');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    // 1. Get votes from database
    console.log('1️⃣ Getting votes from database...');
    const votes = await db.findDocuments('votes', { selector: { type: 'vote' } });
    console.log(`Found ${votes.docs?.length || 0} votes`);
    
    if (!votes.docs || votes.docs.length === 0) {
      console.log('⚠️ No votes found - cannot test sync');
      return { success: false, reason: 'No votes to test with' };
    }
    
    // 2. Get students from database
    console.log('2️⃣ Getting students from database...');
    const students = await db.findDocuments('students', { selector: { type: 'student' } });
    console.log(`Found ${students.docs?.length || 0} students`);
    
    if (!students.docs || students.docs.length === 0) {
      console.log('⚠️ No students found');
      return { success: false, reason: 'No students to test with' };
    }
    
    // 3. Test the sync function manually
    console.log('3️⃣ Testing updateStudentVotingStatus function...');
    
    // Simulate what AdminDashboard does
    const votedStudentIds = new Set(votes.docs.map(vote => vote.studentId));
    console.log('Vote student IDs:', Array.from(votedStudentIds));
    
    let matchedCount = 0;
    let backupMatchCount = 0;
    
    students.docs.forEach((student, index) => {
      if (index < 10) { // Test first 10 students
        const studentId = student._id || student.id || student.cedula;
        let hasVoted = votedStudentIds.has(studentId);
        
        // Test backup matching
        if (!hasVoted) {
          hasVoted = hasVoted || votedStudentIds.has(student._id);
          hasVoted = hasVoted || votedStudentIds.has(student.id);
          hasVoted = hasVoted || votedStudentIds.has(student.cedula);
          
          if (!hasVoted && student.cedula) {
            const cedulaVotes = Array.from(votedStudentIds).filter(voteId => 
              voteId.includes(student.cedula)
            );
            if (cedulaVotes.length > 0) {
              hasVoted = true;
              backupMatchCount++;
              console.log(`🔄 Backup match: Student ${student.cedula} matched with vote ${cedulaVotes[0]}`);
            }
          }
        } else {
          matchedCount++;
        }
        
        if (hasVoted) {
          console.log(`✅ Student ${studentId} (${student.nombres}) would be marked as voted`);
        }
      }
    });
    
    console.log('📊 TEST RESULTS:');
    console.log(`Total votes: ${votes.docs.length}`);
    console.log(`Direct matches: ${matchedCount}`);
    console.log(`Backup matches: ${backupMatchCount}`);
    console.log(`Total matches: ${matchedCount + backupMatchCount}`);
    
    return {
      success: true,
      votes: votes.docs.length,
      directMatches: matchedCount,
      backupMatches: backupMatchCount,
      totalMatches: matchedCount + backupMatchCount
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

window.testStudentStatusSync = testStudentStatusSync;
console.log('🧪 Test function loaded. Run: testStudentStatusSync()');