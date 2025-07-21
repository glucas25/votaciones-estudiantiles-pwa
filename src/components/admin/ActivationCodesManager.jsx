// src/components/admin/ActivationCodesManager.jsx
// Panel para gestionar códigos de activación dinámicos

import React, { useState, useEffect } from 'react';
import activationCodesService from '../../services/activationCodes.js';
import './ActivationCodesManager.css';

const ActivationCodesManager = () => {
  const [codes, setCodes] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar cursos disponibles
      const courses = await activationCodesService.getAvailableCourses();
      setAvailableCourses(courses);

      // Cargar códigos existentes
      const codesResult = await activationCodesService.getActiveCodes();
      if (codesResult.success) {
        setCodes(codesResult.codes);
      } else {
        setError(codesResult.error || 'Error cargando códigos');
      }
    } catch (err) {
      setError('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCodes = async () => {
    if (availableCourses.length === 0) {
      setError('No hay cursos disponibles. Primero importe estudiantes.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const result = await activationCodesService.generateCodesForAllCourses();
      
      if (result.success) {
        setSuccess(`✅ Generados ${result.total} códigos de activación`);
        setCodes(result.codes);
      } else {
        setError(result.error || 'Error generando códigos');
      }
    } catch (err) {
      setError('Error generando códigos: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleClearCodes = async () => {
    if (!window.confirm('⚠️ ¿Eliminar TODOS los códigos de activación?\n\nEsta acción NO se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await activationCodesService.clearAllCodes();
      
      if (result.success) {
        setSuccess(`🗑️ Eliminados ${result.deleted} códigos`);
        setCodes([]);
      } else {
        setError(result.error || 'Error eliminando códigos');
      }
    } catch (err) {
      setError('Error eliminando códigos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess(`📋 Código copiado: ${text}`);
      setTimeout(() => setSuccess(''), 2000);
    });
  };

  const exportCodes = () => {
    if (codes.length === 0) {
      setError('No hay códigos para exportar');
      return;
    }

    const exportData = codes.map(code => ({
      CODIGO: code.code,
      CURSO: code.course,
      NIVEL: code.level_name,
      GENERADO: new Date(code.generated_at).toLocaleString(),
      USADO: code.used_count || 0,
      ULTIMO_USO: code.last_used_by || 'Nunca'
    }));

    const csvContent = [
      // Headers
      Object.keys(exportData[0]).join(','),
      // Data
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos_activacion_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setSuccess('📁 Códigos exportados a CSV');
  };

  return (
    <div className="activation-codes-manager">
      <div className="manager-header">
        <h2>🔑 CÓDIGOS DE ACTIVACIÓN DINÁMICOS</h2>
        <p>Genere códigos automáticamente basados en los cursos con estudiantes registrados</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{availableCourses.length}</div>
          <div className="stat-label">Cursos Disponibles</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{codes.length}</div>
          <div className="stat-label">Códigos Generados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {codes.reduce((sum, code) => sum + (code.used_count || 0), 0)}
          </div>
          <div className="stat-label">Usos Totales</div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-section">
        <button 
          onClick={handleGenerateCodes}
          disabled={generating || loading || availableCourses.length === 0}
          className="btn btn-primary"
        >
          {generating ? '🔄 Generando...' : '🔧 GENERAR CÓDIGOS AUTOMÁTICAMENTE'}
        </button>

        {codes.length > 0 && (
          <>
            <button 
              onClick={exportCodes}
              disabled={loading}
              className="btn btn-secondary"
            >
              📁 EXPORTAR CSV
            </button>

            <button 
              onClick={handleClearCodes}
              disabled={loading}
              className="btn btn-danger"
            >
              🗑️ ELIMINAR TODOS
            </button>
          </>
        )}

        <button 
          onClick={loadData}
          disabled={loading}
          className="btn btn-light"
        >
          🔄 ACTUALIZAR
        </button>
      </div>

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <div className="courses-section">
          <h3>📚 Cursos con Estudiantes ({availableCourses.length})</h3>
          <div className="courses-grid">
            {availableCourses.map(course => (
              <div key={course} className="course-item">
                <span>{course}</span>
                {codes.find(code => code.course === course) ? (
                  <span className="status-generated">✅ Con código</span>
                ) : (
                  <span className="status-pending">⏳ Pendiente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Codes */}
      {codes.length > 0 && (
        <div className="codes-section">
          <h3>🔑 Códigos Generados ({codes.length})</h3>
          <div className="codes-table">
            <div className="table-header">
              <div>Código</div>
              <div>Curso</div>
              <div>Nivel</div>
              <div>Usos</div>
              <div>Último Uso</div>
              <div>Acciones</div>
            </div>
            {codes.map(code => (
              <div key={code._id} className="table-row">
                <div className="code-cell">
                  <code>{code.code}</code>
                </div>
                <div className="course-cell">{code.course}</div>
                <div className="level-cell">{code.level_name}</div>
                <div className="usage-cell">
                  {code.used_count || 0}
                  {code.used_count > 0 && (
                    <small>({code.last_used_by})</small>
                  )}
                </div>
                <div className="lastused-cell">
                  {code.last_used_at ? 
                    new Date(code.last_used_at).toLocaleDateString() : 
                    'Nunca'
                  }
                </div>
                <div className="actions-cell">
                  <button 
                    onClick={() => copyToClipboard(code.code)}
                    className="btn-copy"
                    title="Copiar código"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="help-section">
        <h4>💡 Instrucciones</h4>
        <ol>
          <li><strong>Importe estudiantes</strong> primero en la pestaña "Estudiantes"</li>
          <li><strong>Genere códigos</strong> automáticamente para todos los cursos</li>
          <li><strong>Entregue códigos</strong> a los tutores correspondientes</li>
          <li><strong>Los tutores</strong> solo necesitan código + nombre para acceder</li>
          <li><strong>Nueva elección</strong> elimina automáticamente todos los códigos</li>
        </ol>
      </div>
    </div>
  );
};

export default ActivationCodesManager;