// src/contexts/ElectionConfigContext.jsx
// Contexto para configuración de elecciones
import React, { createContext, useContext, useState, useEffect } from 'react';
import databaseService, { DOC_TYPES } from '../services/database-indexeddb.js';

const ElectionConfigContext = createContext();

// Tipos de elección disponibles
export const ELECTION_TYPES = {
  LIST_BASED: 'list_based'
};

// Configuración por defecto
export const DEFAULT_CONFIG = {
  electionType: ELECTION_TYPES.LIST_BASED,
  availablePositions: ['PRESIDENTE', 'VICEPRESIDENTE'],
  electionName: 'Elecciones Estudiantiles 2024',
  electionDate: new Date().toISOString().split('T')[0],
  votingPeriod: {
    startTime: '08:00',
    endTime: '16:00'
  },
  listConfiguration: {
    enabled: true,
    requireBothPositions: true, // Requiere presidente y vicepresidente en cada lista
    presidentPriority: true    // El presidente tiene prioridad en la lista
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Posiciones disponibles en el sistema
export const AVAILABLE_POSITIONS = [
  { key: 'PRESIDENTE', name: 'Presidente', required: true },
  { key: 'VICEPRESIDENTE', name: 'Vicepresidente', required: false },
  { key: 'SECRETARIO', name: 'Secretario', required: false },
  { key: 'TESORERO', name: 'Tesorero', required: false }
];

export const ElectionConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Cargar configuración desde la base de datos
  useEffect(() => {
    loadElectionConfig();
  }, []);

  const loadElectionConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await databaseService.findDocuments('election_config', {
        selector: { 
          type: DOC_TYPES.CONFIG,
          configType: 'election_settings'
        },
        limit: 1
      });

      if (result.success && result.docs.length > 0) {
        const savedConfig = result.docs[0];
        setConfig({
          ...DEFAULT_CONFIG,
          ...savedConfig,
          _id: savedConfig._id,
          _rev: savedConfig._rev
        });
        console.log('✅ Configuración de elección cargada:', savedConfig);
      } else {
        // No hay configuración guardada, usar la por defecto
        console.log('📝 Usando configuración por defecto');
        setConfig(DEFAULT_CONFIG);
      }
      
      setIsConfigLoaded(true);
    } catch (err) {
      console.error('❌ Error cargando configuración de elección:', err);
      setError('Error al cargar la configuración de elección');
      setConfig(DEFAULT_CONFIG);
      setIsConfigLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const saveElectionConfig = async (newConfig) => {
    setLoading(true);
    setError(null);

    try {
      const configToSave = {
        ...newConfig,
        type: DOC_TYPES.CONFIG,
        configType: 'election_settings',
        updatedAt: new Date().toISOString()
      };

      let result;
      if (config._id) {
        // Actualizar configuración existente
        result = await databaseService.updateDocument('election_config', {
          ...configToSave,
          _id: config._id,
          _rev: config._rev
        });
      } else {
        // Crear nueva configuración
        result = await databaseService.createDocument(
          'election_config',
          configToSave,
          DOC_TYPES.CONFIG
        );
      }

      if (result.success) {
        setConfig({
          ...configToSave,
          _id: result.id || config._id,
          _rev: result.rev || config._rev
        });
        console.log('✅ Configuración de elección guardada');
        return { success: true };
      } else {
        throw new Error(result.error || 'Error al guardar configuración');
      }
    } catch (err) {
      console.error('❌ Error guardando configuración:', err);
      setError('Error al guardar la configuración: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateElectionType = async (electionType) => {
    const newConfig = { ...config, electionType };
    return await saveElectionConfig(newConfig);
  };

  const updateAvailablePositions = async (positions) => {
    const newConfig = { ...config, availablePositions: positions };
    return await saveElectionConfig(newConfig);
  };


  const updateElectionInfo = async (info) => {
    const newConfig = { ...config, ...info };
    return await saveElectionConfig(newConfig);
  };

  const updateListConfiguration = async (listConfig) => {
    const newConfig = { 
      ...config, 
      listConfiguration: { ...config.listConfiguration, ...listConfig }
    };
    return await saveElectionConfig(newConfig);
  };

  const resetToDefaults = async () => {
    const resetConfig = {
      ...DEFAULT_CONFIG,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return await saveElectionConfig(resetConfig);
  };

  // Helper functions
  const isPositionEnabled = (position) => {
    return config.availablePositions.includes(position);
  };

  const getEnabledPositions = () => {
    return config.availablePositions.map(pos => 
      AVAILABLE_POSITIONS.find(ap => ap.key === pos)
    ).filter(Boolean);
  };

  const getElectionTypeName = () => {
    return 'Votación por listas';
  };


  const getConfigSummary = () => {
    return {
      type: getElectionTypeName(),
      positions: getEnabledPositions().map(p => p.name).join(', '),
      levelConfig: getLevelConfigurationName(),
      isActive: config.isActive
    };
  };

  const value = {
    // Estado
    config,
    loading,
    error,
    isConfigLoaded,
    
    // Acciones
    loadElectionConfig,
    saveElectionConfig,
    updateElectionType,
    updateAvailablePositions,
    updateElectionInfo,
    updateListConfiguration,
    resetToDefaults,
    
    // Helpers
    isPositionEnabled,
    getEnabledPositions,
    getElectionTypeName,
    getConfigSummary,
    
    // Constantes
    ELECTION_TYPES,
    AVAILABLE_POSITIONS
  };

  return (
    <ElectionConfigContext.Provider value={value}>
      {children}
    </ElectionConfigContext.Provider>
  );
};

export const useElectionConfig = () => {
  const context = useContext(ElectionConfigContext);
  if (!context) {
    throw new Error('useElectionConfig debe ser usado dentro de ElectionConfigProvider');
  }
  return context;
};

export default ElectionConfigContext;