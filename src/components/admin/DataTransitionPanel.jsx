// src/components/admin/DataTransitionPanel.jsx
// Panel de control para transición entre datos mock y reales

import React, { useState, useEffect } from 'react';
import dataTransitionService from '../../services/dataTransition.js';
import './DataTransitionPanel.css';

const DataTransitionPanel = ({ onDataChanged }) => {
  const [transitionStats, setTransitionStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTransitionStats();
  }, []);

  const loadTransitionStats = async () => {
    try {
      const stats = await dataTransitionService.getTransitionStats();
      setTransitionStats(stats);
      setError('');
    } catch (error) {
      setError(`Error cargando estadísticas: ${error.message}`);
    }
  };

  const executeOperation = async (operationType, data = null) => {
    setLoading(true);
    setOperation(operationType);
    setError('');
    setProgress({ current: 0, total: 0, phase: operationType });

    try {
      let result;

      switch (operationType) {
        case 'createBackup':
          result = await dataTransitionService.createBackup();
          break;
        
        case 'resetToMock':
          result = await dataTransitionService.resetToMockData();
          break;
        
        case 'importReal':
          if (!data) {
            throw new Error('Datos reales requeridos para importación');
          }
          result = await dataTransitionService.importRealData(data, {
            chunkSize: 50,
            validateDuplicates: true,
            backupFirst: true,
            rollbackOnError: true
          });
          break;
        
        case 'rollback':
          result = await dataTransitionService.rollbackLastImport();
          break;
        
        default:
          throw new Error(`Operación no reconocida: ${operationType}`);
      }

      if (result.success) {
        await loadTransitionStats();
        if (onDataChanged) {
          onDataChanged();
        }
        
        // Actualizar logs
        const newLogs = dataTransitionService.getTransitionLog();
        setLogs(newLogs.slice(-10)); // Últimos 10 logs
      } else {
        setError(result.error || 'Operación fallida');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setOperation('');
      setProgress({ current: 0, total: 0, phase: '' });
    }
  };

  const downloadMockTemplate = () => {
    const template = dataTransitionService.exportMockTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mock_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (dataType) => {
    switch (dataType) {
      case 'mock': return '#3498db';
      case 'real': return '#27ae60';
      case 'mixed': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (dataType) => {
    switch (dataType) {
      case 'mock': return '🧪';
      case 'real': return '📊';
      case 'mixed': return '🔄';
      default: return '❓';
    }
  };

  if (!transitionStats) {
    return (
      <div className="data-transition-panel loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando estadísticas de transición...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-transition-panel">
      <div className="panel-header">
        <h3>🔄 Gestión de Transición de Datos</h3>
        <div className="data-status">
          <span className="status-indicator" style={{ color: getStatusColor(transitionStats.currentDataType?.type) }}>
            {getStatusIcon(transitionStats.currentDataType?.type)} 
            {transitionStats.currentDataType?.type || 'desconocido'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Estadísticas actuales */}
      <div className="stats-section">
        <h4>📊 Estado Actual de Datos</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Tipo de Datos</div>
            <div className="stat-value">
              {getStatusIcon(transitionStats.currentDataType?.type)} 
              {transitionStats.currentDataType?.type || 'No detectado'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Estudiantes</div>
            <div className="stat-value">
              {transitionStats.currentDataType?.totalCount || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Datos Mock</div>
            <div className="stat-value">
              {transitionStats.currentDataType?.mockCount || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Datos Reales</div>
            <div className="stat-value">
              {transitionStats.currentDataType?.realCount || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Backups</div>
            <div className="stat-value">
              {transitionStats.totalBackups}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones disponibles */}
      <div className="actions-section">
        <h4>⚡ Acciones Disponibles</h4>
        <div className="actions-grid">
          <button
            className="action-button backup"
            onClick={() => executeOperation('createBackup')}
            disabled={loading}
          >
            <span className="action-icon">💾</span>
            <div className="action-content">
              <div className="action-title">Crear Backup</div>
              <div className="action-description">Respaldar datos actuales</div>
            </div>
          </button>

          <button
            className="action-button reset"
            onClick={() => executeOperation('resetToMock')}
            disabled={loading}
          >
            <span className="action-icon">🧪</span>
            <div className="action-content">
              <div className="action-title">Reset a Mock</div>
              <div className="action-description">Volver a datos de prueba</div>
            </div>
          </button>

          <button
            className="action-button template"
            onClick={downloadMockTemplate}
            disabled={loading}
          >
            <span className="action-icon">📥</span>
            <div className="action-content">
              <div className="action-title">Descargar Template</div>
              <div className="action-description">Template datos mock</div>
            </div>
          </button>

          {transitionStats.availableActions?.includes('rollbackToMock') && (
            <button
              className="action-button rollback"
              onClick={() => executeOperation('rollback')}
              disabled={loading}
            >
              <span className="action-icon">⏪</span>
              <div className="action-content">
                <div className="action-title">Rollback</div>
                <div className="action-description">Restaurar último backup</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Progreso de operaciones */}
      {loading && (
        <div className="progress-section">
          <h4>🔄 Operación en Progreso</h4>
          <div className="progress-info">
            <div className="progress-text">
              Ejecutando: <strong>{operation}</strong>
              {progress.phase && ` - ${progress.phase}`}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: progress.total > 0 
                    ? `${(progress.current / progress.total) * 100}%` 
                    : '50%' 
                }}
              ></div>
            </div>
            {progress.total > 0 && (
              <div className="progress-numbers">
                {progress.current} / {progress.total}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs de transición */}
      <div className="logs-section">
        <div className="logs-header">
          <h4>📋 Registro de Transiciones</h4>
          <button 
            className="toggle-logs"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? '▼' : '▶'} {logs.length > 0 ? `${logs.length} entradas` : 'Sin logs'}
          </button>
        </div>
        
        {showLogs && (
          <div className="logs-content">
            {logs.length === 0 ? (
              <p className="no-logs">No hay logs de transición disponibles</p>
            ) : (
              <div className="logs-list">
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="info-section">
        <h4>ℹ️ Información</h4>
        <div className="info-content">
          <p><strong>Datos Mock:</strong> Datos de prueba para desarrollo y testing</p>
          <p><strong>Datos Reales:</strong> Estudiantes reales importados desde CSV/Excel</p>
          <p><strong>Backup:</strong> Se crea automáticamente antes de operaciones críticas</p>
          <p><strong>Rollback:</strong> Restaura el backup más reciente disponible</p>
        </div>
      </div>
    </div>
  );
};

export default DataTransitionPanel;