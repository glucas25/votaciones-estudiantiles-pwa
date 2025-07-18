// src/services/database.js
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

// Configurar PouchDB
PouchDB.plugin(PouchDBFind);

// Configuración simple
const DB_NAME = 'votaciones_estudiantiles';
const COUCHDB_URL = 'http://admin:votaciones2024@localhost:5984';

console.log('🔧 Configurando base de datos:', { DB_NAME, COUCHDB_URL });

// Crear bases de datos
let localDB, remoteDB;

try {
  localDB = new PouchDB(DB_NAME);
  remoteDB = new PouchDB(`${COUCHDB_URL}/${DB_NAME}`, {
    skip_setup: true
  });
  console.log('✅ Bases de datos inicializadas');
} catch (error) {
  console.error('❌ Error inicializando bases de datos:', error);
}

// Objeto de base de datos simplificado
const database = {
  local: localDB,
  remote: remoteDB,

  async getConnectionStatus() {
    try {
      const localInfo = await localDB.info();
      console.log('📱 Base local:', localInfo.db_name);
      
      let remoteAvailable = false;
      try {
        await remoteDB.info();
        remoteAvailable = true;
        console.log('☁️ Base remota conectada');
      } catch (error) {
        console.warn('⚠️ Base remota no disponible:', error.message);
      }

      return {
        local: true,
        remote: remoteAvailable,
        online: navigator.onLine
      };
    } catch (error) {
      console.error('❌ Error verificando conexión:', error);
      return {
        local: false,
        remote: false,
        online: navigator.onLine
      };
    }
  },

  async find(selector, options = {}) {
    try {
      const result = await localDB.find({
        selector,
        ...options
      });
      return result.docs;
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  },

  async create(doc) {
    try {
      const result = await localDB.post(doc);
      console.log('✅ Documento creado:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error creando documento:', error);
      throw error;
    }
  },

  async read(id) {
    try {
      const doc = await localDB.get(id);
      return doc;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      console.error('❌ Error leyendo documento:', error);
      throw error;
    }
  },

  async update(doc) {
    try {
      const result = await localDB.put(doc);
      console.log('✅ Documento actualizado:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error actualizando documento:', error);
      throw error;
    }
  }
};

// Función de inicialización
const initDatabase = async () => {
  try {
    console.log('🚀 Inicializando base de datos...');
    
    // Crear índices básicos
    await localDB.createIndex({
      index: { fields: ['type'] }
    });

    console.log('✅ Base de datos inicializada correctamente');
    return database;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    return database; // Retornar aunque falle
  }
};

export { database, initDatabase };
export default database;