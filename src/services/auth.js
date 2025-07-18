// src/services/auth.js
import { database } from './database';

// Constantes de validación
const ACTIVATION_CODE_PATTERN = /^ELEC2024-[A-Z-]+$/;
const SESSION_DURATION_HOURS = 8;

/**
 * Servicio de autenticación para el sistema de votación
 */
class AuthService {
  constructor() {
    this.currentSession = null;
    this.sessionKey = 'votaciones_session';
    this.init();
  }

  /**
   * Inicializar el servicio de autenticación
   */
  async init() {
    try {
      // Cargar sesión desde localStorage
      await this.loadStoredSession();
      console.log('🔐 Servicio de autenticación inicializado');
    } catch (error) {
      console.warn('⚠️ Error inicializando autenticación:', error);
    }
  }

  /**
   * Validar formato de código de activación
   */
  validateCodeFormat(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Código requerido' };
    }

    const trimmedCode = code.trim().toUpperCase();
    
    if (!ACTIVATION_CODE_PATTERN.test(trimmedCode)) {
      return { 
        valid: false, 
        error: 'Formato inválido. Use formato: ELEC2024-NIVEL' 
      };
    }

    return { valid: true, code: trimmedCode };
  }

  /**
   * Buscar código de activación en la base de datos
   */
  async findActivationCode(code) {
    try {
      const activationCodes = await database.find({
        type: 'activation_code',
        code: code,
        year: 2024
      });

      if (activationCodes.length === 0) {
        return { found: false, error: 'Código no encontrado' };
      }

      const activationCode = activationCodes[0];
      
      // Verificar si está activo
      if (!activationCode.active) {
        return { found: false, error: 'Código deshabilitado' };
      }

      return { found: true, data: activationCode };
    } catch (error) {
      console.error('❌ Error buscando código:', error);
      return { found: false, error: 'Error de conexión' };
    }
  }

  /**
   * Verificar si el horario de votación es válido
   */
  validateVotingHours(activationCode) {
    const now = new Date();
    const validFrom = new Date(activationCode.validFrom);
    const validUntil = new Date(activationCode.validUntil);

    if (now < validFrom) {
      return {
        valid: false,
        error: `Votación iniciará el ${validFrom.toLocaleString()}`
      };
    }

    if (now > validUntil) {
      return {
        valid: false,
        error: `Votación finalizó el ${validUntil.toLocaleString()}`
      };
    }

    return { valid: true };
  }

  /**
   * Validar código de activación completo
   */
  async validateActivationCode(code) {
    try {
      console.log('🔍 Validando código:', code);

      // 1. Validar formato
      const formatValidation = this.validateCodeFormat(code);
      if (!formatValidation.valid) {
        return { valid: false, error: formatValidation.error };
      }

      const cleanCode = formatValidation.code;

      // 2. Buscar en base de datos
      const codeSearch = await this.findActivationCode(cleanCode);
      if (!codeSearch.found) {
        return { valid: false, error: codeSearch.error };
      }

      const activationCode = codeSearch.data;

      // 3. Verificar horarios
      const timeValidation = this.validateVotingHours(activationCode);
      if (!timeValidation.valid) {
        return { valid: false, error: timeValidation.error };
      }

      // 4. Verificar que tenga cursos asignados
      if (!activationCode.courses || activationCode.courses.length === 0) {
        return { 
          valid: false, 
          error: 'No hay cursos asignados a este código' 
        };
      }

      console.log('✅ Código válido:', cleanCode);
      return {
        valid: true,
        activationCode: activationCode
      };

    } catch (error) {
      console.error('❌ Error validando código:', error);
      return { 
        valid: false, 
        error: 'Error de validación. Intente nuevamente.' 
      };
    }
  }

  /**
   * Crear sesión de tutor
   */
  async createTutorSession(activationCode, selectedCourse, tutorName = null) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (SESSION_DURATION_HOURS * 60 * 60 * 1000));

      const session = {
        _id: sessionId,
        type: 'tutor_session',
        activationCode: activationCode.code,
        course: selectedCourse,
        level: activationCode.level,
        tutorName: tutorName || 'Tutor',
        startTime: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: now.toISOString()
        }
      };

      // Guardar en base de datos
      await database.create(session);

      // Guardar en memoria y localStorage
      this.currentSession = session;
      this.saveSessionToStorage(session);

      console.log('✅ Sesión creada:', sessionId);
      return { success: true, session };

    } catch (error) {
      console.error('❌ Error creando sesión:', error);
      return { 
        success: false, 
        error: 'Error creando sesión. Intente nuevamente.' 
      };
    }
  }

  /**
   * Guardar sesión en localStorage
   */
  saveSessionToStorage(session) {
    try {
      const sessionData = {
        ...session,
        storedAt: new Date().toISOString()
      };
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('⚠️ Error guardando sesión en storage:', error);
    }
  }

  /**
   * Cargar sesión desde localStorage
   */
  async loadStoredSession() {
    try {
      const storedData = localStorage.getItem(this.sessionKey);
      if (!storedData) return null;

      const session = JSON.parse(storedData);
      
      // Verificar que no haya expirado
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now > expiresAt) {
        console.log('⏰ Sesión expirada, limpiando...');
        this.logout();
        return null;
      }

      // Verificar que la sesión existe en la base de datos
      const dbSession = await database.read(session._id);
      if (!dbSession || !dbSession.isActive) {
        console.log('🗑️ Sesión inválida en BD, limpiando...');
        this.logout();
        return null;
      }

      this.currentSession = session;
      console.log('✅ Sesión restaurada:', session.course);
      return session;

    } catch (error) {
      console.warn('⚠️ Error cargando sesión:', error);
      this.logout();
      return null;
    }
  }

  /**
   * Obtener sesión actual
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated() {
    return this.currentSession !== null && this.currentSession.isActive;
  }

  /**
   * Obtener información del tutor actual
   */
  getCurrentTutor() {
    if (!this.isAuthenticated()) return null;

    return {
      name: this.currentSession.tutorName,
      course: this.currentSession.course,
      level: this.currentSession.level,
      activationCode: this.currentSession.activationCode,
      sessionStart: this.currentSession.startTime
    };
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      // Marcar sesión como inactiva en la base de datos
      if (this.currentSession) {
        const session = await database.read(this.currentSession._id);
        if (session) {
          session.isActive = false;
          session.endTime = new Date().toISOString();
          await database.update(session);
        }
      }

      // Limpiar datos locales
      this.currentSession = null;
      localStorage.removeItem(this.sessionKey);

      console.log('✅ Sesión cerrada');
      return { success: true };

    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      // Limpiar localmente aunque falle la BD
      this.currentSession = null;
      localStorage.removeItem(this.sessionKey);
      return { success: false, error: 'Error cerrando sesión' };
    }
  }

  /**
   * Verificar si la sesión sigue siendo válida
   */
  async validateCurrentSession() {
    if (!this.currentSession) return false;

    try {
      const now = new Date();
      const expiresAt = new Date(this.currentSession.expiresAt);

      // Verificar expiración
      if (now > expiresAt) {
        await this.logout();
        return false;
      }

      // Verificar en base de datos
      const dbSession = await database.read(this.currentSession._id);
      if (!dbSession || !dbSession.isActive) {
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.warn('⚠️ Error validando sesión:', error);
      return false;
    }
  }

  /**
   * Renovar sesión (extender tiempo)
   */
  async renewSession() {
    if (!this.currentSession) return { success: false };

    try {
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + (SESSION_DURATION_HOURS * 60 * 60 * 1000));

      // Actualizar en base de datos
      const session = await database.read(this.currentSession._id);
      if (session) {
        session.expiresAt = newExpiresAt.toISOString();
        session.lastRenewed = now.toISOString();
        await database.update(session);

        // Actualizar localmente
        this.currentSession.expiresAt = newExpiresAt.toISOString();
        this.saveSessionToStorage(this.currentSession);

        console.log('🔄 Sesión renovada hasta:', newExpiresAt.toLocaleString());
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
      return { success: false, error: 'Error renovando sesión' };
    }
  }
}

// Crear instancia única del servicio
const authService = new AuthService();

// Exportar instancia y clase
export { authService, AuthService };
export default authService;