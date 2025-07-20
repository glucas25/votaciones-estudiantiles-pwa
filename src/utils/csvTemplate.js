// src/utils/csvTemplate.js
// CSV template generator and sample data

// Template headers for student import
export const TEMPLATE_HEADERS = [
  'cedula',
  'nombres', 
  'apellidos',
  'curso',
  'nivel',
  'año'
];

// Sample data for different education levels
const SAMPLE_DATA = {
  BASICA_ELEMENTAL: [
    {
      cedula: '1234567890',
      nombres: 'Ana María',
      apellidos: 'González Pérez',
      curso: '1ro A',
      nivel: 'BASICA_ELEMENTAL',
      año: 2024
    },
    {
      cedula: '1234567891',
      nombres: 'Carlos Eduardo',
      apellidos: 'Martínez Silva',
      curso: '2do A',
      nivel: 'BASICA_ELEMENTAL', 
      año: 2024
    },
    {
      cedula: '1234567892',
      nombres: 'María José',
      apellidos: 'López Torres',
      curso: '3ro B',
      nivel: 'BASICA_ELEMENTAL',
      año: 2024
    }
  ],
  BASICA_MEDIA: [
    {
      cedula: '1234567893',
      nombres: 'Diego Fernando',
      apellidos: 'Rodríguez Vega',
      curso: '5to A',
      nivel: 'BASICA_MEDIA',
      año: 2024
    },
    {
      cedula: '1234567894',
      nombres: 'Isabella Sofia',
      apellidos: 'Castro Morales',
      curso: '6to B',
      nivel: 'BASICA_MEDIA',
      año: 2024
    },
    {
      cedula: '1234567895',
      nombres: 'Sebastián David',
      apellidos: 'Herrera Luna',
      curso: '7mo A',
      nivel: 'BASICA_MEDIA',
      año: 2024
    }
  ],
  BASICA_SUPERIOR: [
    {
      cedula: '1234567896',
      nombres: 'Valentina Andrea',
      apellidos: 'Vargas Ruiz',
      curso: '8vo A',
      nivel: 'BASICA_SUPERIOR',
      año: 2024
    },
    {
      cedula: '1234567897',
      nombres: 'Mateo Alejandro',
      apellidos: 'Jiménez Castro',
      curso: '9no B',
      nivel: 'BASICA_SUPERIOR',
      año: 2024
    },
    {
      cedula: '1234567898',
      nombres: 'Camila Fernanda',
      apellidos: 'Mendoza Vargas',
      curso: '10mo A',
      nivel: 'BASICA_SUPERIOR',
      año: 2024
    }
  ],
  BACHILLERATO: [
    {
      cedula: '1234567899',
      nombres: 'Andrés Felipe',
      apellidos: 'Paredes Silva',
      curso: '1ro Bach A',
      nivel: 'BACHILLERATO',
      año: 2024
    },
    {
      cedula: '1234567800',
      nombres: 'Sofía Elena',
      apellidos: 'Guerrero Torres',
      curso: '2do Bach B',
      nivel: 'BACHILLERATO',
      año: 2024
    },
    {
      cedula: '1234567801',
      nombres: 'Kevin Andrés',
      apellidos: 'Molina Espinoza',
      curso: '3ro Bach A',
      nivel: 'BACHILLERATO',
      año: 2024
    }
  ]
};

/**
 * Generates CSV content as string
 */
export const generateCSVContent = (data = [], includeHeaders = true) => {
  const lines = [];
  
  if (includeHeaders) {
    lines.push(TEMPLATE_HEADERS.join(','));
  }
  
  data.forEach(row => {
    const csvRow = TEMPLATE_HEADERS.map(header => {
      const value = row[header] || '';
      // Escape values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(csvRow.join(','));
  });
  
  return lines.join('\n');
};

/**
 * Downloads CSV file with given data
 */
export const downloadCSV = (data, filename = 'estudiantes_template.csv') => {
  const csvContent = generateCSVContent(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generates a template CSV with sample data for specific level
 */
export const generateTemplate = (level = null, includeAllLevels = false) => {
  let data = [];
  
  if (includeAllLevels) {
    // Include samples from all levels
    Object.values(SAMPLE_DATA).forEach(levelData => {
      data = data.concat(levelData);
    });
  } else if (level && SAMPLE_DATA[level]) {
    // Include samples from specific level
    data = SAMPLE_DATA[level];
  } else {
    // Return empty template with just headers
    data = [];
  }
  
  return data;
};

/**
 * Downloads template CSV for specific education level
 */
export const downloadTemplate = (level = null, includeAllLevels = false) => {
  const data = generateTemplate(level, includeAllLevels);
  let filename = 'plantilla_estudiantes.csv';
  
  if (level) {
    filename = `plantilla_estudiantes_${level.toLowerCase()}.csv`;
  } else if (includeAllLevels) {
    filename = 'plantilla_estudiantes_todos_niveles.csv';
  }
  
  downloadCSV(data, filename);
};

/**
 * Gets template information and instructions
 */
export const getTemplateInfo = () => ({
  headers: TEMPLATE_HEADERS,
  requiredFields: ['cedula', 'nombres', 'apellidos', 'curso', 'nivel'],
  optionalFields: ['año'],
  instructions: {
    cedula: 'Cédula ecuatoriana de 10 dígitos (sin guiones ni espacios)',
    nombres: 'Nombres del estudiante (máximo 50 caracteres)',
    apellidos: 'Apellidos del estudiante (máximo 50 caracteres)',
    curso: 'Curso en formato: "1ro A", "5to B", "1ro Bach A", etc.',
    nivel: 'Nivel educativo: BASICA_ELEMENTAL, BASICA_MEDIA, BASICA_SUPERIOR, BACHILLERATO',
    año: 'Año académico (número, ej: 2024)'
  },
  examples: SAMPLE_DATA,
  formats: {
    csv: 'Archivo CSV separado por comas',
    excel: 'Archivo Excel (.xlsx o .xls)'
  }
});

/**
 * Validates template structure
 */
export const validateTemplate = (headers) => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const requiredFields = ['cedula', 'nombres', 'apellidos', 'curso', 'nivel'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    const variants = {
      cedula: ['cedula', 'cédula', 'ci', 'identificacion'],
      nombres: ['nombres', 'nombre', 'first_name'],
      apellidos: ['apellidos', 'apellido', 'last_name'], 
      curso: ['curso', 'class', 'grado'],
      nivel: ['nivel', 'level', 'education_level']
    };
    
    const found = normalizedHeaders.some(header => 
      variants[field].some(variant => header.includes(variant))
    );
    
    if (!found) {
      missingFields.push(field);
    }
  });
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    suggestions: missingFields.length > 0 ? 
      `Faltan las siguientes columnas: ${missingFields.join(', ')}` : 
      'Estructura del archivo correcta'
  };
};