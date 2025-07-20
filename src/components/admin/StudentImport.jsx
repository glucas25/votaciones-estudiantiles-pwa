// src/components/admin/StudentImport.jsx
// Drag & drop file import component with real-time validation

import React, { useState, useRef, useCallback } from 'react';
import { processFile, validateFile, readFileAsText } from '../../services/fileProcessor';
import { validateStudentBatch, generateValidationReport } from '../../utils/studentValidation';
import { downloadTemplate, getTemplateInfo, validateTemplate } from '../../utils/csvTemplate';
import './StudentImport.css';

const StudentImport = ({ onImportComplete, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, phase: 'idle' });
  const [validationResults, setValidationResults] = useState(null);
  const [error, setError] = useState('');
  const [importStep, setImportStep] = useState('select'); // select, preview, validate, confirm, complete
  
  const fileInputRef = useRef(null);
  const allStudents = useRef([]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (selectedFile) => {
    setError('');
    setFile(selectedFile);
    
    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Generate preview for text files
    if (validation.type === 'csv') {
      try {
        const preview = await readFileAsText(selectedFile, 500);
        setFilePreview(preview);
      } catch (err) {
        setFilePreview('Error generando vista previa');
      }
    } else {
      setFilePreview(`Archivo Excel: ${selectedFile.name}\nTamaño: ${(selectedFile.size / 1024).toFixed(1)} KB`);
    }
    
    setImportStep('preview');
  };

  // Process and validate file
  const processAndValidate = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress({ processed: 0, total: 0, phase: 'parsing' });
    allStudents.current = [];

    try {
      console.log('🔄 Starting file processing...');
      await processFile(file, {
        onProgress: (progressData) => {
          console.log('📊 Progress update:', progressData);
          setProgress(prev => ({ ...prev, ...progressData }));
        },
        onChunk: (chunk) => {
          console.log('📦 Processing chunk:', chunk);
          // Collect all student data
          chunk.forEach(row => {
            allStudents.current.push(row.data);
          });
        }
      });

      console.log('📋 All students collected:', allStudents.current);

      // Validate all collected students
      setProgress({ processed: 0, total: allStudents.current.length, phase: 'validating' });
      
      const validationResults = validateStudentBatch(
        allStudents.current,
        (progressData) => {
          setProgress(prev => ({ ...prev, ...progressData }));
        }
      );

      console.log('✅ Validation results:', validationResults);
      const report = generateValidationReport(validationResults);
      setValidationResults({ ...validationResults, report });
      setImportStep('validate');

    } catch (err) {
      console.error('❌ Processing error:', err);
      setError(`Error procesando archivo: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Confirm and complete import
  const confirmImport = () => {
    if (validationResults && validationResults.validStudents.length > 0) {
      console.log('🎯 Confirming import of students:', validationResults.validStudents);
      onImportComplete(validationResults.validStudents, validationResults.report);
      setImportStep('complete');
    } else {
      console.error('❌ No valid students to import');
    }
  };

  // Reset component
  const resetImport = () => {
    setFile(null);
    setFilePreview('');
    setValidationResults(null);
    setError('');
    setProgress({ processed: 0, total: 0, phase: 'idle' });
    setImportStep('select');
    allStudents.current = [];
  };

  // Download template
  const handleDownloadTemplate = (level = null) => {
    downloadTemplate(level, level === 'ALL');
  };

  // File selection step
  const renderFileSelection = () => (
    <div className="import-step">
      <h2>📂 Importar Estudiantes</h2>
      <p>Selecciona un archivo CSV o Excel con los datos de los estudiantes</p>
      
      {/* Download Templates */}
      <div className="template-section">
        <h3>📋 Descargar Plantillas</h3>
        <div className="template-buttons">
          <button 
            onClick={() => handleDownloadTemplate()}
            className="template-btn"
          >
            📄 Plantilla Vacía
          </button>
          <button 
            onClick={() => handleDownloadTemplate('BASICA_ELEMENTAL')}
            className="template-btn"
          >
            📚 Básica Elemental
          </button>
          <button 
            onClick={() => handleDownloadTemplate('BASICA_MEDIA')}
            className="template-btn"
          >
            📖 Básica Media
          </button>
          <button 
            onClick={() => handleDownloadTemplate('BASICA_SUPERIOR')}
            className="template-btn"
          >
            📓 Básica Superior
          </button>
          <button 
            onClick={() => handleDownloadTemplate('BACHILLERATO')}
            className="template-btn"
          >
            🎓 Bachillerato
          </button>
          <button 
            onClick={() => handleDownloadTemplate('ALL')}
            className="template-btn featured"
          >
            📋 Todos los Niveles
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">📁</div>
          <div className="dropzone-text">
            <strong>Arrastra tu archivo aquí o haz clic para seleccionar</strong>
            <p>Formatos soportados: CSV, Excel (.xlsx, .xls)</p>
            <p>Tamaño máximo: 10MB</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
        style={{ display: 'none' }}
      />

      {/* Format Instructions */}
      <div className="format-info">
        <h4>📝 Formato Requerido</h4>
        <div className="required-columns">
          <strong>Columnas obligatorias:</strong>
          <ul>
            <li><code>cedula</code> - Cédula ecuatoriana (10 dígitos)</li>
            <li><code>nombres</code> - Nombres del estudiante</li>
            <li><code>apellidos</code> - Apellidos del estudiante</li>
            <li><code>curso</code> - Curso (ej: "1ro A", "5to B", "1ro Bach A")</li>
            <li><code>nivel</code> - Nivel educativo (BASICA_ELEMENTAL, BASICA_MEDIA, BASICA_SUPERIOR, BACHILLERATO)</li>
          </ul>
          <strong>Columnas opcionales:</strong>
          <ul>
            <li><code>año</code> - Año académico (por defecto: año actual)</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // File preview step
  const renderFilePreview = () => (
    <div className="import-step">
      <h2>👀 Vista Previa del Archivo</h2>
      
      <div className="file-info">
        <div className="file-details">
          <strong>📄 {file.name}</strong>
          <p>Tamaño: {(file.size / 1024).toFixed(1)} KB</p>
          <p>Tipo: {file.type || 'Desconocido'}</p>
        </div>
      </div>

      <div className="file-preview">
        <h4>Contenido:</h4>
        <pre>{filePreview}</pre>
      </div>

      <div className="step-actions">
        <button onClick={resetImport} className="btn-secondary">
          ⬅️ Cambiar Archivo
        </button>
        <button onClick={processAndValidate} className="btn-primary">
          🔍 Procesar y Validar
        </button>
      </div>
    </div>
  );

  // Processing step
  const renderProcessing = () => (
    <div className="import-step">
      <h2>⚙️ Procesando Archivo</h2>
      
      <div className="processing-info">
        <div className="progress-section">
          <h4>📊 Progreso: {progress.phase}</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: progress.total > 0 ? `${(progress.processed / progress.total) * 100}%` : '0%' 
              }}
            ></div>
          </div>
          <p>{progress.processed} / {progress.total} registros procesados</p>
        </div>

        <div className="processing-spinner">
          <div className="spinner">🔄</div>
          <p>Por favor espera mientras procesamos tu archivo...</p>
        </div>
      </div>
    </div>
  );

  // Validation results step
  const renderValidationResults = () => {
    if (!validationResults) return null;

    const { report, validStudents, invalidStudents } = validationResults;

    return (
      <div className="import-step">
        <h2>✅ Resultados de Validación</h2>
        
        <div className="validation-summary">
          <div className="summary-cards">
            <div className="summary-card success">
              <div className="card-number">{report.summary.valid}</div>
              <div className="card-label">Estudiantes Válidos</div>
            </div>
            <div className="summary-card error">
              <div className="card-number">{report.summary.invalid}</div>
              <div className="card-label">Con Errores</div>
            </div>
            <div className="summary-card info">
              <div className="card-number">{report.summary.successRate}%</div>
              <div className="card-label">Tasa de Éxito</div>
            </div>
          </div>
        </div>

        {report.summary.invalid > 0 && (
          <div className="error-details">
            <h4>❌ Errores Encontrados</h4>
            <div className="error-types">
              {Object.entries(report.errors).map(([errorType, count]) => (
                <div key={errorType} className="error-type">
                  <strong>{errorType}:</strong> {count} errores
                </div>
              ))}
            </div>
            
            <div className="error-list">
              {invalidStudents.slice(0, 10).map(student => (
                <div key={student.index} className="error-item">
                  <strong>Fila {student.index}:</strong>
                  <ul>
                    {student.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {invalidStudents.length > 10 && (
                <p>... y {invalidStudents.length - 10} errores más</p>
              )}
            </div>
          </div>
        )}

        <div className="step-actions">
          <button onClick={resetImport} className="btn-secondary">
            ⬅️ Importar Otro Archivo
          </button>
          {validStudents.length > 0 && (
            <button onClick={confirmImport} className="btn-primary">
              ✅ Importar {validStudents.length} Estudiantes Válidos
            </button>
          )}
        </div>
      </div>
    );
  };

  // Completion step
  const renderComplete = () => (
    <div className="import-step">
      <h2>🎉 Importación Completada</h2>
      
      <div className="completion-message">
        <div className="success-icon">✅</div>
        <h3>¡Estudiantes importados exitosamente!</h3>
        <p>Se han agregado {validationResults?.validStudents?.length || 0} estudiantes al sistema.</p>
      </div>

      <div className="step-actions">
        <button onClick={resetImport} className="btn-secondary">
          📁 Importar Más Estudiantes
        </button>
        <button onClick={onCancel} className="btn-primary">
          ✅ Finalizar
        </button>
      </div>
    </div>
  );

  return (
    <div className="student-import">
      {error && (
        <div className="error-banner">
          <strong>❌ Error:</strong> {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      {importStep === 'select' && renderFileSelection()}
      {importStep === 'preview' && renderFilePreview()}
      {processing && renderProcessing()}
      {importStep === 'validate' && renderValidationResults()}
      {importStep === 'complete' && renderComplete()}
    </div>
  );
};

export default StudentImport;