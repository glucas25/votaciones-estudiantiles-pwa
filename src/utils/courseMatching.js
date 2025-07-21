// src/utils/courseMatching.js
// Utility functions for matching course names flexibly

/**
 * Normalize course name for comparison
 */
export const normalizeCourse = (course) => {
  if (!course) return '';
  
  return course
    .toLowerCase()
    .trim()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Normalize common variations
    .replace(/\bprimero\b/g, '1ro')
    .replace(/\bsegundo\b/g, '2do')
    .replace(/\btercero\b/g, '3ro')
    .replace(/\bcuarto\b/g, '4to')
    .replace(/\bquinto\b/g, '5to')
    .replace(/\bsexto\b/g, '6to')
    .replace(/\bseptimo\b/g, '7mo')
    .replace(/\boctavo\b/g, '8vo')
    .replace(/\bnoveno\b/g, '9no')
    .replace(/\bdecimo\b/g, '10mo')
    // Handle bachillerato variations
    .replace(/\bbachillerato\b/g, 'bach')
    .replace(/\bbach\.\b/g, 'bach')
    // Remove articles
    .replace(/\bde\b/g, '')
    .replace(/\bla\b/g, '')
    .replace(/\bel\b/g, '')
    // Clean up
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Check if two course names match (flexible matching)
 */
export const coursesMatch = (course1, course2) => {
  if (!course1 || !course2) return false;
  
  const normalized1 = normalizeCourse(course1);
  const normalized2 = normalizeCourse(course2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Partial matches for common patterns
  const patterns = [
    // "1ro Bach A" vs "Primero Bach A"
    /^(\d+)(ro|do|to|vo|mo|no)\s+(bach|bachillerato)\s+([ab])$/,
    // "8vo A" vs "Octavo A"  
    /^(\d+)(ro|do|to|vo|mo|no)\s+([ab])$/,
    // "1ero A" vs "1ro A"
    /^(\d+)(ero|ro)\s+([ab])$/
  ];
  
  for (const pattern of patterns) {
    const match1 = normalized1.match(pattern);
    const match2 = normalized2.match(pattern);
    
    if (match1 && match2) {
      // Compare the significant parts
      return match1[1] === match2[1] && // Grade number
             (match1[3] || match1[4]) === (match2[3] || match2[4]); // Section letter
    }
  }
  
  return false;
};

/**
 * Find the best matching course from a list
 */
export const findMatchingCourse = (targetCourse, availableCourses) => {
  if (!targetCourse || !availableCourses) return null;
  
  // Try exact match first
  const exactMatch = availableCourses.find(course => 
    course.toLowerCase().trim() === targetCourse.toLowerCase().trim()
  );
  if (exactMatch) return exactMatch;
  
  // Try flexible matching
  const flexibleMatch = availableCourses.find(course => 
    coursesMatch(course, targetCourse)
  );
  if (flexibleMatch) return flexibleMatch;
  
  return null;
};

/**
 * Generate course suggestions based on available courses
 */
export const generateCourseSuggestions = (targetCourse, availableCourses) => {
  if (!targetCourse || !availableCourses) return [];
  
  const suggestions = [];
  const normalized = normalizeCourse(targetCourse);
  
  for (const course of availableCourses) {
    const courseNormalized = normalizeCourse(course);
    
    // Score based on similarity
    let score = 0;
    
    // Exact match
    if (courseNormalized === normalized) score = 100;
    // Contains target
    else if (courseNormalized.includes(normalized)) score = 80;
    // Target contains course
    else if (normalized.includes(courseNormalized)) score = 70;
    // Flexible match
    else if (coursesMatch(course, targetCourse)) score = 90;
    
    if (score > 0) {
      suggestions.push({ course, score });
    }
  }
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .map(s => s.course);
};