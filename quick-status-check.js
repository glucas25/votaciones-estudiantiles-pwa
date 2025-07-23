// Quick status check - run this immediately after app loads
// This will show the current state without waiting for full sync

async function quickStatusCheck() {
  console.log('⚡ QUICK STATUS CHECK');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    // Check votes
    const votes = await db.findDocuments('votes', { selector: { type: 'vote' } });
    console.log(`📊 Total votes in database: ${votes.docs?.length || 0}`);
    
    if (votes.docs && votes.docs.length > 0) {
      console.log('📋 Vote sample:', votes.docs[0]);
      console.log('📋 All vote student IDs:', votes.docs.map(v => v.studentId));
    }
    
    // Check students marked as voted
    const votedStudents = await db.findDocuments('students', { 
      selector: { 
        type: 'student', 
        votado: true 
      } 
    });
    console.log(`👥 Students marked as voted: ${votedStudents.docs?.length || 0}`);
    
    if (votedStudents.docs && votedStudents.docs.length > 0) {
      console.log('👤 Voted students:', votedStudents.docs.map(s => ({ 
        _id: s._id, 
        cedula: s.cedula, 
        nombres: s.nombres 
      })));
    }
    
    // Check for mismatch
    const votesCount = votes.docs?.length || 0;
    const votedStudentsCount = votedStudents.docs?.length || 0;
    
    if (votesCount > votedStudentsCount) {
      console.log('🚨 SYNC ISSUE DETECTED:');
      console.log(`   Votes in database: ${votesCount}`);
      console.log(`   Students marked as voted: ${votedStudentsCount}`);
      console.log(`   Missing sync: ${votesCount - votedStudentsCount} students`);
      
      return {
        issue: true,
        votes: votesCount,
        studentsVoted: votedStudentsCount,
        missing: votesCount - votedStudentsCount
      };
    } else {
      console.log('✅ Sync appears to be working correctly');
      return {
        issue: false,
        votes: votesCount,
        studentsVoted: votedStudentsCount
      };
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return { error: error.message };
  }
}

window.quickStatusCheck = quickStatusCheck;
console.log('⚡ Quick status check loaded. Run: quickStatusCheck()');