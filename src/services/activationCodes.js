// src/services/activationCodes.js
// Servicio para manejar códigos de activación dinámicos

import databaseService, { DOC_TYPES } from './database-indexeddb.js';

/**
 * Servicio para gestión de códigos de activación dinámicos
 */
class ActivationCodesService {
  
  /**
   * Generar código aleatorio único
   */
  generateRandomCode() {
    const prefix = 'VOTACION-';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + result;
  }

  /**
   * Detectar nivel educativo basado en el nombre del curso
   */
  detectEducationLevel(courseName) {
    const course = courseName.toLowerCase();
    
    if (course.includes('bach')) {
      return { level: 'BACHILLERATO', name: 'Bachillerato' };
    } else if (course.match(/^(8vo|9no|10mo|octavo|noveno|decimo)/)) {
      return { level: 'BASICA_SUPERIOR', name: 'Básica Superior' };
    } else if (course.match(/^(5to|6to|7mo|quinto|sexto|septimo)/)) {
      return { level: 'BASICA_MEDIA', name: 'Básica Media' };
    } else if (course.match(/^(1ro|2do|3ro|4to|primero|segundo|tercero|cuarto)/) && !course.includes('bach')) {
      return { level: 'BASICA_ELEMENTAL', name: 'Básica Elemental' };
    } else if (course.match(/^(inicial|pre|preparatoria)/)) {
      return { level: 'PREPARATORIA', name: 'Preparatoria' };
    } else {
      return { level: 'OTROS', name: 'Otros' };
    }
  }

  /**
   * Obtener todos los cursos únicos de la base de datos
   */
  async getAvailableCourses() {
    try {
      console.log('📚 ActivationCodes: Obteniendo cursos disponibles...');
      
      const result = await databaseService.findDocuments('students', {
        selector: { type: DOC_TYPES.STUDENT }
      });

      if (result.success && result.docs) {
        const courses = [...new Set(
          result.docs.map(student => student.curso || student.course).filter(Boolean)
        )].sort();
        
        console.log('📋 ActivationCodes: Cursos encontrados:', courses);
        return courses;
      } else {
        console.log('⚠️ ActivationCodes: No se encontraron estudiantes');
        return [];
      }
    } catch (error) {
      console.error('❌ ActivationCodes: Error obteniendo cursos:', error);
      return [];
    }
  }

  /**
   * Generar códigos automáticamente para todos los cursos
   */
  async generateCodesForAllCourses() {
    try {
      console.log('🔧 ActivationCodes: Generando códigos automáticamente...');
      
      const courses = await this.getAvailableCourses();
      if (courses.length === 0) {
        throw new Error('No hay cursos disponibles en la base de datos');
      }

      const generatedCodes = [];
      const timestamp = new Date().toISOString();

      for (const course of courses) {
        // Verificar si ya existe un código activo para este curso
        const existingResult = await databaseService.findDocuments('activation_codes', {
          selector: { 
            type: DOC_TYPES.ACTIVATION_CODE,
            course: course,
            is_active: true
          }
        });

        if (existingResult.success && existingResult.docs.length > 0) {
          console.log(`⚠️ Ya existe código activo para: ${course}`);
          generatedCodes.push(existingResult.docs[0]);
          continue;
        }

        // Generar código único
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          code = this.generateRandomCode();
          const checkResult = await databaseService.findDocuments('activation_codes', {
            selector: { 
              type: DOC_TYPES.ACTIVATION_CODE,
              code: code
            }
          });
          
          if (!checkResult.success || checkResult.docs.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          throw new Error(`No se pudo generar código único para ${course}`);
        }

        // Detectar nivel educativo
        const levelInfo = this.detectEducationLevel(course);

        // Crear registro del código
        const codeRecord = {
          _id: `activation_${code}`,
          type: DOC_TYPES.ACTIVATION_CODE,
          code: code,
          course: course,
          level: levelInfo.level,
          level_name: levelInfo.name,
          generated_by: 'admin',
          generated_at: timestamp,
          is_active: true,
          used_count: 0,
          last_used_at: null,
          last_used_by: null
        };

        // Guardar en base de datos
        const saveResult = await databaseService.createDocument(
          'activation_codes', 
          codeRecord, 
          DOC_TYPES.ACTIVATION_CODE
        );

        if (saveResult.success) {
          console.log(`✅ Código generado para "${course}": ${code}`);
          generatedCodes.push(codeRecord);
        } else {
          console.error(`❌ Error guardando código para ${course}:`, saveResult.error);
        }
      }

      console.log(`🎉 Generación completada: ${generatedCodes.length} códigos`);
      return {
        success: true,
        codes: generatedCodes,
        total: generatedCodes.length
      };

    } catch (error) {
      console.error('❌ ActivationCodes: Error generando códigos:', error);
      return {
        success: false,
        error: error.message,
        codes: []
      };
    }
  }

  /**
   * Obtener todos los códigos activos
   */
  async getActiveCodes() {
    try {
      const result = await databaseService.findDocuments('activation_codes', {
        selector: { 
          type: DOC_TYPES.ACTIVATION_CODE,
          is_active: true
        }
      });

      if (result.success) {
        // Ordenar por curso
        const codes = result.docs.sort((a, b) => a.course.localeCompare(b.course));
        return {
          success: true,
          codes: codes
        };
      } else {
        return {
          success: false,
          error: result.error,
          codes: []
        };
      }
    } catch (error) {
      console.error('❌ ActivationCodes: Error obteniendo códigos activos:', error);
      return {
        success: false,
        error: error.message,
        codes: []
      };
    }
  }

  /**
   * Validar código de activación
   */
  async validateCode(code) {
    try {
      console.log('🔍 ActivationCodes: Validando código:', code);

      const result = await databaseService.findDocuments('activation_codes', {
        selector: { 
          type: DOC_TYPES.ACTIVATION_CODE,
          code: code,
          is_active: true
        }
      });

      if (result.success && result.docs.length > 0) {
        const codeData = result.docs[0];
        console.log('✅ ActivationCodes: Código válido para curso:', codeData.course);
        
        return {
          valid: true,
          data: codeData
        };
      } else {
        console.log('❌ ActivationCodes: Código inválido o inactivo');
        return {
          valid: false,
          error: 'Código de activación inválido o inactivo'
        };
      }
    } catch (error) {
      console.error('❌ ActivationCodes: Error validando código:', error);
      return {
        valid: false,
        error: 'Error al validar código'
      };
    }
  }

  /**
   * Marcar código como usado
   */
  async markCodeAsUsed(code, tutorName) {
    try {
      const result = await databaseService.findDocuments('activation_codes', {
        selector: { 
          type: DOC_TYPES.ACTIVATION_CODE,
          code: code
        }
      });

      if (result.success && result.docs.length > 0) {
        const codeData = result.docs[0];
        
        // Actualizar registro
        const updatedData = {
          ...codeData,
          used_count: (codeData.used_count || 0) + 1,
          last_used_at: new Date().toISOString(),
          last_used_by: tutorName
        };

        const updateResult = await databaseService.updateDocument('activation_codes', updatedData);
        
        if (updateResult.success) {
          console.log(`📊 Código ${code} marcado como usado por ${tutorName}`);
          return { success: true };
        } else {
          console.error('❌ Error actualizando uso de código:', updateResult.error);
          return { success: false, error: updateResult.error };
        }
      } else {
        return { success: false, error: 'Código no encontrado' };
      }
    } catch (error) {
      console.error('❌ Error marcando código como usado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar todos los códigos (para nueva elección)
   */
  async clearAllCodes() {
    try {
      console.log('🗑️ ActivationCodes: Eliminando todos los códigos...');
      
      const result = await databaseService.findDocuments('activation_codes', {
        selector: { type: DOC_TYPES.ACTIVATION_CODE }
      });

      if (result.success && result.docs.length > 0) {
        let deletedCount = 0;
        
        for (const codeDoc of result.docs) {
          const deleteResult = await databaseService.deleteDocument(
            'activation_codes', 
            codeDoc._id, 
            codeDoc._rev
          );
          
          if (deleteResult.success) {
            deletedCount++;
          }
        }
        
        console.log(`🗑️ Eliminados ${deletedCount} códigos de activación`);
        return {
          success: true,
          deleted: deletedCount
        };
      } else {
        console.log('ℹ️ No hay códigos que eliminar');
        return {
          success: true,
          deleted: 0
        };
      }
    } catch (error) {
      console.error('❌ Error eliminando códigos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Crear instancia singleton
const activationCodesService = new ActivationCodesService();

export default activationCodesService;
export { activationCodesService };