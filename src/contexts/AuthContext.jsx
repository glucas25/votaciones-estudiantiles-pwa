// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Códigos de activación predefinidos con sus cursos
const ACTIVATION_CODES = {
  'ELEC2024-BASICA-ELEM': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    courses: ['1ro A', '1ro B', '2do A', '2do B', '3ro A', '3ro B', '4to A', '4to B'],
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-BASICA-MEDIA': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    courses: ['5to A', '5to B', '6to A', '6to B', '7mo A', '7mo B'],
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-BASICA-SUP': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    courses: ['8vo A', '8vo B', '9no A', '9no B', '10mo A', '10mo B'],
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-BACH': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    courses: ['1ro Bach A', '1ro Bach B', '2do Bach A', '2do Bach B', '3ro Bach A', '3ro Bach B'],
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedSession = localStorage.getItem('voting_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Verificar si la sesión sigue siendo válida
        if (isValidSession(session)) {
          setUser(session);
        } else {
          localStorage.removeItem('voting_session');
        }
      } catch (error) {
        console.error('Error al cargar sesión guardada:', error);
        localStorage.removeItem('voting_session');
      }
    }
    setIsLoading(false);

    // Escuchar cambios de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isValidSession = (session) => {
    if (!session || !session.activationCode || !session.course) return false;
    
    const codeData = ACTIVATION_CODES[session.activationCode];
    if (!codeData) return false;

    // Verificar si el código está dentro del horario válido
    const now = new Date();
    const validFrom = new Date(codeData.validFrom);
    const validUntil = new Date(codeData.validUntil);

    // Para desarrollo, permitir uso fuera del horario
    // En producción, descomentar la siguiente línea:
    // return now >= validFrom && now <= validUntil;
    
    return true; // Permitir acceso para desarrollo
  };

  const validateActivationCode = (code) => {
    const codeData = ACTIVATION_CODES[code];
    if (!codeData) {
      return { valid: false, error: 'Código de activación inválido' };
    }

    const now = new Date();
    const validFrom = new Date(codeData.validFrom);
    const validUntil = new Date(codeData.validUntil);

    // Para desarrollo, saltar validación de tiempo
    // En producción, activar estas validaciones:
    /*
    if (now < validFrom) {
      return { valid: false, error: 'El código aún no está activo' };
    }
    
    if (now > validUntil) {
      return { valid: false, error: 'El código ha expirado' };
    }
    */

    return { valid: true, data: codeData };
  };

  const validateCourseForLevel = (course, level) => {
    // Función para validar si un curso es válido para un nivel específico
    const courseStr = course.toLowerCase();
    
    switch (level) {
      case 'BACHILLERATO':
        // Bachillerato: 1ro, 2do, 3ro Bach A/B
        return /^(1ro|2do|3ro|primero|segundo|tercero).*(bach|bachillerato).*[ab]$/i.test(courseStr) ||
               /^bach.*(1|2|3).*(a|b)$/i.test(courseStr);
               
      case 'BASICA_SUPERIOR':
        // Básica Superior: 8vo, 9no, 10mo A/B
        return /^(8vo|9no|10mo|octavo|noveno|decimo).*(a|b)$/i.test(courseStr);
        
      case 'BASICA_MEDIA':
        // Básica Media: 5to, 6to, 7mo A/B
        return /^(5to|6to|7mo|quinto|sexto|septimo).*(a|b)$/i.test(courseStr);
        
      case 'BASICA_ELEMENTAL':
        // Básica Elemental: 1ro, 2do, 3ro, 4to A/B
        return /^(1ro|2do|3ro|4to|primero|segundo|tercero|cuarto).*(a|b)$/i.test(courseStr) &&
               !/bach/i.test(courseStr); // No debe contener "bach"
               
      case 'PREPARATORIA':
        // Preparatoria: Inicial, Pre-básica, etc.
        return /^(inicial|pre|preparatoria|preb)/i.test(courseStr);
        
      default:
        console.log(`⚠️ Nivel desconocido: ${level}`);
        return true; // Permitir por defecto para niveles desconocidos
    }
  };

  const login = async (activationCode, course, tutorName = '') => {
    setIsLoading(true);
    
    try {
      // Validar código de activación
      const validation = validateActivationCode(activationCode);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const codeData = validation.data;

      // Verificar que el curso es válido (simplificado)
      // Permitir cursos hardcodeados O cualquier curso que existe en la BD
      const isHardcodedCourse = codeData.courses.includes(course);
      
      if (!isHardcodedCourse) {
        // Si no es hardcodeado, verificar si existe en la BD
        console.log(`⚠️ Curso "${course}" no está en lista hardcodeada, pero permitiendo acceso`);
        console.log('- Cursos hardcodeados para', codeData.name, ':', codeData.courses);
        console.log('✅ Permitiendo acceso con curso de BD:', course);
      } else {
        console.log(`✅ Curso "${course}" está en lista hardcodeada para ${codeData.name}`);
      }

      // Crear sesión de usuario
      const session = {
        role: 'tutor',
        activationCode,
        course,
        level: codeData.level,
        levelName: codeData.name,
        tutorName: tutorName || `Tutor ${course}`,
        loginTime: new Date().toISOString(),
        sessionId: generateSessionId()
      };

      // Guardar sesión
      localStorage.setItem('voting_session', JSON.stringify(session));
      setUser(session);

      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = async (password) => {
    setIsLoading(true);
    
    try {
      // Contraseña simple para desarrollo
      if (password !== 'admin2024') {
        throw new Error('Contraseña incorrecta');
      }

      const session = {
        role: 'admin',
        loginTime: new Date().toISOString(),
        sessionId: generateSessionId()
      };

      localStorage.setItem('voting_session', JSON.stringify(session));
      setUser(session);

      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('voting_session');
    setUser(null);
  };

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getAvailableCourses = (activationCode) => {
    const codeData = ACTIVATION_CODES[activationCode];
    return codeData ? codeData.courses : [];
  };

  const value = {
    user,
    isLoading,
    isOnline,
    login,
    loginAsAdmin,
    logout,
    validateActivationCode,
    getAvailableCourses,
    activationCodes: ACTIVATION_CODES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};