// src/utils/studentValidation.js
// Advanced student data validation with Ecuador ID validation

import educationLevelsService from '../services/educationLevels.js';

// Education levels mapping
export const EDUCATION_LEVELS = {
  'PREPARATORIA': 'PREPARATORIA',
  'BASICA_ELEMENTAL': 'BASICA_ELEMENTAL',
  'BASICA_MEDIA': 'BASICA_MEDIA', 
  'BASICA_SUPERIOR': 'BASICA_SUPERIOR',
  'BACHILLERATO': 'BACHILLERATO',
  // Alternative mappings for import
  'ELEMENTAL': 'BASICA_ELEMENTAL',
  'MEDIA': 'BASICA_MEDIA',
  'SUPERIOR': 'BASICA_SUPERIOR',
  'BACH': 'BACHILLERATO'
};

// Course patterns removed - now accepts any course format

/**
 * Validates ID (simplified - no Ecuador algorithm validation)
 * Accepts any numeric identifier
 */
export const validateID = (cedula) => {
  if (!cedula) {
    return { valid: false, error: 'Cédula/ID es requerida' };
  }

  // Convert to string and clean
  const cleanCedula = String(cedula).trim();
  
  if (cleanCedula.length === 0) {
    return { valid: false, error: 'Cédula/ID no puede estar vacía' };
  }

  // Accept any format - just clean and normalize
  const normalized = cleanCedula.replace(/\s+/g, ''); // Remove extra spaces
  
  return { valid: true, cleaned: normalized };
};

/**
 * Enhanced name validation with comprehensive Spanish character support
 * Supports all Latin characters, tildes, diaeresis, and special Spanish characters
 */
export const validateAndNormalizeName = (name, fieldName = 'Nombre') => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} es requerido` };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} debe tener al menos 2 caracteres` };
  }

  if (trimmed.length > 60) {
    return { valid: false, error: `${fieldName} no puede exceder 60 caracteres` };
  }

  // Comprehensive Spanish character pattern
  // Includes: basic letters, all accented vowels, ñ, ü, spaces, apostrophes, hyphens, dots
  const namePattern = /^[a-zÀ-ÿ\s'\-\.]+$/i;
  
  // Check for invalid characters
  if (!namePattern.test(trimmed)) {
    // Get the invalid characters for better error messages
    const invalidChars = getInvalidCharacters(trimmed);
    return { 
      valid: false, 
      error: `${fieldName} contiene caracteres inválidos: ${invalidChars.join(', ')}. Solo se permiten letras, tildes, espacios, apóstrofes, guiones y puntos.` 
    };
  }

  // Check for suspicious patterns
  if (hasInvalidPatterns(trimmed)) {
    return {
      valid: false,
      error: `${fieldName} contiene patrones no válidos (números consecutivos, símbolos especiales, etc.)`
    };
  }

  // Clean and normalize the name
  const cleaned = cleanNameString(trimmed);
  
  // Normalize: title case and remove extra spaces
  const normalized = cleaned
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .filter(word => word.length > 0)
    .join(' ');

  return { valid: true, normalized, original: name, cleaned };
};

/**
 * Extract invalid characters from a string for detailed error reporting
 */
function getInvalidCharacters(str) {
  const validPattern = /[a-zÀ-ÿ\s'\-\.]/i;
  const invalidChars = new Set();
  
  for (let char of str) {
    if (!validPattern.test(char)) {
      invalidChars.add(char);
    }
  }
  
  return Array.from(invalidChars);
}

/**
 * Check for patterns that suggest invalid names
 */
function hasInvalidPatterns(str) {
  // Pattern checks for obviously invalid names
  const invalidPatterns = [
    /\d{2,}/, // Multiple consecutive numbers
    /[!@#$%^&*()_+=\[\]{};:"<>?|\\]/, // Special symbols
    /\s{3,}/, // Multiple consecutive spaces (after trim should not happen)
    /^[\s'\-\.]+$/, // Only punctuation
    /^.{1}$/, // Single character (handled by length check but double-check)
    /([a-z])\1{4,}/i // Same letter repeated 5+ times
  ];
  
  return invalidPatterns.some(pattern => pattern.test(str));
}

/**
 * Clean common encoding issues and invisible characters
 */
function cleanNameString(str) {
  return str
    // Remove invisible/zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize smart quotes to regular apostrophes
    .replace(/[‘’]/g, "'")
    // Normalize different dash types to regular hyphen
    .replace(/[–—]/g, '-')
    // Remove any remaining control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates course format (flexible - accepts any format)
 */
export const validateCourse = (course, level) => {
  if (!course || typeof course !== 'string') {
    return { valid: false, error: 'Curso es requerido' };
  }

  const trimmed = course.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Curso no puede estar vacío' };
  }

  // Accept any course format - just normalize spacing
  const normalized = trimmed.replace(/\s+/g, ' '); // Clean up extra spaces

  return { valid: true, normalized };
};

/**
 * Validates education level using configurable service
 */
export const validateEducationLevel = (level) => {
  if (!level || typeof level !== 'string') {
    return { valid: false, error: 'Nivel educativo es requerido' };
  }

  const trimmed = level.trim().toUpperCase();
  
  // First check static levels for backward compatibility
  if (EDUCATION_LEVELS[trimmed]) {
    return { 
      valid: true, 
      normalized: EDUCATION_LEVELS[trimmed],
      displayName: educationLevelsService.getDisplayName(trimmed)
    };
  }
  
  // Then check configurable service
  if (educationLevelsService.isValidEducationLevel(trimmed)) {
    return { 
      valid: true, 
      normalized: trimmed,
      displayName: educationLevelsService.getDisplayName(trimmed)
    };
  }
  
  // Generate helpful error message
  const availableLevels = educationLevelsService.getEducationLevelsForForm();
  const levelNames = availableLevels.map(l => `${l.label} (${l.value})`).join(', ');
  
  return { 
    valid: false, 
    error: `Nivel educativo inválido. Debe ser uno de: ${levelNames}` 
  };
};

/**
 * Validates academic year
 */
export const validateYear = (year) => {
  if (!year) {
    return { valid: false, error: 'Año es requerido' };
  }

  const numericYear = parseInt(year);
  const currentYear = new Date().getFullYear();

  if (isNaN(numericYear)) {
    return { valid: false, error: 'Año debe ser un número' };
  }

  if (numericYear < 2020 || numericYear > currentYear + 1) {
    return { 
      valid: false, 
      error: `Año debe estar entre 2020 y ${currentYear + 1}` 
    };
  }

  return { valid: true, normalized: numericYear };
};

/**
 * Comprehensive student validation
 */
export const validateStudent = (studentData, existingCedulas = new Set()) => {
  console.log('🔍 Validating student:', studentData);
  
  const errors = [];
  const warnings = [];
  const normalized = {};

  // Validate cedula
  console.log('📋 Validating cedula:', studentData.cedula);
  const cedulaResult = validateID(studentData.cedula);
  console.log('🔍 Cedula validation result:', cedulaResult);
  
  if (!cedulaResult.valid) {
    errors.push(`Cédula: ${cedulaResult.error}`);
  } else {
    // Check for duplicates
    if (existingCedulas.has(cedulaResult.cleaned)) {
      errors.push('Cédula: Ya existe un estudiante con esta cédula');
    } else {
      normalized.cedula = cedulaResult.cleaned;
    }
  }

  // Validate nombres
  const nombresResult = validateAndNormalizeName(studentData.nombres, 'Nombres');
  if (!nombresResult.valid) {
    errors.push(`Nombres: ${nombresResult.error}`);
  } else {
    normalized.nombres = nombresResult.normalized;
  }

  // Validate apellidos
  const apellidosResult = validateAndNormalizeName(studentData.apellidos, 'Apellidos');
  if (!apellidosResult.valid) {
    errors.push(`Apellidos: ${apellidosResult.error}`);
  } else {
    normalized.apellidos = apellidosResult.normalized;
  }

  // Validate education level
  const levelResult = validateEducationLevel(studentData.nivel);
  if (!levelResult.valid) {
    errors.push(`Nivel: ${levelResult.error}`);
  } else {
    normalized.nivel = levelResult.normalized;
  }

  // Validate course (depends on level)
  console.log('🏫 Validating course:', studentData.curso, 'for level:', normalized.nivel);
  if (normalized.nivel) {
    const courseResult = validateCourse(studentData.curso, normalized.nivel);
    console.log('🔍 Course validation result:', courseResult);
    if (!courseResult.valid) {
      errors.push(`Curso: ${courseResult.error}`);
    } else {
      normalized.curso = courseResult.normalized;
    }
  }

  // Validate year
  const yearResult = validateYear(studentData.año || studentData.year || new Date().getFullYear());
  if (!yearResult.valid) {
    errors.push(`Año: ${yearResult.error}`);
  } else {
    normalized.año = yearResult.normalized;
  }

  // Additional validations
  if (normalized.nombres && normalized.apellidos) {
    const fullName = `${normalized.nombres} ${normalized.apellidos}`;
    if (fullName.length > 100) {
      warnings.push('Nombre completo es muy largo (>100 caracteres)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: errors.length === 0 ? {
      id: `student_${normalized.cedula}`,
      cedula: normalized.cedula,
      nombres: normalized.nombres,
      apellidos: normalized.apellidos,
      curso: normalized.curso,
      nivel: normalized.nivel,
      año: normalized.año,
      created: new Date().toISOString(),
      status: 'pending'
    } : null
  };
};

/**
 * Batch validation for multiple students
 */
export const validateStudentBatch = (studentsArray, onProgress = null) => {
  const results = [];
  const validStudents = [];
  const invalidStudents = [];
  const existingCedulas = new Set();
  
  studentsArray.forEach((student, index) => {
    const result = validateStudent(student, existingCedulas);
    
    results.push({
      index: index + 1,
      originalData: student,
      ...result
    });

    if (result.valid) {
      validStudents.push(result.normalized);
      existingCedulas.add(result.normalized.cedula);
    } else {
      invalidStudents.push({
        index: index + 1,
        data: student,
        errors: result.errors,
        warnings: result.warnings
      });
    }

    // Report progress
    if (onProgress) {
      onProgress({
        processed: index + 1,
        total: studentsArray.length,
        valid: validStudents.length,
        invalid: invalidStudents.length
      });
    }
  });

  return {
    total: studentsArray.length,
    valid: validStudents.length,
    invalid: invalidStudents.length,
    validStudents,
    invalidStudents,
    allResults: results
  };
};

/**
 * Generate validation report
 */
export const generateValidationReport = (validationResults) => {
  const { total, valid, invalid, invalidStudents } = validationResults;
  
  const report = {
    summary: {
      total,
      valid,
      invalid,
      successRate: total > 0 ? Math.round((valid / total) * 100) : 0
    },
    errors: {},
    details: invalidStudents
  };

  // Count error types
  invalidStudents.forEach(student => {
    student.errors.forEach(error => {
      const errorType = error.split(':')[0];
      report.errors[errorType] = (report.errors[errorType] || 0) + 1;
    });
  });

  return report;
};