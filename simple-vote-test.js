// Simple test to simulate the vote to student matching issue
// Run this in browser console

function simulateVoteMatchingIssue() {
  console.log('🧪 SIMULATING VOTE MATCHING ISSUE');
  
  // Simulate student data as it would appear in the system
  const sampleStudents = [
    { _id: 'student_12345_1753046957116_abc123', id: 'student_12345', cedula: '12345' },
    { _id: 'student_67890_1753046957116_def456', id: 'student_67890', cedula: '67890' }
  ];
  
  // Simulate how getStudentId works
  const getStudentId = (student) => {
    return student._id || student.id || student.cedula;
  };
  
  // Simulate vote creation
  const student1 = sampleStudents[0];
  const voteStudentId = getStudentId(student1);
  console.log('Vote would be created with studentId:', voteStudentId);
  
  // Simulate course filtering - this is where the issue likely occurs
  const studentIdsInCourse = sampleStudents.map(s => getStudentId(s));
  console.log('Student IDs for course filtering:', studentIdsInCourse);
  
  // Simulate vote filtering (this is the problematic line)
  const sampleVotes = [
    { _id: 'vote_1', studentId: voteStudentId }
  ];
  
  const matchingVotes = sampleVotes.filter(vote => studentIdsInCourse.includes(vote.studentId));
  console.log('Matching votes found:', matchingVotes.length);
  
  if (matchingVotes.length > 0) {
    console.log('✅ Vote matching would work correctly');
  } else {
    console.log('❌ Vote matching would FAIL - this is likely the issue');
    console.log('Vote studentId:', sampleVotes[0].studentId);
    console.log('Course student IDs:', studentIdsInCourse);
  }
  
  return {
    voteStudentId,
    courseStudentIds: studentIdsInCourse,
    matchFound: matchingVotes.length > 0
  };
}

window.simulateVoteMatchingIssue = simulateVoteMatchingIssue;
console.log('🧪 Test loaded. Run: simulateVoteMatchingIssue()');