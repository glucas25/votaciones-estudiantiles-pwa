// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// CÓDIGOS DE ACTIVACIÓN ESPECÍFICOS POR CURSO
// Cada código permite acceso a UN SOLO curso específico
// Formato: ELEC2024-[IDENTIFICADOR_CURSO]
const ACTIVATION_CODES = {
  // BACHILLERATO - Códigos específicos por curso
  'ELEC2024-1ROBACHA': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    course: '1ro Bach A', // UN SOLO CURSO
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-1ROBACHB': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    course: '1ro Bach B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-2ROBACHA': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    course: '2do Bach A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-2ROBACHB': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    course: '2do Bach B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-3ROBACHA': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    course: '3ro Bach A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-3ROBACHB': {
    level: 'BACHILLERATO',
    name: 'Bachillerato',
    course: '3ro Bach B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },

  // BÁSICA SUPERIOR - Códigos específicos por curso  
  'ELEC2024-8VOA': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    course: '8vo A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-8VOB': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    course: '8vo B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-9NOA': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    course: '9no A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-9NOB': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    course: '9no B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-10MOA': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    course: '10mo A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-10MOB': {
    level: 'BASICA_SUPERIOR',
    name: 'Básica Superior',
    course: '10mo B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },

  // BÁSICA MEDIA - Códigos específicos por curso
  'ELEC2024-5TOA': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    course: '5to A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-5TOB': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    course: '5to B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-6TOA': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    course: '6to A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-6TOB': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    course: '6to B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-7MOA': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    course: '7mo A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-7MOB': {
    level: 'BASICA_MEDIA',
    name: 'Básica Media',
    course: '7mo B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },

  // BÁSICA ELEMENTAL - Códigos específicos por curso
  'ELEC2024-1ROA': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '1ro A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-1ROB': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '1ro B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-2DOA': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '2do A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-2DOB': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '2do B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-3ROA': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '3ro A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-3ROB': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '3ro B',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-4TOA': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '4to A',
    validFrom: '2024-03-15T08:00:00Z',
    validUntil: '2024-03-15T16:00:00Z'
  },
  'ELEC2024-4TOB': {
    level: 'BASICA_ELEMENTAL',
    name: 'Básica Elemental',
    course: '4to B',
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
      // Validar el código nuevamente para obtener el nivel correcto
      let actualLevel = 'BACHILLERATO'; // Default fallback
      let levelName = course;
      
      try {
        const { default: activationCodesService } = await import('../services/activationCodes.js');
        const validation = await activationCodesService.validateCode(activationCode);
        
        if (validation.valid && validation.data) {
          actualLevel = validation.data.level || 'BACHILLERATO';
          levelName = validation.data.level_name || validation.data.level || course;
        }
      } catch (err) {
        console.warn('❌ Could not validate activation code for level, using fallback:', err.message);
        // Fallback: detect level from course name
        const courseStr = course.toLowerCase();
        if (courseStr.includes('bach')) {
          actualLevel = 'BACHILLERATO';
          levelName = 'Bachillerato';
        } else if (courseStr.match(/^(8vo|9no|10mo)/)) {
          actualLevel = 'BASICA_SUPERIOR';
          levelName = 'Básica Superior';
        } else if (courseStr.match(/^(5to|6to|7mo)/)) {
          actualLevel = 'BASICA_MEDIA';
          levelName = 'Básica Media';
        } else if (courseStr.match(/^(1ro|2do|3ro|4to)/) && !courseStr.includes('bach')) {
          actualLevel = 'BASICA_ELEMENTAL';
          levelName = 'Básica Elemental';
        }
      }
      
      const session = {
        role: 'tutor',
        activationCode,
        course,
        level: actualLevel, // Use actual level from validation
        levelName: levelName,
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
    // Con códigos específicos, cada código tiene UN SOLO curso
    const codeData = ACTIVATION_CODES[activationCode];
    return codeData ? [codeData.course] : [];
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