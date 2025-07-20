// src/components/admin/DatabaseInspector.jsx
// Development tool to inspect database contents

import React, { useState, useEffect } from 'react';
import databaseService from '../../services/database-indexeddb.js';

const DatabaseInspector = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  const loadData = async () => {
    setLoading(true);
    try {
      const collections = ['students', 'candidates', 'votes', 'sessions', 'election_config'];
      const newData = {};

      for (const collection of collections) {
        try {
          const result = await databaseService.findDocuments(collection, {
            selector: {}
          });
          newData[collection] = result.docs || [];
        } catch (error) {
          newData[collection] = { error: error.message };
        }
      }

      setData(newData);
    } catch (error) {
      console.error('Error loading database data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearCollection = async (collection) => {
    if (!window.confirm(`¿Estás seguro de eliminar todos los datos de ${collection}?`)) {
      return;
    }

    try {
      const docs = data[collection] || [];
      for (const doc of docs) {
        if (doc._id && doc._rev) {
          await databaseService.deleteDocument(collection, doc._id, doc._rev);
        }
      }
      await loadData();
      alert(`Colección ${collection} eliminada`);
    } catch (error) {
      console.error('Error clearing collection:', error);
      alert('Error eliminando colección');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>🔄 Cargando datos de la base de datos...</div>
      </div>
    );
  }

  const collections = Object.keys(data);
  const activeData = data[activeTab] || [];

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>🔍 Inspector de Base de Datos</h3>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={loadData} style={{ marginRight: '10px' }}>
            🔄 Recargar
          </button>
          <button onClick={exportData} style={{ marginRight: '10px' }}>
            💾 Exportar JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', marginBottom: '20px' }}>
        {collections.map(collection => (
          <button
            key={collection}
            onClick={() => setActiveTab(collection)}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              backgroundColor: activeTab === collection ? '#007bff' : '#f8f9fa',
              color: activeTab === collection ? 'white' : 'black',
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
          >
            {collection} ({Array.isArray(data[collection]) ? data[collection].length : 0})
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Colección: {activeTab}</strong>
        {Array.isArray(activeData) && activeData.length > 0 && (
          <button
            onClick={() => clearCollection(activeTab)}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🗑️ Limpiar
          </button>
        )}
      </div>

      <div 
        style={{ 
          border: '1px solid #ddd', 
          padding: '10px', 
          backgroundColor: '#f8f9fa',
          maxHeight: '500px',
          overflow: 'auto'
        }}
      >
        {Array.isArray(activeData) ? (
          activeData.length === 0 ? (
            <div>No hay datos en esta colección</div>
          ) : (
            <pre>{JSON.stringify(activeData, null, 2)}</pre>
          )
        ) : (
          <div style={{ color: 'red' }}>
            Error: {activeData.error || 'Datos no válidos'}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>Información:</strong>
        <ul>
          <li>Los datos se almacenan en IndexedDB del navegador</li>
          <li>Cada documento tiene _id y _rev para control de versiones</li>
          <li>Solo se puede acceder desde la aplicación web</li>
          <li>Para backup real, usa la función "Exportar JSON"</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseInspector;