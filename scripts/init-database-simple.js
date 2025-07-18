/**
 * Script simplificado de inicialización de la base de datos
 * Para usar con fetch API sin dependencias externas
 */

const COUCHDB_URL = process.env.REACT_APP_COUCHDB_URL || 'http://admin:votaciones2024@localhost:5984';
const DB_NAME = process.env.REACT_APP_COUCHDB_NAME || 'votaciones_estudiantiles';

// Configuración para fetch (simular navegador)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Función para realizar peticiones a CouchDB
 */
async function couchdbRequest(path, options = {}) {
  const url = `${COUCHDB_URL}${path}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    const text = await response.text();
    
    if (!response.ok) {
      if (response.status === 409) {
        return { conflict: true, status: 409 };
      }
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`Error en petición a ${url}:`, error.message);
    throw error;
  }
}

/**
 * Verificar conectividad con CouchDB
 */
async function checkConnection() {
  console.log('🔍 Verificando conexión con CouchDB...');
  try {
    const info = await couchdbRequest('/');
    console.log(`✅ Conectado a CouchDB: ${info.version}`);
    return true;
  } catch (error) {
    console.error('❌ Error conectando con CouchDB:', error.message);
    return false;
  }
}

/**
 * Crear base de datos si no existe
 */
async function createDatabase() {
  console.log(`📊 Creando base de datos: ${DB_NAME}`);
  
  try {
    const result = await couchdbRequest(`/${DB_NAME}`, { method: 'PUT' });
    console.log('✅ Base de datos creada exitosamente');
    return result;
  } catch (error) {
    if (error.message.includes('409')) {
      console.log('ℹ️  Base de datos ya existe');
      return true;
    }
    throw error;
  }
}

/**
 * Crear documento en la base de datos
 */
async function createDocument(doc) {
  try {
    const result = await couchdbRequest(`/${DB_NAME}`, {
      method: 'POST',
      body: JSON.stringify(doc)
    });
    console.log(`✅ Documento creado: ${doc._id}`);
    return result;
  } catch (error) {
    if (error.message.includes('409')) {
      console.log(`ℹ️  Documento ya existe: ${doc._id}`);
      return true;
    }
    console.error(`❌ Error creando documento ${doc._id}:`, error.message);
  }
}

/**
 * Configuración inicial del sistema
 */
async function createInitialConfig() {
  console.log('⚙️  Creando configuración inicial...');
  
  const currentYear = new Date().getFullYear();
  
  const configDocs = [
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
    
    {
      _id: 'config_levels',
      type: 'education_levels',
      year: currentYear,
      levels: [
        {
          code: 'BASICA_ELEMENTAL',
          name: 'Básica Elemental',
          grades: ['1ro', '2do', '3ro', '4to'],
          ageRange: '5-9 años'
        },
        {
          code: 'BASICA_MEDIA', 
          name: 'Básica Media',
          grades: ['5to', '6to', '7mo'],
          ageRange: '10-12 años'
        },
        {
          code: 'BASICA_SUPERIOR',
          name: 'Básica Superior', 
          grades: ['8vo', '9no', '10mo'],
          ageRange: '13-15 años'
        },
        {
          code: 'BACHILLERATO',
          name: 'Bachillerato',
          grades: ['1ro Bach', '2do Bach', '3ro Bach'],
          ageRange: '16-18 años'
        }
      ]
    },
    
    {
      _id: 'activation_2024_BACHILLERATO',
      type: 'activation_code',
      code: 'ELEC2024-BACH',
      level: 'BACHILLERATO',
      courses: ['1ro Bach A', '1ro Bach B', '2do Bach A', '2do Bach B', '3ro Bach A'],
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      year: currentYear
    },
    
    {
      _id: 'activation_2024_BASICA_SUP',
      type: 'activation_code',
      code: 'ELEC2024-BASICA-SUP',
      level: 'BASICA_SUPERIOR',
      courses: ['8vo A', '8vo B', '9no A', '9no B', '10mo A', '10mo B'],
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      year: currentYear
    }
  ];

  for (const doc of configDocs) {
    await createDocument(doc);
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
  
  const sampleDocs = [
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
    },
    
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
        'Más actividades deportivas y culturales'
      ],
      nivel: 'BACHILLERATO',
      year: currentYear
    }
  ];

  for (const doc of sampleDocs) {
    await createDocument(doc);
  }
}

/**
 * Función principal
 */
async function initializeDatabase() {
  console.log('🚀 Inicializando Sistema de Votación Estudiantil');
  console.log('================================================');
  
  try {
    // Verificar conexión
    const connected = await checkConnection();
    if (!connected) {
      console.log('❌ No se puede conectar con CouchDB. Verificar que esté funcionando.');
      process.exit(1);
    }

    // Crear base de datos
    await createDatabase();
    
    // Crear configuración inicial
    await createInitialConfig();
    
    // Crear datos de ejemplo
    await createSampleData();
    
    console.log('');
    console.log('🎉 ¡Base de datos inicializada exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Acceder a CouchDB: http://localhost:5984/_utils');
    console.log('   2. Ver la aplicación: http://localhost:3000');
    console.log('   3. Usar código de prueba: ELEC2024-BACH');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };