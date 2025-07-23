// Debug script to identify the sync issue
// Paste this into browser console when app is loaded

async function debugSyncIssue() {
  console.log('🔬 DEBUGGING SYNC ISSUE');
  
  try {
    // Get database service
    const db = window.databaseService || (window.React && window.React.databaseService);
    if (!db) {
      console.error('❌ Database service not found');
      return;
    }
    
    console.log('1️⃣ Getting all votes from database...');
    const allVotes = await db.findDocuments('votes', {});
    console.log('All votes:', allVotes);
    
    console.log('2️⃣ Getting votes with correct type...');
    const typedVotes = await db.findDocuments('votes', {
      selector: { type: 'vote' }
    });
    console.log('Typed votes:', typedVotes);
    
    if (typedVotes.docs && typedVotes.docs.length > 0) {
      console.log('3️⃣ Analyzing vote structure...');
      const firstVote = typedVotes.docs[0];
      console.log('First vote:', firstVote);
      console.log('Student ID from vote:', firstVote.studentId);
      
      console.log('4️⃣ Finding corresponding student...');
      const studentResult = await db.findDocuments('students', {
        selector: {
          type: 'student',
          $or: [
            { _id: firstVote.studentId },
            { id: firstVote.studentId },
            { cedula: firstVote.studentId }
          ]
        }
      });
      
      console.log('Student query result:', studentResult);
      if (studentResult.docs && studentResult.docs.length > 0) {
        const student = studentResult.docs[0];
        console.log('Found student:', {
          _id: student._id,
          id: student.id,
          cedula: student.cedula,
          nombres: student.nombres,
          apellidos: student.apellidos,
          status: student.status,
          votado: student.votado,
          curso: student.curso
        });
        
        console.log('5️⃣ Checking if student should be marked as voted...');
        console.log(`Student voted status: ${student.votado}`);
        console.log(`Student status field: ${student.status}`);
        
        if (!student.votado && student.status !== 'voted') {
          console.log('🔧 ISSUE IDENTIFIED: Student has vote record but is not marked as voted');
          console.log('Vote record exists:', !!firstVote);
          console.log('Student not marked as voted:', !student.votado);
          
          return {
            issue: 'Student has vote but not marked as voted',
            voteId: firstVote._id,
            studentId: student._id,
            votedStatus: student.votado,
            statusField: student.status
          };
        } else {
          console.log('✅ Student is correctly marked as voted');
        }
      } else {
        console.log('❌ No student found for vote');
        return {
          issue: 'Vote exists but student not found',
          voteStudentId: firstVote.studentId
        };
      }
    } else {
      console.log('⚠️ No votes with correct type found');
      
      if (allVotes.docs && allVotes.docs.length > 0) {
        console.log('But there are votes without type field...');
        const voteWithoutType = allVotes.docs[0];
        console.log('Vote without type:', voteWithoutType);
        return {
          issue: 'Votes exist but missing type field',
          sampleVote: voteWithoutType
        };
      }
    }
    
    return { status: 'Debug complete' };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { error: error.message };
  }
}

// Make available globally
window.debugSyncIssue = debugSyncIssue;
console.log('🔬 Debug function loaded. Run: debugSyncIssue()');