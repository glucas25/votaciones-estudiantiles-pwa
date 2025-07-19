// src/services/database.js
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

// Configurar PouchDB para browser
PouchDB.plugin(PouchDBFind);

// Configuración
const DB_NAME = 'votaciones_estudiantiles';
const COUCHDB_URL = 'http://admin:votaciones2024@localhost:5984';

console.log('🔧 Configurando base de datos (browser):', { DB_NAME, COUCHDB_URL });

// Crear bases de datos de forma defensiva
let localDB, remoteDB;

// Función auxiliar para crear base de datos local
const createLocalDB = () => {
  try {
    return new PouchDB(DB_NAME);
  } catch (error) {
    console.error('❌ Error creando base local:', error);
    return null;
  }
};

// Función auxiliar para crear base de datos remota
const createRemoteDB = () => {
  try {
    return new PouchDB(`${COUCHDB_URL}/${DB_NAME}`, {
      skip_setup: true,
      ajax: {
        timeout: 60000,
        cache: false
      }
    });
  } catch (error) {
    console.error('❌ Error creando base remota:', error);
    return null;
  }
};

try {
  localDB = createLocalDB();
  remoteDB = createRemoteDB();
  console.log('✅ Bases de datos inicializadas (browser build)');
} catch (error) {
  console.error('❌ Error crítico inicializando bases de datos:', error);
}

// Objeto de base de datos
const database = {
  local: localDB,
  remote: remoteDB,

  async getConnectionStatus() {
    let localStatus = false;
    let remoteStatus = false;

    // Verificar base local
    if (localDB) {
      try {
        const localInfo = await localDB.info();
        localStatus = true;
        console.log('📱 Base local conectada:', localInfo.db_name);
      } catch (error) {
        console.warn('⚠️ Base local no disponible:', error.message);
      }
    } else {
      console.warn('⚠️ Base local no inicializada');
    }

    // Verificar base remota
    if (remoteDB) {
      try {
        const remoteInfo = await remoteDB.info();
        remoteStatus = true;
        console.log('☁️ Base remota conectada:', remoteInfo.db_name);
      } catch (error) {
        console.warn('⚠️ Base remota no disponible:', error.message);
      }
    } else {
      console.warn('⚠️ Base remota no inicializada');
    }

    return {
      local: localStatus,
      remote: remoteStatus,
      online: navigator.onLine
    };
  },

  async find(selector, options = {}) {
    if (!localDB) {
      console.warn('⚠️ Base local no disponible para búsqueda');
      return [];
    }
    try {
      const result = await localDB.find({
        selector,
        ...options
      });
      console.log('🔍 Búsqueda exitosa:', result.docs.length, 'documentos');
      return result.docs;
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return [];
    }
  },

  async create(doc) {
    if (!localDB) {
      throw new Error('Base de datos local no disponible');
    }
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
    if (!localDB) {
      throw new Error('Base de datos local no disponible');
    }
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
    if (!localDB) {
      throw new Error('Base de datos local no disponible');
    }
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
    console.log('🚀 Inicializando base de datos (browser build)...');
    
    // Verificar que las bases de datos estén disponibles
    if (!localDB) {
      console.warn('⚠️ Reintentando crear base local...');
      localDB = createLocalDB();
    }

    if (!remoteDB) {
      console.warn('⚠️ Reintentando crear base remota...');
      remoteDB = createRemoteDB();
    }

    // Verificar conexión local si está disponible
    if (localDB) {
      try {
        const localInfo = await localDB.info();
        console.log('✅ Base de datos local:', localInfo.db_name);

        // Crear índices básicos
        try {
          await localDB.createIndex({
            index: { fields: ['type'] }
          });
          
          await localDB.createIndex({
            index: { fields: ['type', 'code'] }
          });
          
          console.log('📊 Índices creados correctamente');
        } catch (indexError) {
          console.warn('⚠️ Algunos índices ya existen:', indexError.message);
        }
      } catch (localError) {
        console.warn('⚠️ Error verificando base local:', localError.message);
      }
    } else {
      console.warn('⚠️ Base local no disponible');
    }

    // Actualizar referencias en el objeto database
    database.local = localDB;
    database.remote = remoteDB;

    console.log('✅ Base de datos inicializada correctamente (browser)');
    return database;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    // Retornar database incluso si la inicialización falla
    return database;
  }
};

export { database, initDatabase };
export default database;
