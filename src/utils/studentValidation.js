// src/utils/studentValidation.js
// Advanced student data validation with Ecuador ID validation

// Education levels mapping
export const EDUCATION_LEVELS = {
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

// Course patterns by education level
const COURSE_PATTERNS = {
  BASICA_ELEMENTAL: /^[1-4]to\s+[A-Z]$/i, // 1ro A, 2do B, etc.
  BASICA_MEDIA: /^[5-7]mo\s+[A-Z]$/i,    // 5to A, 6to B, 7mo A, etc.
  BASICA_SUPERIOR: /^[8-9]vo\s+[A-Z]$|^10mo\s+[A-Z]$/i, // 8vo A, 9no A, 10mo A
  BACHILLERATO: /^[1-3]ro\s+Bach\s+[A-Z]$/i // 1ro Bach A, 2do Bach B, etc.
};

/**
 * Validates Ecuadorian national ID (cedula)
 * Algorithm based on Ecuador's official validation rules
 */
export const validateEcuadorianID = (cedula) => {
  if (!cedula || typeof cedula !== 'string') {
    return { valid: false, error: 'Cédula es requerida' };
  }

  // Remove any non-numeric characters
  const cleanCedula = cedula.replace(/\D/g, '');
  
  if (cleanCedula.length !== 10) {
    return { valid: false, error: 'Cédula debe tener exactamente 10 dígitos' };
  }

  // Province code validation (first 2 digits: 01-24, 30)
  const provinceCode = parseInt(cleanCedula.substring(0, 2));
  if ((provinceCode < 1 || provinceCode > 24) && provinceCode !== 30) {
    return { valid: false, error: 'Código de provincia inválido en cédula' };
  }

  // Third digit must be less than 6 for natural persons
  const thirdDigit = parseInt(cleanCedula.charAt(2));
  if (thirdDigit >= 6) {
    return { valid: false, error: 'Cédula no corresponde a persona natural' };
  }

  // Validate check digit using Ecuador's algorithm
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let product = parseInt(cleanCedula.charAt(i)) * coefficients[i];
    if (product >= 10) {
      product = product.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    sum += product;
  }

  const checkDigit = ((Math.ceil(sum / 10) * 10) - sum) % 10;
  const lastDigit = parseInt(cleanCedula.charAt(9));

  if (checkDigit !== lastDigit) {
    return { valid: false, error: 'Dígito verificador de cédula inválido' };
  }

  return { valid: true, cleaned: cleanCedula };
};

/**
 * Normalizes and validates student names
 */
export const validateAndNormalizeName = (name, fieldName = 'Nombre') => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} es requerido` };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} debe tener al menos 2 caracteres` };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: `${fieldName} no puede exceder 50 caracteres` };
  }

  // Only allow letters, spaces, apostrophes, and hyphens
  const namePattern = /^[a-záéíóúñü\s'\-]+$/i;
  if (!namePattern.test(trimmed)) {
    return { valid: false, error: `${fieldName} contiene caracteres inválidos` };
  }

  // Normalize: title case and remove extra spaces
  const normalized = trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\s+/g, ' ');

  return { valid: true, normalized };
};

/**
 * Validates course format and consistency with education level
 */
export const validateCourse = (course, level) => {
  if (!course || typeof course !== 'string') {
    return { valid: false, error: 'Curso es requerido' };
  }

  const trimmed = course.trim();
  if (!level || !EDUCATION_LEVELS[level.toUpperCase()]) {
    return { valid: false, error: 'Nivel educativo inválido' };
  }

  const normalizedLevel = EDUCATION_LEVELS[level.toUpperCase()];
  const pattern = COURSE_PATTERNS[normalizedLevel];

  if (!pattern || !pattern.test(trimmed)) {
    return { 
      valid: false, 
      error: `Formato de curso inválido para nivel ${normalizedLevel}` 
    };
  }

  return { valid: true, normalized: trimmed };
};

/**
 * Validates education level
 */
export const validateEducationLevel = (level) => {
  if (!level || typeof level !== 'string') {
    return { valid: false, error: 'Nivel educativo es requerido' };
  }

  const normalized = EDUCATION_LEVELS[level.toUpperCase()];
  if (!normalized) {
    return { 
      valid: false, 
      error: `Nivel educativo inválido. Valores permitidos: ${Object.keys(EDUCATION_LEVELS).join(', ')}` 
    };
  }

  return { valid: true, normalized };
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
  const errors = [];
  const warnings = [];
  const normalized = {};

  // Validate cedula
  const cedulaResult = validateEcuadorianID(studentData.cedula);
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
  if (normalized.nivel) {
    const courseResult = validateCourse(studentData.curso, normalized.nivel);
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