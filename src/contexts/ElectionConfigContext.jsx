// src/contexts/ElectionConfigContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import databaseService, { DOC_TYPES } from '../services/database-indexeddb.js';

const ElectionConfigContext = createContext();

/**
 * ElectionConfigContext - Manages election configuration and settings
 * Integrates with PouchDB for persistent storage with localStorage fallback
 */
export const ElectionConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Default election configuration
  const DEFAULT_CONFIG = {
    electionName: 'Elecciones Estudiantiles 2024',
    electionDate: '2024-03-15',
    electionStatus: 'pending', // pending, active, completed, suspended
    allowVoting: false,
    requireAuthentication: true,
    maxVotesPerStudent: 2, // president + vice president
    votingTimeLimit: 300, // 5 minutes in seconds
    educationLevels: [
      'BACHILLERATO',
      'BASICA_SUPERIOR',
      'BASICA_MEDIA',
      'BASICA_ELEMENTAL'
    ],
    availablePositions: [
      { id: 'presidente', name: 'Presidente', level: 'all' },
      { id: 'vicepresidente', name: 'Vicepresidente', level: 'all' }
    ],
    institutionInfo: {
      name: 'Unidad Educativa',
      totalStudents: 700,
      totalCourses: 28,
      academicYear: '2023-2024'
    },
    votingRules: {
      allowAbstention: false,
      requireCompleteVote: true,
      allowVoteChange: false,
      showRealTimeResults: false
    },
    systemSettings: {
      autoBackup: true,
      backupInterval: 300000, // 5 minutes
      sessionTimeout: 1800000, // 30 minutes
      enableLogging: true,
      debugMode: false
    },
    ui: {
      theme: 'default',
      showCandidatePhotos: true,
      showCandidateProposals: true,
      enableKioskMode: true,
      language: 'es'
    }
  };

  // Check if database is ready
  useEffect(() => {
    const checkDbReady = () => {
      if (databaseService.isReady()) {
        setIsDbReady(true);
      } else {
        setTimeout(checkDbReady, 100);
      }
    };
    checkDbReady();
  }, []);

  // Load configuration when database is ready
  useEffect(() => {
    if (isDbReady) {
      loadConfiguration();
    }
  }, [isDbReady]);

  /**
   * Load configuration from PouchDB with localStorage fallback
   */
  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from PouchDB first
      const configFromDB = await loadConfigFromDB();
      
      if (configFromDB && Object.keys(configFromDB).length > 0) {
        setConfig({ ...DEFAULT_CONFIG, ...configFromDB });
        setLastSync(new Date().toISOString());
      } else {
        // Check localStorage fallback
        const configFromStorage = loadConfigFromLocalStorage();
        
        if (configFromStorage && Object.keys(configFromStorage).length > 0) {
          // Migrate from localStorage to PouchDB
          await migrateConfigToDB(configFromStorage);
          setConfig({ ...DEFAULT_CONFIG, ...configFromStorage });
        } else {
          // Initialize with default configuration
          await initializeDefaultConfig();
        }
      }
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError(err.message);
      
      // Fallback to localStorage or default
      const fallbackConfig = loadConfigFromLocalStorage() || DEFAULT_CONFIG;
      setConfig(fallbackConfig);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load configuration from PouchDB
   */
  const loadConfigFromDB = async () => {
    try {
      const result = await databaseService.findDocuments('election_config', {
        selector: {
          type: DOC_TYPES.CONFIG
        },
        sort: [{ updatedAt: 'desc' }],
        limit: 1
      });

      if (result.docs && result.docs.length > 0) {
        const configDoc = result.docs[0];
        // Remove PouchDB metadata from config
        const { _id, _rev, type, createdAt, updatedAt, ...cleanConfig } = configDoc;
        return cleanConfig;
      }

      return {};
    } catch (err) {
      console.error('Failed to load config from PouchDB:', err);
      return {};
    }
  };

  /**
   * Load configuration from localStorage (fallback)
   */
  const loadConfigFromLocalStorage = () => {
    try {
      const savedConfig = localStorage.getItem('election_config');
      return savedConfig ? JSON.parse(savedConfig) : null;
    } catch (err) {
      console.error('Failed to load config from localStorage:', err);
      return null;
    }
  };

  /**
   * Migrate configuration from localStorage to PouchDB
   */
  const migrateConfigToDB = async (configData) => {
    try {
      console.log('Migrating election config from localStorage to PouchDB...');
      
      const result = await databaseService.createDocument('election_config', {
        ...configData,
        migratedFrom: 'localStorage',
        migrationTimestamp: new Date().toISOString()
      }, DOC_TYPES.CONFIG);

      if (result.success) {
        console.log('✅ Election config migrated successfully');
        // Clear from localStorage after successful migration
        localStorage.removeItem('election_config');
      }

      return result;
    } catch (err) {
      console.error('Failed to migrate config to PouchDB:', err);
      throw err;
    }
  };

  /**
   * Initialize default configuration
   */
  const initializeDefaultConfig = async () => {
    try {
      console.log('Initializing default election configuration...');
      
      const result = await databaseService.createDocument('election_config', {
        ...DEFAULT_CONFIG,
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      }, DOC_TYPES.CONFIG);

      if (result.success) {
        setConfig(DEFAULT_CONFIG);
        console.log('✅ Default configuration initialized');
      }

      return result;
    } catch (err) {
      console.error('Failed to initialize default config:', err);
      setConfig(DEFAULT_CONFIG);
      throw err;
    }
  };

  /**
   * Update configuration
   */
  const updateConfig = async (updates) => {
    setLoading(true);
    setError(null);

    try {
      const newConfig = { ...config, ...updates };
      
      // Save to PouchDB if available
      if (isDbReady) {
        // Find existing config document
        const existingResult = await databaseService.findDocuments('election_config', {
          selector: { type: DOC_TYPES.CONFIG },
          sort: [{ updatedAt: 'desc' }],
          limit: 1
        });

        if (existingResult.docs && existingResult.docs.length > 0) {
          // Update existing document
          const existingDoc = existingResult.docs[0];
          const result = await databaseService.updateDocument('election_config', {
            ...existingDoc,
            ...newConfig,
            lastModified: new Date().toISOString()
          });

          if (result.success) {
            setConfig(newConfig);
            setLastSync(new Date().toISOString());
          }
        } else {
          // Create new document
          const result = await databaseService.createDocument('election_config', newConfig, DOC_TYPES.CONFIG);
          
          if (result.success) {
            setConfig(newConfig);
            setLastSync(new Date().toISOString());
          }
        }
      }

      // Always save to localStorage as backup
      localStorage.setItem('election_config', JSON.stringify(newConfig));
      
      return { success: true };
    } catch (err) {
      console.error('Failed to update configuration:', err);
      setError(err.message);
      
      // Fallback to localStorage only
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      localStorage.setItem('election_config', JSON.stringify(newConfig));
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset configuration to defaults
   */
  const resetConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateConfig(DEFAULT_CONFIG);
      console.log('Configuration reset to defaults');
      return { success: true };
    } catch (err) {
      console.error('Failed to reset configuration:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export configuration
   */
  const exportConfig = () => {
    try {
      const exportData = {
        ...config,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `election-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      console.error('Failed to export configuration:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Import configuration from file
   */
  const importConfig = async (configData) => {
    try {
      // Validate configuration structure
      if (!configData || typeof configData !== 'object') {
        throw new Error('Invalid configuration data');
      }

      // Merge with defaults to ensure all required fields exist
      const validatedConfig = { ...DEFAULT_CONFIG, ...configData };
      
      await updateConfig(validatedConfig);
      console.log('Configuration imported successfully');
      return { success: true };
    } catch (err) {
      console.error('Failed to import configuration:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Get specific configuration value
   */
  const getConfigValue = (key, defaultValue = null) => {
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  };

  /**
   * Check if voting is allowed
   */
  const isVotingAllowed = () => {
    return config.allowVoting && config.electionStatus === 'active';
  };

  /**
   * Get election status info
   */
  const getElectionStatus = () => {
    return {
      status: config.electionStatus || 'pending',
      allowVoting: config.allowVoting || false,
      electionDate: config.electionDate,
      electionName: config.electionName,
      isActive: isVotingAllowed()
    };
  };

  /**
   * Start election (set status to active)
   */
  const startElection = async () => {
    return await updateConfig({
      electionStatus: 'active',
      allowVoting: true,
      electionStartedAt: new Date().toISOString()
    });
  };

  /**
   * End election (set status to completed)
   */
  const endElection = async () => {
    return await updateConfig({
      electionStatus: 'completed',
      allowVoting: false,
      electionEndedAt: new Date().toISOString()
    });
  };

  /**
   * Suspend election temporarily
   */
  const suspendElection = async () => {
    return await updateConfig({
      electionStatus: 'suspended',
      allowVoting: false,
      electionSuspendedAt: new Date().toISOString()
    });
  };

  /**
   * Get configuration statistics
   */
  const getConfigStats = () => {
    return {
      totalPositions: config.availablePositions?.length || 0,
      totalLevels: config.educationLevels?.length || 0,
      totalStudents: config.institutionInfo?.totalStudents || 0,
      totalCourses: config.institutionInfo?.totalCourses || 0,
      lastUpdate: lastSync,
      isDbConnected: isDbReady,
      configVersion: config.version || '1.0.0'
    };
  };

  const value = {
    config,
    loading,
    error,
    isDbReady,
    lastSync,
    
    // Configuration management
    loadConfiguration,
    updateConfig,
    resetConfig,
    exportConfig,
    importConfig,
    getConfigValue,
    
    // Election control
    isVotingAllowed,
    getElectionStatus,
    startElection,
    endElection,
    suspendElection,
    
    // Statistics and info
    getConfigStats,
    
    // Default configuration reference
    DEFAULT_CONFIG
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
    throw new Error('useElectionConfig must be used within ElectionConfigProvider');
  }
  return context;
};

export default ElectionConfigContext;