// src/services/educationLevels.js
// Service for managing configurable education levels

import { DEFAULT_EDUCATION_LEVELS, EDUCATION_LEVEL_NAMES } from './database-indexeddb.js';

/**
 * Education Levels Management Service
 * Allows configuration and customization of education levels for different institutions
 */
class EducationLevelsService {
  constructor() {
    this.storageKey = 'votaciones_education_levels_config';
    this.levelsCache = null;
    this.namesCache = null;
  }

  /**
   * Get current education levels (default + custom)
   */
  getEducationLevels() {
    if (this.levelsCache) {
      return this.levelsCache;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const config = JSON.parse(stored);
        this.levelsCache = { ...DEFAULT_EDUCATION_LEVELS, ...config.customLevels };
        return this.levelsCache;
      }
    } catch (error) {
      console.warn('Error loading custom education levels:', error);
    }

    this.levelsCache = DEFAULT_EDUCATION_LEVELS;
    return this.levelsCache;
  }

  /**
   * Get education level display names
   */
  getEducationLevelNames() {
    if (this.namesCache) {
      return this.namesCache;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const config = JSON.parse(stored);
        this.namesCache = { ...EDUCATION_LEVEL_NAMES, ...config.customNames };
        return this.namesCache;
      }
    } catch (error) {
      console.warn('Error loading custom education level names:', error);
    }

    this.namesCache = EDUCATION_LEVEL_NAMES;
    return this.namesCache;
  }

  /**
   * Get education levels as array of objects for forms
   */
  getEducationLevelsForForm() {
    const levels = this.getEducationLevels();
    const names = this.getEducationLevelNames();
    
    return Object.entries(levels).map(([key, value]) => ({
      key,
      value,
      label: names[key] || key,
      isCustom: !DEFAULT_EDUCATION_LEVELS.hasOwnProperty(key)
    }));
  }

  /**
   * Add a custom education level
   */
  addEducationLevel(key, displayName) {
    try {
      const normalizedKey = key.toUpperCase().replace(/\s+/g, '_');
      
      // Validate key
      if (!normalizedKey || normalizedKey.length < 2) {
        throw new Error('La clave del nivel debe tener al menos 2 caracteres');
      }

      if (!/^[A-Z_]+$/.test(normalizedKey)) {
        throw new Error('La clave solo puede contener letras mayúsculas y guiones bajos');
      }

      // Validate display name
      if (!displayName || displayName.trim().length < 2) {
        throw new Error('El nombre del nivel debe tener al menos 2 caracteres');
      }

      const config = this.getStoredConfig();
      
      // Add to custom levels
      config.customLevels[normalizedKey] = normalizedKey;
      config.customNames[normalizedKey] = displayName.trim();

      // Save
      localStorage.setItem(this.storageKey, JSON.stringify(config));
      
      // Clear cache
      this.levelsCache = null;
      this.namesCache = null;

      return {
        success: true,
        key: normalizedKey,
        displayName: displayName.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update education level display name
   */
  updateEducationLevelName(key, newDisplayName) {
    try {
      if (!newDisplayName || newDisplayName.trim().length < 2) {
        throw new Error('El nombre del nivel debe tener al menos 2 caracteres');
      }

      const config = this.getStoredConfig();
      
      // Check if it's a default level
      if (DEFAULT_EDUCATION_LEVELS.hasOwnProperty(key)) {
        // For default levels, only store the name override
        config.customNames[key] = newDisplayName.trim();
      } else {
        // For custom levels, update the name
        if (!config.customLevels.hasOwnProperty(key)) {
          throw new Error('El nivel educativo no existe');
        }
        config.customNames[key] = newDisplayName.trim();
      }

      localStorage.setItem(this.storageKey, JSON.stringify(config));
      
      // Clear cache
      this.namesCache = null;

      return {
        success: true,
        key,
        displayName: newDisplayName.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove a custom education level
   */
  removeEducationLevel(key) {
    try {
      // Cannot remove default levels
      if (DEFAULT_EDUCATION_LEVELS.hasOwnProperty(key)) {
        throw new Error('No se pueden eliminar los niveles educativos por defecto');
      }

      const config = this.getStoredConfig();
      
      // Remove from custom levels and names
      delete config.customLevels[key];
      delete config.customNames[key];

      localStorage.setItem(this.storageKey, JSON.stringify(config));
      
      // Clear cache
      this.levelsCache = null;
      this.namesCache = null;

      return {
        success: true,
        removedKey: key
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset to default education levels
   */
  resetToDefaults() {
    try {
      localStorage.removeItem(this.storageKey);
      
      // Clear cache
      this.levelsCache = null;
      this.namesCache = null;

      return {
        success: true,
        message: 'Niveles educativos restaurados a los valores por defecto'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate if an education level is valid
   */
  isValidEducationLevel(level) {
    const levels = this.getEducationLevels();
    return Object.values(levels).includes(level);
  }

  /**
   * Get display name for a level
   */
  getDisplayName(level) {
    const names = this.getEducationLevelNames();
    return names[level] || level;
  }

  /**
   * Export current configuration
   */
  exportConfiguration() {
    const config = this.getStoredConfig();
    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      educationLevels: {
        default: DEFAULT_EDUCATION_LEVELS,
        defaultNames: EDUCATION_LEVEL_NAMES,
        custom: config.customLevels,
        customNames: config.customNames
      }
    };
  }

  /**
   * Import configuration
   */
  importConfiguration(configData) {
    try {
      if (!configData.educationLevels) {
        throw new Error('Configuración inválida: falta educationLevels');
      }

      const newConfig = {
        customLevels: configData.educationLevels.custom || {},
        customNames: configData.educationLevels.customNames || {},
        importDate: new Date().toISOString(),
        importVersion: configData.version || '1.0'
      };

      localStorage.setItem(this.storageKey, JSON.stringify(newConfig));
      
      // Clear cache
      this.levelsCache = null;
      this.namesCache = null;

      return {
        success: true,
        imported: {
          customLevels: Object.keys(newConfig.customLevels).length,
          customNames: Object.keys(newConfig.customNames).length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get stored configuration or create default
   */
  getStoredConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error parsing stored education levels config:', error);
    }

    return {
      customLevels: {},
      customNames: {},
      createdDate: new Date().toISOString()
    };
  }

  /**
   * Get statistics about current configuration
   */
  getConfigurationStats() {
    const config = this.getStoredConfig();
    const allLevels = this.getEducationLevels();
    const allNames = this.getEducationLevelNames();

    return {
      totalLevels: Object.keys(allLevels).length,
      defaultLevels: Object.keys(DEFAULT_EDUCATION_LEVELS).length,
      customLevels: Object.keys(config.customLevels).length,
      customNames: Object.keys(config.customNames).length,
      hasCustomizations: Object.keys(config.customLevels).length > 0 || Object.keys(config.customNames).length > 0,
      levels: this.getEducationLevelsForForm()
    };
  }
}

// Create singleton instance
const educationLevelsService = new EducationLevelsService();

export default educationLevelsService;
export { EducationLevelsService };