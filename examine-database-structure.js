// Examine database structure for student documents
// Run this in browser console after app loads

async function examineStudentStructure() {
  console.log('🔍 EXAMINING DATABASE STRUCTURE FOR STUDENTS');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    console.log('1️⃣ Getting all student documents...');
    const allStudents = await db.findDocuments('students', { 
      selector: { type: 'student' } 
    });
    
    console.log(`Found ${allStudents.docs?.length || 0} student documents`);
    
    if (!allStudents.docs || allStudents.docs.length === 0) {
      console.log('⚠️ No student documents found');
      return { success: false, reason: 'No students in database' };
    }
    
    console.log('2️⃣ Analyzing document structure...');
    
    // Get first few students to analyze structure
    const sampleStudents = allStudents.docs.slice(0, 5);
    console.log('📋 Sample student documents:');
    
    sampleStudents.forEach((student, index) => {
      console.log(`\nStudent ${index + 1}: ${student.nombres} ${student.apellidos}`);
      console.log('Available fields:', Object.keys(student));
      console.log('Document structure:', {
        _id: student._id,
        _rev: student._rev,
        type: student.type,
        nombres: student.nombres,
        apellidos: student.apellidos,
        cedula: student.cedula,
        curso: student.curso,
        nivel: student.nivel,
        // Status fields
        status: student.status,
        absent: student.absent,
        votado: student.votado,
        // Timestamps
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        absentAt: student.absentAt,
        votedAt: student.votedAt
      });
    });
    
    console.log('3️⃣ Checking for existing absent students...');
    
    // Check for students with absent field set to true
    const absentByField = allStudents.docs.filter(s => s.absent === true);
    console.log(`Students with absent=true: ${absentByField.length}`);
    
    // Check for students with status field set to 'absent'
    const absentByStatus = allStudents.docs.filter(s => s.status === 'absent');
    console.log(`Students with status='absent': ${absentByStatus.length}`);
    
    // Check for students with absentAt timestamp
    const absentWithTimestamp = allStudents.docs.filter(s => s.absentAt);
    console.log(`Students with absentAt timestamp: ${absentWithTimestamp.length}`);
    
    console.log('4️⃣ Field analysis...');
    
    // Analyze all unique field names
    const allFields = new Set();
    const fieldCounts = {};
    
    allStudents.docs.forEach(student => {
      Object.keys(student).forEach(field => {
        allFields.add(field);
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
    });
    
    console.log('All unique fields found in student documents:');
    Array.from(allFields).sort().forEach(field => {
      console.log(`  ${field}: present in ${fieldCounts[field]}/${allStudents.docs.length} documents`);
    });
    
    console.log('5️⃣ Status field analysis...');
    
    // Analyze status field values
    const statusValues = {};
    allStudents.docs.forEach(student => {
      const status = student.status || 'undefined';
      statusValues[status] = (statusValues[status] || 0) + 1;
    });
    
    console.log('Status field values:');
    Object.entries(statusValues).forEach(([status, count]) => {
      console.log(`  "${status}": ${count} students`);
    });
    
    console.log('6️⃣ Database update capability test...');
    
    // Check if we can find a student with proper _id and _rev for update
    const studentWithIds = allStudents.docs.find(s => s._id && s._rev);
    if (studentWithIds) {
      console.log('✅ Students have proper _id and _rev fields for updates');
      console.log('Sample IDs:', {
        _id: studentWithIds._id,
        _rev: studentWithIds._rev,
        hasRequiredFields: !!(studentWithIds._id && studentWithIds._rev)
      });
    } else {
      console.log('❌ Students missing _id or _rev fields - updates will fail');
    }
    
    return {
      success: true,
      totalStudents: allStudents.docs.length,
      sampleFields: Object.keys(sampleStudents[0]),
      absentByField: absentByField.length,
      absentByStatus: absentByStatus.length,
      absentWithTimestamp: absentWithTimestamp.length,
      allFields: Array.from(allFields),
      statusValues: statusValues,
      hasUpdateCapability: !!studentWithIds
    };
    
  } catch (error) {
    console.error('❌ Examination failed:', error);
    return { success: false, error: error.message };
  }
}

// Also create a function to test updating a student record
async function testStudentUpdate() {
  console.log('🧪 TESTING STUDENT UPDATE CAPABILITY');
  
  try {
    const db = window.databaseService;
    if (!db) {
      console.log('❌ Database not available yet');
      return;
    }
    
    // Get a student to test with
    const students = await db.findDocuments('students', { 
      selector: { type: 'student' },
      limit: 1
    });
    
    if (!students.docs || students.docs.length === 0) {
      console.log('⚠️ No students available for testing');
      return;
    }
    
    const testStudent = students.docs[0];
    console.log(`Testing with student: ${testStudent.nombres} ${testStudent.apellidos}`);
    console.log('Original document:', {
      _id: testStudent._id,
      _rev: testStudent._rev,
      absent: testStudent.absent,
      status: testStudent.status,
      absentAt: testStudent.absentAt
    });
    
    // Test the update (without actually changing anything critical)
    const testUpdate = {
      ...testStudent,
      testField: 'test_value_' + Date.now(),
      lastTestUpdate: new Date().toISOString()
    };
    
    console.log('Attempting update...');
    await db.updateDocument('students', testStudent._id, testStudent._rev, testUpdate);
    console.log('✅ Update successful');
    
    // Verify the update
    const updatedResult = await db.findDocuments('students', {
      selector: {
        type: 'student',
        _id: testStudent._id
      },
      limit: 1
    });
    
    if (updatedResult.docs && updatedResult.docs.length > 0) {
      const updatedStudent = updatedResult.docs[0];
      console.log('Updated document:', {
        _id: updatedStudent._id,
        _rev: updatedStudent._rev,
        testField: updatedStudent.testField,
        lastTestUpdate: updatedStudent.lastTestUpdate
      });
      
      console.log('🎉 DATABASE UPDATE CAPABILITY CONFIRMED');
      return { success: true, updateWorking: true };
    }
    
  } catch (error) {
    console.error('❌ Update test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, updateWorking: false };
  }
}

window.examineStudentStructure = examineStudentStructure;
window.testStudentUpdate = testStudentUpdate;
console.log('🔍 Database structure examination loaded.');
console.log('📝 Run: examineStudentStructure() - to examine student document structure');
console.log('📝 Run: testStudentUpdate() - to test database update capability');