// src/hooks/useDatabase.jsx
import { useState, useEffect, useCallback } from 'react';

export const useDatabase = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    local: false,
    remote: false,
    online: navigator.onLine,
    loading: true,
    error: null
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [database, setDatabase] = useState(null);

  const checkConnectionStatus = useCallback(async () => {
    if (!database) {
      setConnectionStatus({
        local: false,
        remote: false,
        online: navigator.onLine,
        loading: false,
        error: 'Base de datos no inicializada'
      });
      return;
    }

    try {
      const status = await database.getConnectionStatus();
      setConnectionStatus({
        ...status,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error verificando conexión:', error);
      setConnectionStatus({
        local: false,
        remote: false,
        online: navigator.onLine,
        loading: false,
        error: error.message || 'Error desconocido'
      });
    }
  }, [database]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Importación dinámica para evitar errores de constructor durante el renderizado
        const { database: db, initDatabase } = await import('../services/database-simple');
        
        // Verificar que database se importó correctamente
        if (!db) {
          throw new Error('No se pudo importar la configuración de base de datos');
        }

        // Inicializar base de datos de forma defensiva
        let initializedDB;
        try {
          initializedDB = await initDatabase();
        } catch (initError) {
          console.warn('⚠️ Error en initDatabase, usando database base:', initError.message);
          initializedDB = db;
        }

        setDatabase(initializedDB);
        setIsInitialized(true);
        
        // Verificar conexión solo si la inicialización fue exitosa
        if (initializedDB && initializedDB.getConnectionStatus) {
          await checkConnectionStatus();
        } else {
          setConnectionStatus({
            local: false,
            remote: false,
            online: navigator.onLine,
            loading: false,
            error: 'Base de datos no disponible'
          });
        }
      } catch (error) {
        console.error('❌ Error crítico inicializando base de datos:', error);
        setConnectionStatus({
          local: false,
          remote: false,
          online: navigator.onLine,
          loading: false,
          error: `Error crítico: ${error.message}`
        });
        setIsInitialized(false);
      }
    };

    initialize();
  }, []); // Removed checkConnectionStatus dependency to avoid circular calls

  return {
    database,
    connectionStatus,
    isInitialized,
    refreshStatus: checkConnectionStatus
  };
};

export default useDatabase;