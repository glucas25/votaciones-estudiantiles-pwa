// src/components/common/BackupSystem.jsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase.js';
import './BackupSystem.css';

const BackupSystem = () => {
  const { 
    isReady, 
    connectionStatus, 
    exportData, 
    importData, 
    getStats,
    performMigration,
    migrationStatus
  } = useDatabase();

  const [backupHistory, setBackupHistory] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [lastBackupTime, setLastBackupTime] = useState(null);

  // Load stats and backup history on component mount
  useEffect(() => {
    if (isReady) {
      loadStats();
      loadBackupHistory();
    }
  }, [isReady]);

  /**
   * Load database statistics
   */
  const loadStats = async () => {
    try {
      const databaseStats = await getStats();
      setStats(databaseStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  /**
   * Load backup history from localStorage
   */
  const loadBackupHistory = () => {
    try {
      const history = localStorage.getItem('backup_history');
      if (history) {
        setBackupHistory(JSON.parse(history));
      }
    } catch (err) {
      console.error('Failed to load backup history:', err);
    }
  };

  /**
   * Save backup history to localStorage
   */
  const saveBackupHistory = (newHistory) => {
    try {
      localStorage.setItem('backup_history', JSON.stringify(newHistory));
      setBackupHistory(newHistory);
    } catch (err) {
      console.error('Failed to save backup history:', err);
    }
  };

  /**
   * Create manual backup
   */
  const createBackup = async () => {
    if (!isReady) {
      alert('Database not ready. Please wait...');
      return;
    }

    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Export all data
      const backupData = await exportData();
      clearInterval(progressInterval);
      setBackupProgress(100);

      // Create backup file
      const timestamp = new Date().toISOString();
      const backupInfo = {
        id: `backup_${Date.now()}`,
        timestamp,
        size: JSON.stringify(backupData).length,
        databases: Object.keys(backupData),
        totalDocuments: Object.values(backupData).reduce((sum, db) => {
          return sum + (Array.isArray(db) ? db.length : 0);
        }, 0),
        type: 'manual',
        version: '1.0.0'
      };

      // Download backup file
      const dataStr = JSON.stringify({
        info: backupInfo,
        data: backupData
      }, null, 2);
      
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `votaciones-backup-${timestamp.split('T')[0]}-${timestamp.split('T')[1].split(':').join('-').split('.')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      // Update backup history
      const newHistory = [backupInfo, ...backupHistory].slice(0, 10); // Keep last 10 backups
      saveBackupHistory(newHistory);
      setLastBackupTime(timestamp);

      alert('✅ Backup created successfully!');
      
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert(`❌ Backup failed: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  /**
   * Handle file selection for restore
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid JSON backup file');
    }
  };

  /**
   * Restore from backup file
   */
  const restoreBackup = async () => {
    if (!selectedFile) {
      alert('Please select a backup file first');
      return;
    }

    if (!confirm('⚠️ This will replace ALL current data. Are you sure you want to continue?')) {
      return;
    }

    setIsRestoring(true);

    try {
      // Read file content
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(selectedFile);
      });

      const backupFile = JSON.parse(fileContent);
      
      // Validate backup structure
      if (!backupFile.data || !backupFile.info) {
        throw new Error('Invalid backup file format');
      }

      // Import data
      const result = await importData(backupFile.data);
      
      if (result.success) {
        // Update backup history
        const restoreInfo = {
          id: `restore_${Date.now()}`,
          timestamp: new Date().toISOString(),
          sourceBackup: backupFile.info,
          type: 'restore'
        };

        const newHistory = [restoreInfo, ...backupHistory].slice(0, 10);
        saveBackupHistory(newHistory);

        // Refresh stats
        await loadStats();

        alert('✅ Data restored successfully!');
        setSelectedFile(null);
        
        // Reset file input
        const fileInput = document.getElementById('backup-file-input');
        if (fileInput) {
          fileInput.value = '';
        }
        
      } else {
        throw new Error(result.error || 'Failed to import data');
      }

    } catch (err) {
      console.error('Failed to restore backup:', err);
      alert(`❌ Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!isReady) {
    return (
      <div className="backup-system loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Initializing backup system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backup-system">
      <div className="backup-header">
        <h2>🛡️ Sistema de Respaldo</h2>
        <p>Gestiona copias de seguridad de los datos de votación</p>
      </div>

      {/* Migration Status */}
      {migrationStatus.needed && (
        <div className="migration-alert">
          <div className="alert-icon">🔄</div>
          <div className="alert-content">
            <h3>Migración Pendiente</h3>
            <p>Se detectaron datos en localStorage que necesitan migración a PouchDB</p>
            <button 
              onClick={performMigration}
              disabled={migrationStatus.inProgress}
              className="btn-primary"
            >
              {migrationStatus.inProgress ? 'Migrando...' : 'Migrar Datos'}
            </button>
          </div>
        </div>
      )}

      {/* Database Status */}
      <div className="status-panel">
        <h3>📊 Estado de la Base de Datos</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">Estado:</span>
            <span className={`status ${connectionStatus.local ? 'online' : 'offline'}`}>
              {connectionStatus.local ? '🟢 Conectado' : '🔴 Desconectado'}
            </span>
          </div>
          
          {stats && (
            <>
              <div className="status-item">
                <span className="label">Estudiantes:</span>
                <span className="value">{stats.databases.students?.docs || 0}</span>
              </div>
              <div className="status-item">
                <span className="label">Candidatos:</span>
                <span className="value">{stats.databases.candidates?.docs || 0}</span>
              </div>
              <div className="status-item">
                <span className="label">Votos:</span>
                <span className="value">{stats.databases.votes?.docs || 0}</span>
              </div>
              <div className="status-item">
                <span className="label">Rendimiento:</span>
                <span className="value">
                  {stats.performance.averageQueryTime.toFixed(2)}ms promedio
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Backup Controls */}
      <div className="backup-controls">
        <div className="backup-section">
          <h3>📤 Crear Respaldo</h3>
          <p>Crea una copia de seguridad completa de todos los datos</p>
          
          {isCreatingBackup && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${backupProgress}%` }}
              ></div>
              <span className="progress-text">{backupProgress}%</span>
            </div>
          )}
          
          <button 
            onClick={createBackup}
            disabled={isCreatingBackup || !isReady}
            className="btn-primary backup-btn"
          >
            {isCreatingBackup ? '🔄 Creando Respaldo...' : '💾 Crear Respaldo'}
          </button>
          
          {lastBackupTime && (
            <p className="last-backup">
              Último respaldo: {formatTimestamp(lastBackupTime)}
            </p>
          )}
        </div>

        <div className="restore-section">
          <h3>📥 Restaurar Respaldo</h3>
          <p>Restaura datos desde un archivo de respaldo</p>
          
          <div className="file-input-group">
            <input
              id="backup-file-input"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isRestoring}
            />
            <label htmlFor="backup-file-input" className="file-label">
              {selectedFile ? selectedFile.name : 'Seleccionar archivo...'}
            </label>
          </div>
          
          {selectedFile && (
            <div className="file-info">
              <p>📄 {selectedFile.name}</p>
              <p>📊 {formatFileSize(selectedFile.size)}</p>
            </div>
          )}
          
          <button 
            onClick={restoreBackup}
            disabled={!selectedFile || isRestoring || !isReady}
            className="btn-secondary restore-btn"
          >
            {isRestoring ? '🔄 Restaurando...' : '🔄 Restaurar Datos'}
          </button>
        </div>
      </div>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <div className="backup-history">
          <h3>📋 Historial de Respaldos</h3>
          <div className="history-list">
            {backupHistory.map((item) => (
              <div key={item.id} className={`history-item ${item.type}`}>
                <div className="history-icon">
                  {item.type === 'manual' ? '💾' : '🔄'}
                </div>
                <div className="history-details">
                  <div className="history-title">
                    {item.type === 'manual' ? 'Respaldo Manual' : 'Restauración'}
                  </div>
                  <div className="history-meta">
                    <span>{formatTimestamp(item.timestamp)}</span>
                    {item.size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(item.size)}</span>
                      </>
                    )}
                    {item.totalDocuments && (
                      <>
                        <span>•</span>
                        <span>{item.totalDocuments} documentos</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="performance-metrics">
          <h3>⚡ Métricas de Rendimiento</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Consultas Totales:</span>
              <span className="metric-value">{stats.performance.queries}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Cache Hits:</span>
              <span className="metric-value">{stats.performance.cacheHits}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Tamaño Cache:</span>
              <span className="metric-value">{stats.performance.cacheSize}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Última Compactación:</span>
              <span className="metric-value">
                {stats.performance.lastCompaction ? 
                  formatTimestamp(stats.performance.lastCompaction) : 
                  'Nunca'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupSystem;