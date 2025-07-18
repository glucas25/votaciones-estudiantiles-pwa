/**
 * Script de inicialización de la base de datos CouchDB
 * Sistema de Votación Estudiantil PWA
 */

const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

// Configuración de la base de datos
const DB_CONFIG = {
  name: process.env.REACT_APP_COUCHDB_NAME || 'votaciones_estudiantiles',
  url: process.env.REACT_APP_COUCHDB_URL || 'http://admin:votaciones2024@localhost:5984',
  options: {
    skip_setup: false,
    adapter: 'http'
  }
};

// Crear instancia de la base de datos
const db = new PouchDB(`${DB_CONFIG.url}/${DB_CONFIG.name}`, DB_CONFIG.options);

/**
 * Crear índices para optimizar consultas
 */
async function createIndexes() {
  console.log('📊 Creando índices de base de datos...');
  
  const indexes = [
    // Índice para estudiantes
    {
      index: {
        fields: ['type', 'curso', 'nivel', 'year']
      },
      name: 'students-by-course-level',
      ddoc: 'students-index'
    },
    
    // Índice para votos
    {
      index: {
        fields: ['type', 'studentId', 'year']
      },
      name: 'votes-by-student',
      ddoc: 'votes-index'
    },
    
    // Índice para candidatos
    {
      index: {
        fields: ['type', 'cargo', 'nivel', 'year']
      },
      name: 'candidates-by-position',
      ddoc: 'candidates-index'
    },
    
    // Índice para códigos de activación
    {
      index: {
        fields: ['type', 'level', 'active', 'year']
      },
      name: 'activation-codes-by-level',
      ddoc: 'activation-index'
    },
    
    // Índice para sesiones de tutor
    {
      index: {
        fields: ['type', 'course', 'status', 'startTime']
      },
      name: 'tutor-sessions-by-course',
      ddoc: 'sessions-index'
    },
    
    // Índice compuesto para búsquedas complejas
    {
      index: {
        fields: ['type', 'year', 'hasVoted', 'isAbsent']
      },
      name: 'students-status',
      ddoc: 'status-index'
    }
  ];

  for (const indexConfig of indexes) {
    try {
      const result = await db.createIndex(indexConfig);
      console.log(`✅ Índice creado: ${indexConfig.name}`);
    } catch (error) {
      if (error.status === 409) {
        console.log(`⚠️  Índice ya existe: ${indexConfig.name}`);
      } else {
        console.error(`❌ Error creando índice ${indexConfig.name}:`, error);
      }
    }
  }
}

/**
 * Crear documentos de configuración inicial
 */
async function createInitialConfig() {
  console.log('⚙️  Creando configuración inicial...');
  
  const currentYear = new Date().getFullYear();
  
  const configDocs = [
    // Configuración general del sistema
    {
      _id: 'config_system',
      type: 'system_config',
      version: '1.0.0',
      electionYear: currentYear,
      institutionName: 'Institución Educativa',
      createdAt: new Date().toISOString(),
      settings: {
        maxStudentsPerCourse: 50,
        maxCandidatesPerPosition: 10,
        maxPhotoSizeMB: 2,
        backupIntervalMinutes: 5,
        activationCodeExpiryHours: 12
      }
    },
    
    // Niveles educativos
    {
      _id: 'config_levels',
      type: 'education_levels',
      year: currentYear,
      levels: [
        {
          code: 'BASICA_ELEMENTAL',
          name: 'Básica Elemental',
          grades: ['1ro', '2do', '3ro', '4to'],
          ageRange: '5-9 años',
          votingInterface: 'simplified'
        },
        {
          code: 'BASICA_MEDIA',
          name: 'Básica Media',
          grades: ['5to', '6to', '7mo'],
          ageRange: '10-12 años',
          votingInterface: 'intermediate'
        },
        {
          code: 'BASICA_SUPERIOR',
          name: 'Básica Superior',
          grades: ['8vo', '9no', '10mo'],
          ageRange: '13-15 años',
          votingInterface: 'standard'
        },
        {
          code: 'BACHILLERATO',
          name: 'Bachillerato',
          grades: ['1ro Bach', '2do Bach', '3ro Bach'],
          ageRange: '16-18 años',
          votingInterface: 'advanced'
        }
      ]
    },
    
    // Cargos disponibles
    {
      _id: 'config_positions',
      type: 'election_positions',
      year: currentYear,
      positions: [
        {
          code: 'PRESIDENTE',
          name: 'Presidente Estudiantil',
          description: 'Representante principal del estudiantado',
          maxCandidates: 5,
          levels: ['BASICA_SUPERIOR', 'BACHILLERATO']
        },
        {
          code: 'VICEPRESIDENTE',
          name: 'Vicepresidente Estudiantil',
          description: 'Asistente del presidente estudiantil',
          maxCandidates: 5,
          levels: ['BASICA_SUPERIOR', 'BACHILLERATO']
        },
        {
          code: 'SECRETARIO',
          name: 'Secretario/a',
          description: 'Encargado de documentación y comunicaciones',
          maxCandidates: 3,
          levels: ['BACHILLERATO']
        },
        {
          code: 'TESORERO',
          name: 'Tesorero/a',
          description: 'Administrador de recursos estudiantiles',
          maxCandidates: 3,
          levels: ['BACHILLERATO']
        }
      ]
    },
    
    // Estado inicial de la elección
    {
      _id: 'config_election_status',
      type: 'election_status',
      year: currentYear,
      status: 'SETUP', // SETUP, ACTIVE, PAUSED, FINISHED
      startDate: null,
      endDate: null,
      totalStudents: 0,
      totalVotes: 0,
      participationRate: 0,
      lastUpdated: new Date().toISOString()
    }
  ];

  for (const doc of configDocs) {
    try {
      await db.put(doc);
      console.log(`✅ Documento de configuración creado: ${doc._id}`);
    } catch (error) {
      if (error.status === 409) {
        console.log(`⚠️  Documento ya existe: ${doc._id}`);
      } else {
        console.error(`❌ Error creando documento ${doc._id}:`, error);
      }
    }
  }
}

/**
 * Crear usuario administrador por defecto
 */
async function createDefaultAdmin() {
  console.log('👤 Creando usuario administrador...');
  
  const adminUser = {
    _id: 'user_admin_default',
    type: 'user',
    role: 'admin',
    username: 'admin',
    email: 'admin@institution.edu',
    fullName: 'Administrador del Sistema',
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: [
      'manage_students',
      'manage_candidates',
      'manage_codes',
      'view_reports',
      'export_data',
      'system_config'
    ]
  };

  try {
    await db.put(adminUser);
    console.log('✅ Usuario administrador creado');
  } catch (error) {
    if (error.status === 409) {
      console.log('⚠️  Usuario administrador ya existe');
    } else {
      console.error('❌ Error creando usuario administrador:', error);
    }
  }
}

/**
 * Crear datos de ejemplo para desarrollo
 */
async function createSampleData() {
  if (process.env.NODE_ENV === 'production') {
    console.log('🚫 Omitiendo datos de ejemplo en producción');
    return;
  }

  console.log('📝 Creando datos de ejemplo...');
  
  const currentYear = new Date().getFullYear();
  
  // Estudiantes de ejemplo
  const sampleStudents = [
    {
      _id: 'student_2024_10A_001',
      type: 'student',
      cedula: '1234567890',
      nombres: 'María José',
      apellidos: 'García López',
      curso: '10mo A',
      nivel: 'BASICA_SUPERIOR',
      year: currentYear,
      hasVoted: false,
      isAbsent: false,
      votedAt: null
    },
    {
      _id: 'student_2024_1BACH_001',
      type: 'student',
      cedula: '0987654321',
      nombres: 'Carlos Andrés',
      apellidos: 'Martínez Silva',
      curso: '1ro Bach A',
      nivel: 'BACHILLERATO',
      year: currentYear,
      hasVoted: false,
      isAbsent: false,
      votedAt: null
    }
  ];

  // Candidatos de ejemplo
  const sampleCandidates = [
    {
      _id: 'candidate_2024_president_001',
      type: 'candidate',
      nombre: 'Ana Sofía Pérez',
      cargo: 'PRESIDENTE',
      lista: 'Lista Azul',
      color: '#2563eb',
      foto: null,
      propuestas: [
        'Mejora de la cafetería estudiantil',
        'Más actividades deportivas y culturales',
        'Implementación de espacios de estudio'
      ],
      nivel: 'BACHILLERATO',
      year: currentYear
    }
  ];

  // Código de activación de ejemplo
  const sampleActivationCode = {
    _id: 'activation_2024_BACHILLERATO',
    type: 'activation_code',
    code: 'ELEC2024-BACH',
    level: 'BACHILLERATO',
    courses: ['1ro Bach A', '1ro Bach B', '2do Bach A', '2do Bach B', '3ro Bach A', '3ro Bach B'],
    validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ayer
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En 7 días
    active: true,
    year: currentYear
  };

  const sampleDocs = [...sampleStudents, ...sampleCandidates, sampleActivationCode];

  for (const doc of sampleDocs) {
    try {
      await db.put(doc);
      console.log(`✅ Documento de ejemplo creado: ${doc._id}`);
    } catch (error) {
      if (error.status === 409) {
        console.log(`⚠️  Documento ya existe: ${doc._id}`);
      } else {
        console.error(`❌ Error creando documento ${doc._id}:`, error);
      }
    }
  }
}

/**
 * Verificar conectividad con la base de datos
 */
async function checkDatabaseConnection() {
  console.log('🔍 Verificando conexión con CouchDB...');
  
  try {
    const info = await db.info();
    console.log(`✅ Conectado a CouchDB - Base de datos: ${info.db_name}`);
    console.log(`📊 Documentos: ${info.doc_count}, Tamaño: ${Math.round(info.sizes.active / 1024)} KB`);
    return true;
  } catch (error) {
    console.error('❌ Error conectando con CouchDB:', error.message);
    return false;
  }
}

/**
 * Función principal de inicialización
 */
async function initializeDatabase() {
  console.log('🚀 Inicializando base de datos del Sistema de Votación...');
  console.log('================================================================');
  
  try {
    // Verificar conexión
    const connected = await checkDatabaseConnection();
    if (!connected) {
      process.exit(1);
    }

    // Crear índices
    await createIndexes();
    
    // Crear configuración inicial
    await createInitialConfig();
    
    // Crear usuario administrador
    await createDefaultAdmin();
    
    // Crear datos de ejemplo (solo en desarrollo)
    await createSampleData();
    
    console.log('');
    console.log('🎉 ¡Base de datos inicializada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Acceder a CouchDB: http://localhost:5984/_utils');
    console.log('   2. Iniciar la aplicación: npm start');
    console.log('   3. Configurar candidatos y estudiantes');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar inicialización si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  createIndexes,
  createInitialConfig,
  checkDatabaseConnection
};