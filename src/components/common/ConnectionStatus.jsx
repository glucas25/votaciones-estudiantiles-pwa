// src/components/common/ConnectionStatus.jsx
import React from 'react';
import useDatabase from '../../hooks/useDatabase';

const ConnectionStatus = () => {
  const { connectionStatus, refreshStatus } = useDatabase();

  const getConnectionIcon = () => {
    if (connectionStatus.loading) return '🔄';
    return connectionStatus.online ? '🟢' : '🔴';
  };

  const getConnectionText = () => {
    if (connectionStatus.loading) return 'Verificando...';
    return connectionStatus.online ? 'Online' : 'Sin conexión';
  };

  const getCouchDBIcon = () => {
    if (connectionStatus.loading) return '🔄';
    return connectionStatus.remote ? '🟢' : '🔴';
  };

  const getCouchDBText = () => {
    if (connectionStatus.loading) return 'Verificando...';
    return connectionStatus.remote ? 'CouchDB Conectado' : 'CouchDB No disponible';
  };

  const getViteIcon = () => '🟢';
  const getViteText = () => 'Vite Funcionando';

  const handleRefresh = () => {
    refreshStatus();
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '32px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '24px' }}>📊</span>
        <h3 style={{
          margin: 0,
          color: 'white',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Estado del Sistema
        </h3>
        <button
          onClick={handleRefresh}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            marginLeft: 'auto'
          }}
          disabled={connectionStatus.loading}
        >
          {connectionStatus.loading ? '🔄' : '🔄'} Actualizar
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Conexión a Internet */}
        <span style={{ fontSize: '18px' }}>🌐</span>
        <span style={{ color: 'white', fontSize: '16px' }}>
          Conexión:
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>{getConnectionIcon()}</span>
          <span style={{
            color: connectionStatus.online ? '#10B981' : '#EF4444',
            fontWeight: '500'
          }}>
            {getConnectionText()}
          </span>
        </div>

        {/* Base de Datos */}
        <span style={{ fontSize: '18px' }}>🗄️</span>
        <span style={{ color: 'white', fontSize: '16px' }}>
          Base de Datos:
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>{getCouchDBIcon()}</span>
          <span style={{
            color: connectionStatus.remote ? '#10B981' : '#EF4444',
            fontWeight: '500'
          }}>
            {getCouchDBText()}
          </span>
        </div>

        {/* Aplicación */}
        <span style={{ fontSize: '18px' }}>⚡</span>
        <span style={{ color: 'white', fontSize: '16px' }}>
          Aplicación:
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>{getViteIcon()}</span>
          <span style={{
            color: '#10B981',
            fontWeight: '500'
          }}>
            {getViteText()}
          </span>
        </div>

        {/* Hora */}
        <span style={{ fontSize: '18px' }}>🕒</span>
        <span style={{ color: 'white', fontSize: '16px' }}>
          Hora:
        </span>
        <span style={{
          color: 'white',
          fontWeight: '500'
        }}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Indicador de modo offline */}
      {!connectionStatus.online && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#FEF2F2',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          <span>
            Modo offline activado. Los datos se sincronizarán automáticamente cuando se restaure la conexión.
          </span>
        </div>
      )}

      {/* Indicador de sincronización */}
      {connectionStatus.online && connectionStatus.remote && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#F0FDF4',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✅</span>
          <span>
            Sistema totalmente operativo. Sincronización automática activa.
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;