// src/services/database-simple.js
// Versión simplificada de database para desarrollo local

console.log('🔧 Configurando base de datos (versión simplificada)');

// Configuración para desarrollo local
const DB_NAME = 'votaciones_estudiantiles';

// Mock de base de datos para testing y desarrollo
const mockDatabase = {
  local: null,

  async getConnectionStatus() {
    return {
      local: true,
      online: navigator.onLine,
      mode: 'mock-local'
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
  console.log('🚀 Inicializando base de datos (mock local)...');
  console.log('✅ Base de datos mock inicializada');
  return mockDatabase;
};

export { mockDatabase as database, initDatabase };
export default mockDatabase;