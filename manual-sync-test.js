// Manual sync test - run this in browser console when app is loaded
// This will force a sync between votes and students

async function manualSyncTest() {
  console.log('🔧 MANUAL SYNC TEST STARTING');
  
  try {
    // Get database service
    const db = window.databaseService;
    if (!db || !db.isReady()) {
      console.error('❌ Database not available or not ready');
      return;
    }
    
    console.log('1️⃣ Getting all votes...');
    const votesResult = await db.findDocuments('votes', {
      selector: { type: 'vote' }
    });
    
    console.log(`Found ${votesResult.docs?.length || 0} votes:`, votesResult.docs);
    
    if (!votesResult.docs || votesResult.docs.length === 0) {
      console.log('⚠️ No votes to sync');
      return { success: false, reason: 'No votes found' };
    }
    
    console.log('2️⃣ Processing each vote...');
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    for (const vote of votesResult.docs) {
      processed++;
      console.log(`Processing vote ${processed}/${votesResult.docs.length} for student ${vote.studentId}`);
      
      try {
        // Find student
        const studentResult = await db.findDocuments('students', {
          selector: {
            type: 'student',
            $or: [
              { _id: vote.studentId },
              { id: vote.studentId },
              { cedula: vote.studentId }
            ]
          },
          limit: 1
        });
        
        if (studentResult.docs && studentResult.docs.length > 0) {
          const student = studentResult.docs[0];
          console.log(`Found student: ${student.nombres} ${student.apellidos} (votado: ${student.votado})`);
          
          if (!student.votado) {
            // Update student
            const updatedStudent = {
              ...student,
              votado: true,
              status: 'voted',
              votedAt: vote.timestamp
            };
            
            await db.updateDocument('students', student._id, student._rev, updatedStudent);
            console.log(`✅ Updated student ${vote.studentId} as voted`);
            updated++;
          } else {
            console.log(`📝 Student ${vote.studentId} already marked as voted`);
          }
        } else {
          console.warn(`⚠️ No student found for vote studentId: ${vote.studentId}`);
        }
      } catch (error) {
        console.error(`❌ Error processing vote for ${vote.studentId}:`, error);
        errors++;
      }
    }
    
    console.log('✅ MANUAL SYNC COMPLETE');
    console.log(`📊 Results: ${processed} processed, ${updated} updated, ${errors} errors`);
    
    return {
      success: true,
      processed,
      updated,
      errors
    };
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Make function available globally
window.manualSyncTest = manualSyncTest;
console.log('🔧 Manual sync function loaded. Run: manualSyncTest()');