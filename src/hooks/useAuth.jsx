// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import authService from '../services/auth';

/**
 * Hook para manejar autenticación en componentes React
 */
export const useAuth = () => {
  // Estados principales
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTutor, setCurrentTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados específicos para el proceso de login
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedActivationCode, setSelectedActivationCode] = useState(null);

  /**
   * Verificar estado de autenticación al cargar
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Verificar si hay sesión válida
      const isValid = await authService.validateCurrentSession();
      
      if (isValid) {
        const tutor = authService.getCurrentTutor();
        setCurrentTutor(tutor);
        setIsAuthenticated(true);
        console.log('✅ Usuario autenticado:', tutor?.name);
      } else {
        setCurrentTutor(null);
        setIsAuthenticated(false);
      }
      
      setError(null);
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      setError('Error verificando autenticación');
      setIsAuthenticated(false);
      setCurrentTutor(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Inicializar hook
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Validar código de activación
   */
  const validateActivationCode = useCallback(async (code) => {
    try {
      setIsValidatingCode(true);
      setError(null);

      console.log('🔍 Validando código:', code);
      
      const result = await authService.validateActivationCode(code);
      
      if (result.valid) {
        setSelectedActivationCode(result.activationCode);
        setAvailableCourses(result.activationCode.courses || []);
        
        console.log('✅ Código válido, cursos disponibles:', result.activationCode.courses);
        
        return {
          success: true,
          activationCode: result.activationCode,
          courses: result.activationCode.courses
        };
      } else {
        setError(result.error);
        setSelectedActivationCode(null);
        setAvailableCourses([]);
        
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      const errorMessage = 'Error validando código. Intente nuevamente.';
      console.error('❌ Error en validación:', error);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsValidatingCode(false);
    }
  }, []);

  /**
   * Realizar login completo (código + curso)
   */
  const login = useCallback(async (code, selectedCourse, tutorName = 'Tutor') => {
    try {
      setIsLoading(true);
      setError(null);

      // Si no tenemos el código validado, validarlo primero
      let activationCode = selectedActivationCode;
      
      if (!activationCode) {
        const codeValidation = await validateActivationCode(code);
        if (!codeValidation.success) {
          return codeValidation;
        }
        activationCode = codeValidation.activationCode;
      }

      // Verificar que el curso esté en la lista disponible
      if (!activationCode.courses.includes(selectedCourse)) {
        const error = 'Curso no válido para este código';
        setError(error);
        return { success: false, error };
      }

      // Crear sesión
      console.log('🔐 Creando sesión para:', { course: selectedCourse, tutor: tutorName });
      
      const sessionResult = await authService.createTutorSession(
        activationCode,
        selectedCourse,
        tutorName
      );

      if (sessionResult.success) {
        // Actualizar estado
        const tutor = authService.getCurrentTutor();
        setCurrentTutor(tutor);
        setIsAuthenticated(true);
        setSelectedActivationCode(null);
        setAvailableCourses([]);
        
        console.log('✅ Login exitoso:', tutor);
        
        return { success: true, tutor };
      } else {
        setError(sessionResult.error);
        return { success: false, error: sessionResult.error };
      }

    } catch (error) {
      const errorMessage = 'Error durante el login. Intente nuevamente.';
      console.error('❌ Error en login:', error);
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [selectedActivationCode, validateActivationCode]);

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const result = await authService.logout();
      
      // Limpiar estado independientemente del resultado
      setIsAuthenticated(false);
      setCurrentTutor(null);
      setSelectedActivationCode(null);
      setAvailableCourses([]);
      setError(null);
      
      console.log('👋 Logout completado');
      
      return result;
    } catch (error) {
      console.error('❌ Error en logout:', error);
      
      // Limpiar estado aunque haya error
      setIsAuthenticated(false);
      setCurrentTutor(null);
      setSelectedActivationCode(null);
      setAvailableCourses([]);
      
      return { success: false, error: 'Error cerrando sesión' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Renovar sesión actual
   */
  const renewSession = useCallback(async () => {
    try {
      const result = await authService.renewSession();
      
      if (result.success) {
        console.log('🔄 Sesión renovada');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
      return { success: false, error: 'Error renovando sesión' };
    }
  }, []);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refrescar estado de autenticación
   */
  const refresh = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Obtener tiempo restante de sesión
   */
  const getSessionTimeRemaining = useCallback(() => {
    const session = authService.getCurrentSession();
    if (!session) return null;

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const remaining = expiresAt.getTime() - now.getTime();

    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, milliseconds: remaining };
  }, []);

  /**
   * Información de depuración
   */
  const getDebugInfo = useCallback(() => {
    const session = authService.getCurrentSession();
    return {
      isAuthenticated,
      currentTutor,
      session,
      hasActivationCode: !!selectedActivationCode,
      availableCoursesCount: availableCourses.length,
      error,
      isLoading,
      isValidatingCode
    };
  }, [isAuthenticated, currentTutor, selectedActivationCode, availableCourses, error, isLoading, isValidatingCode]);

  // Return del hook
  return {
    // Estado principal
    isAuthenticated,
    currentTutor,
    isLoading,
    error,

    // Estado del proceso de login
    isValidatingCode,
    availableCourses,
    selectedActivationCode,

    // Funciones principales
    validateActivationCode,
    login,
    logout,
    renewSession,

    // Funciones auxiliares
    clearError,
    refresh,
    getSessionTimeRemaining,
    getDebugInfo
  };
};

export default useAuth;