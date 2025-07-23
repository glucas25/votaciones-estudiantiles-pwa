// Check admin filtering functionality
// Run this after AdminDashboard loads to verify student filtering works

async function checkAdminFiltering() {
  console.log('🔍 CHECKING ADMIN DASHBOARD FILTERING');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    // Get the data as AdminDashboard would
    const votes = await db.findDocuments('votes', { selector: { type: 'vote' } });
    const students = await db.findDocuments('students', { selector: { type: 'student' } });
    
    console.log(`📊 Raw data: ${students.docs?.length || 0} students, ${votes.docs?.length || 0} votes`);
    
    if (!votes.docs || !students.docs) {
      console.log('⚠️ Missing data');
      return;
    }
    
    // Apply the AdminDashboard sync logic
    const votedStudentIds = new Set(votes.docs.map(vote => vote.studentId));
    console.log('👤 Voted student IDs:', Array.from(votedStudentIds));
    
    const updatedStudents = students.docs.map(student => {
      const studentId = student._id || student.id || student.cedula;
      let hasVoted = votedStudentIds.has(studentId);
      
      // Apply backup matching
      if (!hasVoted) {
        hasVoted = hasVoted || votedStudentIds.has(student._id);
        hasVoted = hasVoted || votedStudentIds.has(student.id);  
        hasVoted = hasVoted || votedStudentIds.has(student.cedula);
        
        if (!hasVoted && student.cedula) {
          const cedulaVotes = Array.from(votedStudentIds).filter(voteId => 
            voteId.includes(student.cedula)
          );
          hasVoted = cedulaVotes.length > 0;
        }
      }
      
      return {
        ...student,
        status: hasVoted ? 'voted' : (student.status || 'pending'),
        votado: hasVoted ? true : (student.votado || false)
      };
    });
    
    // Now test the StudentManager filtering logic
    const votedStudents = updatedStudents.filter(student => {
      const studentStatus = student.status || 'pending';
      return studentStatus === 'voted';
    });
    
    console.log('✅ FILTERING TEST RESULTS:');
    console.log(`Total students: ${updatedStudents.length}`);
    console.log(`Students with status='voted': ${votedStudents.length}`);
    console.log(`Vote records in database: ${votes.docs.length}`);
    
    if (votedStudents.length > 0) {
      console.log('📋 Sample voted students:');
      votedStudents.slice(0, 3).forEach(student => {
        console.log(`  - ${student.nombres} ${student.apellidos} (${student.cedula}) - Status: ${student.status}`);
      });
    }
    
    // Verify the filtering would work
    const shouldWork = votedStudents.length === votes.docs.length;
    console.log(`🎯 Filter accuracy: ${shouldWork ? '✅ PERFECT' : '⚠️ PARTIAL'} (${votedStudents.length}/${votes.docs.length})`);
    
    return {
      totalStudents: updatedStudents.length,
      votedStudents: votedStudents.length,
      voteRecords: votes.docs.length,
      filteringWorks: shouldWork,
      sampleVotedStudents: votedStudents.slice(0, 3).map(s => ({
        name: `${s.nombres} ${s.apellidos}`,
        cedula: s.cedula,
        status: s.status
      }))
    };
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    return { error: error.message };
  }
}

window.checkAdminFiltering = checkAdminFiltering;
console.log('🔍 Admin filtering check loaded. Run: checkAdminFiltering()');