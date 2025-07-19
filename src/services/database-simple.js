// src/services/database-simple.js
// Versión simplificada de database sin dependencias problemáticas

console.log('🔧 Configurando base de datos (versión simplificada)');

// Configuración
const DB_NAME = 'votaciones_estudiantiles';
const COUCHDB_URL = 'http://admin:votaciones2024@localhost:5984';

// Mock de base de datos para testing
const mockDatabase = {
  local: null,
  remote: null,

  async getConnectionStatus() {
    return {
      local: false,
      remote: false,
      online: navigator.onLine,
      error: 'PouchDB deshabilitado temporalmente - usando mock'
    };
  },

  async find(selector, options = {}) {
    console.log('🔍 Mock búsqueda:', selector);
    return [];
  },

  async create(doc) {
    console.log('✅ Mock documento creado:', doc);
    return { id: 'mock-id-' + Date.now(), ok: true };
  },

  async read(id) {
    console.log('📖 Mock lectura:', id);
    return null;
  },

  async update(doc) {
    console.log('✅ Mock documento actualizado:', doc);
    return { id: doc._id || 'mock-id', ok: true };
  }
};

// Función de inicialización mock
const initDatabase = async () => {
  console.log('🚀 Inicializando base de datos (mock)...');
  console.log('✅ Base de datos mock inicializada');
  return mockDatabase;
};

export { mockDatabase as database, initDatabase };
export default mockDatabase;