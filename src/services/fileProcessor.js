// src/services/fileProcessor.js
// Robust CSV/Excel file processing service with chunked processing

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// File processing configuration
const CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB para datasets grandes
  CHUNK_SIZE: 50, // Process 50 rows at a time para mejor performance
  SUPPORTED_FORMATS: ['.csv', '.xlsx', '.xls'],
  ENCODINGS: ['UTF-8', 'ISO-8859-1', 'Windows-1252'],
  CSV_DELIMITERS: [',', ';', '\t', '|'],
  MAX_STUDENTS: 1000, // Límite máximo de estudiantes
  VALIDATION_SAMPLE_SIZE: 10 // Validar una muestra de registros para datasets grandes
};

// Expected column mappings (flexible column naming)
const COLUMN_MAPPINGS = {
  cedula: ['cedula', 'cédula', 'ci', 'identificacion', 'id', 'documento'],
  nombres: ['nombres', 'nombre', 'first_name', 'firstname', 'name'],
  apellidos: ['apellidos', 'apellido', 'last_name', 'lastname', 'surname'],
  curso: ['curso', 'class', 'grade', 'grado', 'seccion', 'sección'],
  nivel: ['nivel', 'level', 'education_level', 'nivel_educativo'],
  año: ['año', 'year', 'anio', 'periodo', 'academic_year']
};

/**
 * Detects file type based on extension
 */
export const detectFileType = (file) => {
  const extension = file.name.toLowerCase().split('.').pop();
  
  if (extension === 'csv') return 'csv';
  if (['xlsx', 'xls'].includes(extension)) return 'excel';
  
  throw new Error(`Formato de archivo no soportado: .${extension}`);
};

/**
 * Validates file before processing
 */
export const validateFile = (file) => {
  const errors = [];
  
  // Check file existence
  if (!file) {
    errors.push('No se ha seleccionado ningún archivo');
    return { valid: false, errors };
  }
  
  // Check file size
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    errors.push(`Archivo demasiado grande. Máximo permitido: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Check file format
  const extension = '.' + file.name.toLowerCase().split('.').pop();
  if (!CONFIG.SUPPORTED_FORMATS.includes(extension)) {
    errors.push(`Formato no soportado. Formatos permitidos: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
  }
  
  // Check if file is empty
  if (file.size === 0) {
    errors.push('El archivo está vacío');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    type: errors.length === 0 ? detectFileType(file) : null,
    size: file.size
  };
};

/**
 * Detects CSV delimiter automatically
 */
const detectCSVDelimiter = (csvText) => {
  const sample = csvText.slice(0, 1024); // First 1KB
  let bestDelimiter = ',';
  let maxColumns = 0;
  
  CONFIG.CSV_DELIMITERS.forEach(delimiter => {
    const lines = sample.split('\n').slice(0, 5); // Check first 5 lines
    let totalColumns = 0;
    let consistentColumns = true;
    let firstLineColumns = 0;
    
    lines.forEach((line, index) => {
      const columns = line.split(delimiter).length;
      if (index === 0) {
        firstLineColumns = columns;
      } else if (columns !== firstLineColumns && columns > 1) {
        consistentColumns = false;
      }
      totalColumns += columns;
    });
    
    if (consistentColumns && totalColumns > maxColumns) {
      maxColumns = totalColumns;
      bestDelimiter = delimiter;
    }
  });
  
  return bestDelimiter;
};

/**
 * Maps column headers to standardized field names
 */
const mapColumns = (headers) => {
  const mapping = {};
  const normalizedHeaders = headers.map(h => String(h).toLowerCase().trim());
  
  Object.entries(COLUMN_MAPPINGS).forEach(([standardName, variants]) => {
    const foundIndex = normalizedHeaders.findIndex(header => 
      variants.some(variant => header === variant || header.includes(variant))
    );
    
    if (foundIndex !== -1) {
      mapping[standardName] = foundIndex; // Map to column index instead of header name
    }
  });
  
  console.log('🗺️ Column mapping result:', mapping);
  console.log('📋 Original headers:', headers);
  console.log('🔧 Normalized headers:', normalizedHeaders);
  
  return mapping;
};

/**
 * Processes CSV file with automatic delimiter detection
 */
const processCSVFile = async (file, onProgress = null, onChunk = null) => {
  return new Promise((resolve, reject) => {
    let allData = [];
    let processedRows = 0;
    let columnMapping = {};
    let headers = [];
    
    Papa.parse(file, {
      header: false, // We'll handle headers manually
      dynamicTyping: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      
      // Auto-detect delimiter
      delimiter: '',
      
      step: (result, parser) => {
        if (result.errors.length > 0) {
          console.warn('CSV parsing warning:', result.errors);
        }
        
        // First row contains headers
        if (processedRows === 0) {
          headers = result.data;
          columnMapping = mapColumns(headers);
          
          // Validate that we have required columns
          const requiredFields = ['cedula', 'nombres', 'apellidos', 'curso', 'nivel'];
          const mappedFields = Object.keys(columnMapping);
          const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
          
          if (missingFields.length > 0) {
            parser.abort();
            reject(new Error(`Columnas requeridas no encontradas: ${missingFields.join(', ')}`));
            return;
          }
          
          console.log('✅ All required columns found:', mappedFields);
        } else {
          // Process data row
          const rowData = {};
          Object.entries(columnMapping).forEach(([standardField, columnIndex]) => {
            if (result.data[columnIndex] !== undefined) {
              rowData[standardField] = result.data[columnIndex];
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            allData.push({
              rowNumber: processedRows,
              data: rowData
            });
            
            // Process in chunks
            if (allData.length >= CONFIG.CHUNK_SIZE && onChunk) {
              onChunk([...allData]);
              allData = [];
            }
          }
        }
        
        processedRows++;
        
        if (onProgress) {
          onProgress({
            processed: processedRows,
            phase: 'parsing'
          });
        }
      },
      
      complete: () => {
        // Process remaining data
        if (allData.length > 0 && onChunk) {
          onChunk(allData);
        }
        
        resolve({
          totalRows: processedRows - 1, // Exclude header
          columnMapping,
          headers
        });
      },
      
      error: (error) => {
        reject(new Error(`Error procesando CSV: ${error.message}`));
      }
    });
  });
};

/**
 * Processes Excel file (.xlsx, .xls)
 */
const processExcelFile = async (file, onProgress = null, onChunk = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Use first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });
        
        if (jsonData.length === 0) {
          reject(new Error('El archivo Excel está vacío'));
          return;
        }
        
        // Extract headers and map columns
        const headers = jsonData[0].map(h => String(h).trim());
        const columnMapping = mapColumns(headers);
        
        // Validate required columns
        const requiredFields = ['cedula', 'nombres', 'apellidos', 'curso', 'nivel'];
        const mappedFields = Object.values(columnMapping);
        const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
        
        if (missingFields.length > 0) {
          reject(new Error(`Columnas requeridas no encontradas: ${missingFields.join(', ')}`));
          return;
        }
        
        // Process data rows in chunks
        const dataRows = jsonData.slice(1);
        let processedRows = 0;
        
        const processChunk = (startIndex) => {
          const chunk = [];
          const endIndex = Math.min(startIndex + CONFIG.CHUNK_SIZE, dataRows.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            const rowData = {};
            headers.forEach((header, index) => {
              const standardField = columnMapping[header];
              if (standardField && dataRows[i][index] !== undefined) {
                rowData[standardField] = dataRows[i][index];
              }
            });
            
            if (Object.keys(rowData).length > 0) {
              chunk.push({
                rowNumber: i + 2, // +2 because of header and 0-based index
                data: rowData
              });
            }
          }
          
          if (chunk.length > 0 && onChunk) {
            onChunk(chunk);
          }
          
          processedRows = endIndex;
          
          if (onProgress) {
            onProgress({
              processed: processedRows,
              total: dataRows.length,
              phase: 'processing'
            });
          }
          
          // Continue with next chunk
          if (endIndex < dataRows.length) {
            setTimeout(() => processChunk(endIndex), 10); // Small delay to prevent UI blocking
          } else {
            // Finished processing
            resolve({
              totalRows: dataRows.length,
              columnMapping,
              headers
            });
          }
        };
        
        // Start processing
        processChunk(0);
        
      } catch (error) {
        reject(new Error(`Error procesando Excel: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error leyendo el archivo Excel'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Main file processing function
 */
export const processFile = async (file, options = {}) => {
  const {
    onProgress = null,
    onChunk = null,
    validateData = true
  } = options;
  
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const fileType = validation.type;
  
  try {
    let result;
    
    if (fileType === 'csv') {
      result = await processCSVFile(file, onProgress, onChunk);
    } else if (fileType === 'excel') {
      result = await processExcelFile(file, onProgress, onChunk);
    } else {
      throw new Error(`Tipo de archivo no soportado: ${fileType}`);
    }
    
    return {
      success: true,
      fileType,
      totalRows: result.totalRows,
      columnMapping: result.columnMapping,
      headers: result.headers,
      fileName: file.name,
      fileSize: file.size
    };
    
  } catch (error) {
    throw new Error(`Error procesando archivo: ${error.message}`);
  }
};

/**
 * Utility to read file as text (for preview)
 */
export const readFileAsText = (file, maxLength = 1000) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      let content = e.target.result;
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
      }
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Error leyendo archivo'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Get file processing statistics
 */
export const getProcessingStats = () => ({
  maxFileSize: CONFIG.MAX_FILE_SIZE,
  chunkSize: CONFIG.CHUNK_SIZE,
  supportedFormats: CONFIG.SUPPORTED_FORMATS,
  supportedEncodings: CONFIG.ENCODINGS
});