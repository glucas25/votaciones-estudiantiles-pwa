// Test absent functionality after fixing updateDocument parameters
// Run this in browser console after the fix

async function testAbsentFunctionality() {
  console.log("🧪 TESTING ABSENT FUNCTIONALITY AFTER FIX");
  
  try {
    const db = window.databaseService;
    if (\!db) {
      console.log("❌ Database service not available");
      return { success: false, error: "Database not available" };
    }
    
    console.log("1️⃣ Testing updateDocument function parameters...");
    
    // Get a student for testing
    console.log("2️⃣ Finding a student to test with...");
    const studentsResult = await db.findDocuments("students", {
      selector: { type: "student" },
      limit: 1
    });
    
    if (\!studentsResult.docs || studentsResult.docs.length === 0) {
      console.log("❌ No students found for testing");
      return { success: false, error: "No students available" };
    }
    
    const testStudent = studentsResult.docs[0];
    console.log(`Selected test student: ${testStudent.nombres} ${testStudent.apellidos}`);
    
    console.log("3️⃣ Testing absent marking logic...");
    
    // Test absent marking with correct parameters
    const absentUpdateData = {
      ...testStudent,
      absent: true,
      status: "absent",
      absentAt: new Date().toISOString(),
      votado: false
    };
    
    try {
      await db.updateDocument("students", absentUpdateData);
      console.log("✅ Absent marking succeeded");
      
      return {
        success: true,
        message: "Absent functionality working correctly",
        studentTested: `${testStudent.nombres} ${testStudent.apellidos}`,
        fixApplied: "updateDocument now uses 2 parameters instead of 4"
      };
    } catch (error) {
      console.log("❌ Absent marking failed:", error.message);
      return { success: false, error: "Absent marking failed", details: error.message };
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { success: false, error: error.message };
  }
}

window.testAbsentFunctionality = testAbsentFunctionality;
console.log("🧪 Absent functionality test loaded");
console.log("📝 Run: testAbsentFunctionality() - to test the fix");
