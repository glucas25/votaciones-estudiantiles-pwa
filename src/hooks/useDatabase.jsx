// src/hooks/useDatabase.jsx
import { useState, useEffect, useCallback } from 'react';
import { database, initDatabase } from '../services/database';

export const useDatabase = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    local: false,
    remote: false,
    online: navigator.onLine,
    loading: true
  });

  const [isInitialized, setIsInitialized] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const status = await database.getConnectionStatus();
      setConnectionStatus({
        ...status,
        loading: false
      });
    } catch (error) {
      console.error('Error verificando conexión:', error);
      setConnectionStatus({
        local: false,
        remote: false,
        online: navigator.onLine,
        loading: false
      });
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsInitialized(true);
        await checkConnectionStatus();
      } catch (error) {
        console.error('Error inicializando base de datos:', error);
        setConnectionStatus(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    initialize();
  }, [checkConnectionStatus]);

  return {
    database,
    connectionStatus,
    isInitialized,
    refreshStatus: checkConnectionStatus
  };
};

export default useDatabase;