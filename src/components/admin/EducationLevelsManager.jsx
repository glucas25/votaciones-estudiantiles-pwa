// src/components/admin/EducationLevelsManager.jsx
import React, { useState, useEffect } from 'react';
import educationLevelsService from '../../services/educationLevels.js';
import './EducationLevelsManager.css';

const EducationLevelsManager = () => {
  const [levels, setLevels] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    key: '',
    displayName: ''
  });

  useEffect(() => {
    loadEducationLevels();
  }, []);

  const loadEducationLevels = () => {
    setLevels(educationLevelsService.getEducationLevelsForForm());
    setStats(educationLevelsService.getConfigurationStats());
  };

  const handleAddLevel = async () => {
    if (!formData.key.trim() || !formData.displayName.trim()) {
      setError('Tanto la clave como el nombre son requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    const result = educationLevelsService.addEducationLevel(
      formData.key.trim(),
      formData.displayName.trim()
    );

    if (result.success) {
      setSuccess(`Nivel educativo "${result.displayName}" agregado exitosamente`);
      setFormData({ key: '', displayName: '' });
      setShowAddForm(false);
      loadEducationLevels();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleUpdateName = async () => {
    if (!formData.displayName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    const result = educationLevelsService.updateEducationLevelName(
      editingLevel.key,
      formData.displayName.trim()
    );

    if (result.success) {
      setSuccess(`Nombre actualizado a "${result.displayName}"`);
      setEditingLevel(null);
      setFormData({ key: '', displayName: '' });
      loadEducationLevels();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleRemoveLevel = async (levelKey) => {
    if (!window.confirm('¿Está seguro de eliminar este nivel educativo? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = educationLevelsService.removeEducationLevel(levelKey);

    if (result.success) {
      setSuccess(`Nivel educativo eliminado exitosamente`);
      loadEducationLevels();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleResetToDefaults = async () => {
    const confirmMessage = `¿Está seguro de restaurar los niveles educativos a los valores por defecto?

Esta acción:
• Eliminará todos los niveles personalizados
• Restaurará los nombres originales
• No se puede deshacer

Escriba "CONFIRMAR" para proceder:`;

    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'CONFIRMAR') {
      setLoading(true);
      setError(null);

      const result = educationLevelsService.resetToDefaults();

      if (result.success) {
        setSuccess(result.message);
        loadEducationLevels();
      } else {
        setError(result.error);
      }

      setLoading(false);
    } else if (confirmation !== null) {
      setError('Confirmación incorrecta. No se realizaron cambios.');
    }
  };

  const handleExportConfig = () => {
    try {
      const config = educationLevelsService.exportConfiguration();
      const blob = new Blob([JSON.stringify(config, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `education_levels_config_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Configuración exportada exitosamente');
    } catch (err) {
      setError('Error al exportar configuración: ' + err.message);
    }
  };

  const handleStartEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      key: level.key,
      displayName: level.label
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
    setFormData({ key: '', displayName: '' });
  };

  const handleStartAdd = () => {
    setShowAddForm(true);
    setEditingLevel(null);
    setFormData({ key: '', displayName: '' });
  };

  return (
    <div className="education-levels-manager">
      <div className="manager-header">
        <h3>📚 Gestión de Niveles Educativos</h3>
        <div className="header-stats">
          <span className="stat">
            📊 Total: {stats.totalLevels}
          </span>
          <span className="stat">
            🔧 Personalizados: {stats.customLevels}
          </span>
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">
          ⏳ Procesando...
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      <div className="manager-actions">
        <button 
          className="btn-primary"
          onClick={handleStartAdd}
          disabled={loading || showAddForm}
        >
          ➕ Agregar Nivel
        </button>
        <button 
          className="btn-secondary"
          onClick={handleExportConfig}
          disabled={loading}
        >
          📥 Exportar Config
        </button>
        <button 
          className="btn-warning"
          onClick={handleResetToDefaults}
          disabled={loading}
        >
          🔄 Restaurar Defecto
        </button>
      </div>

      {/* Add Level Form */}
      {showAddForm && (
        <div className="level-form">
          <h4>➕ Agregar Nuevo Nivel Educativo</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Clave (ID interno):</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/[^A-Z_]/g, '') })}
                placeholder="ej: UNIVERSIDAD, TECNICO"
                maxLength={20}
              />
              <small>Solo letras mayúsculas y guiones bajos</small>
            </div>
            <div className="form-group">
              <label>Nombre para mostrar:</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="ej: Universidad, Técnico"
                maxLength={30}
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleAddLevel}
              disabled={loading || !formData.key.trim() || !formData.displayName.trim()}
            >
              ✅ Agregar
            </button>
            <button 
              className="btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ key: '', displayName: '' });
              }}
              disabled={loading}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit Level Form */}
      {editingLevel && (
        <div className="level-form">
          <h4>✏️ Editar Nivel Educativo</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Clave (no editable):</label>
              <input
                type="text"
                value={formData.key}
                disabled
                className="disabled-input"
              />
            </div>
            <div className="form-group">
              <label>Nombre para mostrar:</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                maxLength={30}
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleUpdateName}
              disabled={loading || !formData.displayName.trim()}
            >
              ✅ Actualizar
            </button>
            <button 
              className="btn-secondary"
              onClick={handleCancelEdit}
              disabled={loading}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Levels List */}
      <div className="levels-list">
        <h4>📋 Niveles Educativos Configurados</h4>
        <div className="levels-grid">
          {levels.map(level => (
            <div key={level.key} className={`level-card ${level.isCustom ? 'custom' : 'default'}`}>
              <div className="level-header">
                <h5>{level.label}</h5>
                <span className="level-type">
                  {level.isCustom ? '🔧 Personalizado' : '📚 Por defecto'}
                </span>
              </div>
              <div className="level-details">
                <p><strong>Clave:</strong> {level.key}</p>
                <p><strong>Valor:</strong> {level.value}</p>
              </div>
              <div className="level-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleStartEdit(level)}
                  disabled={loading}
                >
                  ✏️ Editar
                </button>
                {level.isCustom && (
                  <button 
                    className="btn-delete"
                    onClick={() => handleRemoveLevel(level.key)}
                    disabled={loading}
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Info */}
      <div className="config-info">
        <h4>ℹ️ Información de Configuración</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Niveles totales:</strong> {stats.totalLevels}
          </div>
          <div className="info-item">
            <strong>Niveles por defecto:</strong> {stats.defaultLevels}
          </div>
          <div className="info-item">
            <strong>Niveles personalizados:</strong> {stats.customLevels}
          </div>
          <div className="info-item">
            <strong>Nombres personalizados:</strong> {stats.customNames}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationLevelsManager;