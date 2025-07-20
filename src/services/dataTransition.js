// src/services/dataTransition.js
// Sistema de transición entre datos mock y reales

import databaseService, { DOC_TYPES } from './database-indexeddb.js';

// Datos mock como template
const MOCK_STUDENTS_TEMPLATE = [
  {
    cedula: "1234567890",
    nombre: "Ana María",
    apellidos: "González López",
    level: "BACHILLERATO",
    course: "3BGU-A",
    numero: 1,
    status: "active"
  },
  {
    cedula: "1234567891",
    nombre: "Carlos David",
    apellidos: "Rodríguez Silva",
    level: "BACHILLERATO", 
    course: "3BGU-A",
    numero: 2,
    status: "active"
  },
  {
    cedula: "1234567892",
    nombre: "María José",
    apellidos: "Martínez Cruz",
    level: "BACHILLERATO",
    course: "3BGU-B", 
    numero: 1,
    status: "active"
  },
  {
    cedula: "1234567893",
    nombre: "Luis Alberto",
    apellidos: "Hernández Vega",
    level: "BASICA_SUPERIOR",
    course: "10EGB-A",
    numero: 1,
    status: "active"
  },
  {
    cedula: "1234567894",
    nombre: "Carmen Elena",
    apellidos: "Torres Ruiz",
    level: "BASICA_SUPERIOR",
    course: "10EGB-A",
    numero: 2,
    status: "active"
  },
  {
    cedula: "1234567895",
    nombre: "Pedro Antonio",
    apellidos: "Jiménez Morales",
    level: "BASICA_SUPERIOR",
    course: "9EGB-A",
    numero: 1,
    status: "active"
  },
  {
    cedula: "1234567896",
    nombre: "Sofia Isabella",
    apellidos: "Castro Delgado",
    level: "BASICA_MEDIA",
    course: "8EGB-A",
    numero: 1,
    status: "active"
  },
  {
    cedula: "1234567897",
    nombre: "Miguel Ángel",
    apellidos: "Vargas Mendoza",
    level: "BASICA_MEDIA",
    course: "7EGB-A",
    numero: 1,
    status: "active"
  }
];

const MOCK_CANDIDATES_TEMPLATE = [
  {
    nombre: "Andrea",
    apellidos: "Morales Jiménez",
    cargo: "PRESIDENTE",
    level: "BACHILLERATO",
    ticketId: "ticket_1",
    foto: "",
    propuestas: "Mejora de infraestructura estudiantil",
    votos: 0
  },
  {
    nombre: "Roberto",
    apellidos: "García López",
    cargo: "VICEPRESIDENTE", 
    level: "BACHILLERATO",
    ticketId: "ticket_1",
    foto: "",
    propuestas: "Más actividades extracurriculares",
    votos: 0
  },
  {
    nombre: "Valentina",
    apellidos: "Cruz Silva",
    cargo: "PRESIDENTE",
    level: "BASICA_SUPERIOR",
    ticketId: "ticket_2",
    foto: "",
    propuestas: "Mejor alimentación escolar",
    votos: 0
  },
  {
    nombre: "Diego",
    apellidos: "Mendez Torres",
    cargo: "VICEPRESIDENTE",
    level: "BASICA_SUPERIOR", 
    ticketId: "ticket_2",
    foto: "",
    propuestas: "Más espacios recreativos",
    votos: 0
  },
  {
    nombre: "Isabella",
    apellidos: "Ramírez Vargas",
    cargo: "PRESIDENTE",
    level: "BASICA_MEDIA",
    ticketId: "ticket_3",
    foto: "",
    propuestas: "Tecnología en aulas",
    votos: 0
  },
  {
    nombre: "Sebastián",
    apellidos: "López Castro",
    cargo: "VICEPRESIDENTE",
    level: "BASICA_MEDIA",
    ticketId: "ticket_3", 
    foto: "",
    propuestas: "Bibliotecas digitales",
    votos: 0
  }
];

class DataTransitionService {
  constructor() {
    this.transitionLog = [];
    this.currentDataType = null; // 'mock' | 'real' | 'mixed'
    this.backupData = {};
  }

  /**
   * Detectar tipo de datos actual
   */
  async detectCurrentDataType() {
    try {
      const studentsResult = await databaseService.findDocuments('students', {
        selector: { type: DOC_TYPES.STUDENT },
        limit: 10
      });

      const students = studentsResult.docs || [];
      
      if (students.length === 0) {
        this.currentDataType = null;
        return null;
      }

      // Verificar si son datos mock (cédulas secuenciales empezando por 123456789X)
      const mockPattern = /^123456789\d$/;
      const mockCount = students.filter(s => mockPattern.test(s.cedula)).length;
      const realCount = students.length - mockCount;

      if (mockCount === students.length) {
        this.currentDataType = 'mock';
      } else if (realCount === students.length) {
        this.currentDataType = 'real';
      } else {
        this.currentDataType = 'mixed';
      }

      this.log(`📊 Tipo de datos detectado: ${this.currentDataType} (${mockCount} mock, ${realCount} reales)`);
      return {
        type: this.currentDataType,
        mockCount,
        realCount,
        totalCount: students.length
      };
    } catch (error) {
      this.log(`❌ Error detectando tipo de datos: ${error.message}`);
      return null;
    }
  }

  /**
   * Crear backup completo de datos actuales
   */
  async createBackup(backupName = `backup_${Date.now()}`) {
    try {
      this.log(`📦 Creando backup: ${backupName}...`);

      const backup = {
        name: backupName,
        timestamp: new Date().toISOString(),
        dataType: this.currentDataType,
        data: {}
      };

      // Backup de estudiantes
      const studentsResult = await databaseService.findDocuments('students', {
        selector: { type: DOC_TYPES.STUDENT }
      });
      backup.data.students = studentsResult.docs || [];

      // Backup de candidatos
      const candidatesResult = await databaseService.findDocuments('candidates', {
        selector: { type: DOC_TYPES.CANDIDATE }
      });
      backup.data.candidates = candidatesResult.docs || [];

      // Backup de votos
      const votesResult = await databaseService.findDocuments('votes', {
        selector: { type: DOC_TYPES.VOTE }
      });
      backup.data.votes = votesResult.docs || [];

      // Guardar backup en la base de datos
      const result = await databaseService.createDocument('election_config', backup, 'backup');
      
      if (result.success) {
        this.backupData[backupName] = backup;
        this.log(`✅ Backup creado exitosamente: ${backupName} (${backup.data.students.length} estudiantes, ${backup.data.candidates.length} candidatos, ${backup.data.votes.length} votos)`);
        return { success: true, backup };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.log(`❌ Error creando backup: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaurar datos desde backup
   */
  async restoreFromBackup(backupName) {
    try {
      this.log(`🔄 Restaurando desde backup: ${backupName}...`);

      // Buscar backup en la base de datos
      const backupsResult = await databaseService.findDocuments('election_config', {
        selector: { 
          type: 'backup',
          name: backupName
        }
      });

      if (!backupsResult.docs || backupsResult.docs.length === 0) {
        throw new Error(`Backup no encontrado: ${backupName}`);
      }

      const backup = backupsResult.docs[0];

      // Crear backup de datos actuales antes de restaurar
      await this.createBackup(`pre_restore_${Date.now()}`);

      // Limpiar datos actuales
      await this.clearAllData();

      // Restaurar estudiantes
      if (backup.data.students && backup.data.students.length > 0) {
        const studentsResult = await databaseService.bulkCreate('students', backup.data.students, DOC_TYPES.STUDENT);
        this.log(`✅ Restaurados ${studentsResult.successful} estudiantes`);
      }

      // Restaurar candidatos
      if (backup.data.candidates && backup.data.candidates.length > 0) {
        const candidatesResult = await databaseService.bulkCreate('candidates', backup.data.candidates, DOC_TYPES.CANDIDATE);
        this.log(`✅ Restaurados ${candidatesResult.successful} candidatos`);
      }

      // Restaurar votos
      if (backup.data.votes && backup.data.votes.length > 0) {
        const votesResult = await databaseService.bulkCreate('votes', backup.data.votes, DOC_TYPES.VOTE);
        this.log(`✅ Restaurados ${votesResult.successful} votos`);
      }

      this.currentDataType = backup.dataType;
      this.log(`✅ Restauración completada desde: ${backupName}`);
      
      return { success: true, restored: backup };
    } catch (error) {
      this.log(`❌ Error en restauración: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resetear a datos mock limpios
   */
  async resetToMockData() {
    try {
      this.log('🔄 Reseteando a datos mock limpios...');

      // Crear backup antes del reset
      await this.createBackup(`pre_mock_reset_${Date.now()}`);

      // Limpiar todos los datos
      await this.clearAllData();

      // Insertar datos mock template
      const studentsResult = await databaseService.bulkCreate('students', MOCK_STUDENTS_TEMPLATE, DOC_TYPES.STUDENT);
      const candidatesResult = await databaseService.bulkCreate('candidates', MOCK_CANDIDATES_TEMPLATE, DOC_TYPES.CANDIDATE);

      this.currentDataType = 'mock';
      this.log(`✅ Reset a datos mock completado (${studentsResult.successful} estudiantes, ${candidatesResult.successful} candidatos)`);

      return {
        success: true,
        students: studentsResult.successful,
        candidates: candidatesResult.successful
      };
    } catch (error) {
      this.log(`❌ Error en reset a mock: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Importar datos reales con validación robusta
   */
  async importRealData(studentsData, options = {}) {
    const {
      chunkSize = 100,
      validateDuplicates = true,
      backupFirst = true,
      rollbackOnError = true
    } = options;

    try {
      this.log(`🚀 Iniciando importación de ${studentsData.length} estudiantes reales...`);

      // Crear backup si se solicita
      if (backupFirst) {
        await this.createBackup(`pre_real_import_${Date.now()}`);
      }

      // Validación de duplicados
      if (validateDuplicates) {
        const duplicatesResult = await this.validateDuplicates(studentsData);
        if (!duplicatesResult.valid) {
          throw new Error(`Duplicados encontrados: ${duplicatesResult.duplicates.join(', ')}`);
        }
      }

      // Importación por chunks
      const chunks = this.chunkArray(studentsData, chunkSize);
      let totalImported = 0;
      const errors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        this.log(`📦 Procesando chunk ${i + 1}/${chunks.length} (${chunk.length} estudiantes)...`);

        try {
          const result = await databaseService.bulkCreate('students', chunk, DOC_TYPES.STUDENT);
          if (result.success) {
            totalImported += result.successful;
            this.log(`✅ Chunk ${i + 1} importado: ${result.successful} estudiantes`);
          } else {
            throw new Error(result.error);
          }
        } catch (chunkError) {
          this.log(`❌ Error en chunk ${i + 1}: ${chunkError.message}`);
          errors.push({ chunk: i + 1, error: chunkError.message });
          
          if (rollbackOnError) {
            this.log('🔄 Iniciando rollback...');
            await this.rollbackLastImport();
            throw new Error(`Importación fallida en chunk ${i + 1}, rollback completado`);
          }
        }
      }

      this.currentDataType = 'real';
      this.log(`✅ Importación de datos reales completada: ${totalImported} estudiantes`);

      return {
        success: true,
        imported: totalImported,
        total: studentsData.length,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      this.log(`❌ Error en importación de datos reales: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validar duplicados en datos a importar
   */
  async validateDuplicates(newStudents) {
    try {
      // Obtener estudiantes existentes
      const existingResult = await databaseService.findDocuments('students', {
        selector: { type: DOC_TYPES.STUDENT }
      });
      const existingStudents = existingResult.docs || [];
      
      const existingCedulas = new Set(existingStudents.map(s => s.cedula));
      const newCedulas = newStudents.map(s => s.cedula);
      
      // Buscar duplicados
      const duplicates = newCedulas.filter(cedula => existingCedulas.has(cedula));
      
      return {
        valid: duplicates.length === 0,
        duplicates,
        total: newStudents.length,
        existing: existingStudents.length
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Limpiar todos los datos
   */
  async clearAllData() {
    try {
      this.log('🗑️ Limpiando todos los datos...');

      const collections = ['students', 'candidates', 'votes'];
      for (const collection of collections) {
        const result = await databaseService.findDocuments(collection, {
          selector: {}
        });
        
        if (result.docs && result.docs.length > 0) {
          for (const doc of result.docs) {
            await databaseService.deleteDocument(collection, doc._id, doc._rev);
          }
          this.log(`🗑️ Eliminados ${result.docs.length} documentos de ${collection}`);
        }
      }

      this.log('✅ Limpieza de datos completada');
    } catch (error) {
      this.log(`❌ Error limpiando datos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback de última importación
   */
  async rollbackLastImport() {
    try {
      // Buscar el backup más reciente
      const backupsResult = await databaseService.findDocuments('election_config', {
        selector: { type: 'backup' }
      });

      if (!backupsResult.docs || backupsResult.docs.length === 0) {
        throw new Error('No hay backups disponibles para rollback');
      }

      const latestBackup = backupsResult.docs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      return await this.restoreFromBackup(latestBackup.name);
    } catch (error) {
      this.log(`❌ Error en rollback: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de transición
   */
  async getTransitionStats() {
    try {
      const dataTypeInfo = await this.detectCurrentDataType();
      
      const backupsResult = await databaseService.findDocuments('election_config', {
        selector: { type: 'backup' }
      });

      const stats = {
        currentDataType: dataTypeInfo,
        totalBackups: backupsResult.docs ? backupsResult.docs.length : 0,
        lastTransition: this.transitionLog.length > 0 ? this.transitionLog[this.transitionLog.length - 1] : null,
        availableActions: this.getAvailableActions()
      };

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtener acciones disponibles según el estado actual
   */
  getAvailableActions() {
    const actions = ['createBackup', 'resetToMock'];
    
    if (this.currentDataType === 'mock') {
      actions.push('importReal');
    } else if (this.currentDataType === 'real') {
      actions.push('rollbackToMock');
    } else if (this.currentDataType === 'mixed') {
      actions.push('cleanupMixed', 'rollbackToMock');
    }

    return actions;
  }

  /**
   * Exportar template de datos mock
   */
  exportMockTemplate() {
    return {
      students: MOCK_STUDENTS_TEMPLATE,
      candidates: MOCK_CANDIDATES_TEMPLATE,
      metadata: {
        version: '2.0',
        type: 'mock_template',
        generated: new Date().toISOString(),
        description: 'Template de datos mock para desarrollo y testing'
      }
    };
  }

  /**
   * Utility: dividir array en chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Logging interno
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.transitionLog.push(logEntry);
    console.log(`🔄 DataTransition: ${message}`);
  }

  /**
   * Obtener log de transiciones
   */
  getTransitionLog() {
    return this.transitionLog;
  }
}

// Singleton instance
const dataTransitionService = new DataTransitionService();

export default dataTransitionService;
export { dataTransitionService, DataTransitionService };