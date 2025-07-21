// src/components/admin/ElectionConfigurator.jsx
// Configurador de tipos de elección para el panel de administración
import React, { useState, useEffect } from 'react';
import { useElectionConfig } from '../../contexts/ElectionConfigContext';
import './ElectionConfigurator.css';

const ElectionConfigurator = () => {
  const {
    config,
    loading,
    error,
    isConfigLoaded,
    updateElectionType,
    updateAvailablePositions,
    updateElectionInfo,
    updateListConfiguration,
    resetToDefaults,
    getEnabledPositions,
    getElectionTypeName,
    getConfigSummary,
    ELECTION_TYPES,
    AVAILABLE_POSITIONS
  } = useElectionConfig();

  const [formData, setFormData] = useState({
    electionType: ELECTION_TYPES.LIST_BASED,
    availablePositions: ['PRESIDENTE', 'VICEPRESIDENTE'],
    electionName: 'Elecciones Estudiantiles 2024',
    electionDate: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    listConfiguration: {
      enabled: true,
      requireBothPositions: true,
      presidentPriority: true
    }
  });

  const [localError, setLocalError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar formData con config cuando se carga
  useEffect(() => {
    if (isConfigLoaded && config) {
      setFormData({
        electionType: config.electionType || ELECTION_TYPES.LIST_BASED,
        availablePositions: config.availablePositions || ['PRESIDENTE', 'VICEPRESIDENTE'],
        electionName: config.electionName || 'Elecciones Estudiantiles 2024',
        electionDate: config.electionDate || new Date().toISOString().split('T')[0],
        startTime: config.votingPeriod?.startTime || '08:00',
        endTime: config.votingPeriod?.endTime || '16:00',
        listConfiguration: {
          enabled: config.listConfiguration?.enabled !== false,
          requireBothPositions: config.listConfiguration?.requireBothPositions !== false,
          presidentPriority: config.listConfiguration?.presidentPriority !== false
        }
      });
    }
  }, [isConfigLoaded, config]);

  const handleElectionTypeChange = (type) => {
    // Solo LIST_BASED está disponible, pero mantenemos la función por consistencia
    setFormData(prev => ({ 
      ...prev, 
      electionType: ELECTION_TYPES.LIST_BASED,
      availablePositions: ['PRESIDENTE', 'VICEPRESIDENTE'],
      listConfiguration: {
        ...prev.listConfiguration,
        enabled: true
      }
    }));
    setLocalError(null);
    setSuccess(null);
  };

  const handleListConfigurationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      listConfiguration: {
        ...prev.listConfiguration,
        [field]: value
      }
    }));
    setLocalError(null);
    setSuccess(null);
  };

  const handlePositionToggle = (position) => {
    const currentPositions = formData.availablePositions;
    let newPositions;

    if (currentPositions.includes(position)) {
      // No permitir desmarcar PRESIDENTE si es requerido y es el único
      if (position === 'PRESIDENTE' && currentPositions.length === 1) {
        setLocalError('El cargo de Presidente es requerido y debe estar incluido');
        return;
      }
      newPositions = currentPositions.filter(p => p !== position);
    } else {
      newPositions = [...currentPositions, position];
    }

    setFormData(prev => ({ ...prev, availablePositions: newPositions }));
    setLocalError(null);
    setSuccess(null);
  };


  const handleInfoChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setLocalError(null);
    setSuccess(null);
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    setLocalError(null);
    setSuccess(null);

    try {
      // Validaciones
      if (formData.availablePositions.length === 0) {
        throw new Error('Debe seleccionar al menos un cargo');
      }

      if (!formData.availablePositions.includes('PRESIDENTE')) {
        throw new Error('El cargo de Presidente es obligatorio');
      }

      if (!formData.electionName.trim()) {
        throw new Error('El nombre de la elección es requerido');
      }

      // Guardar configuración paso a paso
      const results = [];

      // 1. Tipo de elección
      if (formData.electionType !== config.electionType) {
        const result = await updateElectionType(formData.electionType);
        results.push(result);
        if (!result.success) throw new Error(result.error);
      }

      // 2. Cargos disponibles
      const currentPositions = config.availablePositions || [];
      if (JSON.stringify(formData.availablePositions.sort()) !== JSON.stringify(currentPositions.sort())) {
        const result = await updateAvailablePositions(formData.availablePositions);
        results.push(result);
        if (!result.success) throw new Error(result.error);
      }

      // 3. Configuración de listas (si es necesario)
      const currentListConfig = config.listConfiguration || {};
      const listConfigChanged = 
        formData.listConfiguration.enabled !== currentListConfig.enabled ||
        formData.listConfiguration.requireBothPositions !== currentListConfig.requireBothPositions ||
        formData.listConfiguration.presidentPriority !== currentListConfig.presidentPriority;

      if (listConfigChanged) {
        const result = await updateListConfiguration(formData.listConfiguration);
        results.push(result);
        if (!result.success) throw new Error(result.error);
      }

      // 4. Información de la elección
      const electionInfo = {
        electionName: formData.electionName,
        electionDate: formData.electionDate,
        votingPeriod: {
          startTime: formData.startTime,
          endTime: formData.endTime
        }
      };

      const infoChanged = 
        config.electionName !== formData.electionName ||
        config.electionDate !== formData.electionDate ||
        config.votingPeriod?.startTime !== formData.startTime ||
        config.votingPeriod?.endTime !== formData.endTime;

      if (infoChanged) {
        const result = await updateElectionInfo(electionInfo);
        results.push(result);
        if (!result.success) throw new Error(result.error);
      }

      setSuccess('✅ Configuración guardada exitosamente');
      console.log('✅ Configuración de elección actualizada');

    } catch (err) {
      console.error('❌ Error guardando configuración:', err);
      setLocalError('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const confirmMessage = `¿Está seguro de restaurar la configuración por defecto?

Esta acción:
• Restablecerá la configuración de votación por listas
• Configurará solo Presidente y Vicepresidente
• Establecerá la configuración estándar para todos los niveles
• NO eliminará candidatos ni estudiantes existentes

Escriba "CONFIRMAR" para proceder:`;

    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'CONFIRMAR') {
      setIsSaving(true);
      try {
        const result = await resetToDefaults();
        if (result.success) {
          setSuccess('✅ Configuración restablecida a valores por defecto');
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        setLocalError('Error al restablecer configuración: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    } else if (confirmation !== null) {
      setLocalError('Confirmación incorrecta. No se realizaron cambios.');
    }
  };


  if (!isConfigLoaded) {
    return (
      <div className="election-configurator loading">
        <div className="loading-message">
          ⏳ Cargando configuración de elección...
        </div>
      </div>
    );
  }

  return (
    <div className="election-configurator">
      <div className="configurator-header">
        <h3>⚙️ Configuración de Elección</h3>
        <div className="header-actions">
          <button 
            className="btn-reset"
            onClick={handleResetDefaults}
            disabled={loading || isSaving}
          >
            🔄 Restaurar Defecto
          </button>
          <button 
            className="btn-save"
            onClick={handleSaveConfiguration}
            disabled={loading || isSaving}
          >
            {isSaving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>
      </div>

      {(error || localError) && (
        <div className="error-message">
          ❌ {error || localError}
          <button onClick={() => { setLocalError(null); }}>✕</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      <div className="configurator-sections">
        {/* Resumen Actual */}
        <div className="config-summary">
          <h4>📋 Configuración Actual</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Sistema de Votación:</span>
              <span className="value">{getElectionTypeName()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Dignidades por Lista:</span>
              <span className="value">{getEnabledPositions().map(p => p.name).join(' + ')}</span>
            </div>
            <div className="summary-item">
              <span className="label">Fecha de Elección:</span>
              <span className="value">{config.electionDate}</span>
            </div>
            <div className="summary-item">
              <span className="label">Configuración:</span>
              <span className="value">Estándar para todos los niveles</span>
            </div>
          </div>
        </div>

        {/* Configuración de Listas */}
        <div className="config-section list-configuration">
            <h4>📋 Configuración de Listas</h4>
            <p className="section-description">
              Configure cómo funcionarán las listas de candidatos:
            </p>
            
            <div className="list-config-options">
              <div className="config-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.listConfiguration.requireBothPositions}
                    onChange={(e) => handleListConfigurationChange('requireBothPositions', e.target.checked)}
                    disabled={isSaving}
                  />
                  <span className="checkbox-text">
                    Requiere presidente y vicepresidente en cada lista
                  </span>
                </label>
                <p className="option-help">
                  Cada lista debe contener obligatoriamente un presidente y un vicepresidente.
                </p>
              </div>
              
              <div className="config-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.listConfiguration.presidentPriority}
                    onChange={(e) => handleListConfigurationChange('presidentPriority', e.target.checked)}
                    disabled={isSaving}
                  />
                  <span className="checkbox-text">
                    El presidente tiene prioridad en la lista
                  </span>
                </label>
                <p className="option-help">
                  El presidente se mostrará primero y será el candidato principal de la lista.
                </p>
              </div>
            </div>
            
            <div className="list-info-box">
              <h5>ℹ️ Información sobre votación por listas:</h5>
              <ul>
                <li>• Los estudiantes votan por una lista completa, no por candidatos individuales</li>
                <li>• Cada lista contiene un presidente y un vicepresidente</li>
                <li>• Al ganar una lista, ambos candidatos son elegidos automáticamente</li>
                <li>• Las listas se muestran con el presidente como candidato principal</li>
              </ul>
            </div>
          </div>

        {/* Dignidades Disponibles */}
        <div className="config-section">
          <h4>🏆 Dignidades Disponibles</h4>
          <p className="section-description">
            Para votación por listas, las dignidades se organizan automáticamente dentro de cada lista:
          </p>
          
          <div className="list-positions-info">
            <div className="position-in-list">
              <span className="position-icon">👑</span>
              <span className="position-name">Presidente</span>
              <span className="position-role">(Candidato principal de la lista)</span>
            </div>
            <div className="position-in-list">
              <span className="position-icon">🤝</span>
              <span className="position-name">Vicepresidente</span>
              <span className="position-role">(Candidato secundario de la lista)</span>
            </div>
          </div>
        </div>

        {/* Información de la Elección */}
        <div className="config-section">
          <h4>📅 Información de la Elección</h4>
          <div className="election-info-grid">
            <div className="info-group">
              <label htmlFor="electionName">Nombre de la Elección:</label>
              <input
                id="electionName"
                type="text"
                value={formData.electionName}
                onChange={(e) => handleInfoChange('electionName', e.target.value)}
                placeholder="Ej: Elecciones Estudiantiles 2024"
                disabled={isSaving}
              />
            </div>

            <div className="info-group">
              <label htmlFor="electionDate">Fecha de la Elección:</label>
              <input
                id="electionDate"
                type="date"
                value={formData.electionDate}
                onChange={(e) => handleInfoChange('electionDate', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="info-group">
              <label htmlFor="startTime">Hora de Inicio:</label>
              <input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInfoChange('startTime', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="info-group">
              <label htmlFor="endTime">Hora de Fin:</label>
              <input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInfoChange('endTime', e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionConfigurator;