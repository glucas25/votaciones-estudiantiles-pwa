// src/components/common/DatabaseTest.jsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase.js';

const DatabaseTest = () => {
  const { isReady, connectionStatus, getStats, databaseService } = useDatabase();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDatabaseTest = async () => {
    if (!isReady) {
      alert('Database not ready yet');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    const results = [];
    
    try {
      // Test 1: Database connection
      results.push({
        test: 'Database Connection',
        result: isReady ? 'PASS' : 'FAIL',
        details: isReady ? 'Database is ready' : 'Database not ready'
      });

      // Test 2: Create a test document
      const testDoc = {
        nombre: 'Test Student',
        apellidos: 'Test Apellidos',
        cedula: '1234567890',
        level: 'BACHILLERATO',
        course: 'Test Course'
      };

      const createResult = await databaseService.createDocument('students', testDoc, 'student');
      results.push({
        test: 'Create Document',
        result: createResult.success ? 'PASS' : 'FAIL',
        details: createResult.success ? `Created document with ID: ${createResult.id}` : createResult.error
      });

      // Test 3: Find documents
      const findResult = await databaseService.findDocuments('students', {
        selector: { type: 'student' }
      });
      results.push({
        test: 'Find Documents',
        result: findResult.docs ? 'PASS' : 'FAIL',
        details: `Found ${findResult.docs?.length || 0} documents`
      });

      // Test 4: Search documents
      const searchResult = await databaseService.searchDocuments('students', 'Test', ['nombre', 'apellidos']);
      results.push({
        test: 'Search Documents',
        result: searchResult.success ? 'PASS' : 'FAIL',
        details: `Search returned ${searchResult.docs?.length || 0} results`
      });

      // Test 5: Get database stats
      const stats = await getStats();
      results.push({
        test: 'Database Statistics',
        result: stats ? 'PASS' : 'FAIL',
        details: stats ? `${Object.keys(stats.databases).length} databases available` : 'No stats available'
      });

    } catch (error) {
      results.push({
        test: 'Database Test',
        result: 'ERROR',
        details: error.message
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 Database Test Panel</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Database Ready:</strong> {isReady ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Connection Status:</strong> {connectionStatus.local ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p><strong>Online:</strong> {connectionStatus.online ? '🌐 Online' : '📱 Offline'}</p>
      </div>

      <button 
        onClick={runDatabaseTest}
        disabled={isRunning || !isReady}
        style={{
          padding: '10px 20px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer'
        }}
      >
        {isRunning ? '🔄 Running Tests...' : '🚀 Run Database Tests'}
      </button>

      {testResults.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Test Results:</h4>
          {testResults.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '8px',
                margin: '4px 0',
                borderRadius: '4px',
                backgroundColor: result.result === 'PASS' ? '#d4edda' : 
                                 result.result === 'FAIL' ? '#f8d7da' : '#fff3cd'
              }}
            >
              <strong>{result.test}:</strong> 
              <span style={{ 
                marginLeft: '10px',
                color: result.result === 'PASS' ? '#155724' : 
                       result.result === 'FAIL' ? '#721c24' : '#856404'
              }}>
                {result.result}
              </span>
              <br />
              <small style={{ color: '#666' }}>{result.details}</small>
            </div>
          ))}
        </div>
      )}

      {connectionStatus.databases && Object.keys(connectionStatus.databases).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Database Status:</h4>
          {Object.entries(connectionStatus.databases).map(([dbName, dbStatus]) => (
            <div key={dbName} style={{ padding: '4px 0' }}>
              <strong>{dbName}:</strong> 
              <span style={{ marginLeft: '10px', color: dbStatus.ready ? '#28a745' : '#dc3545' }}>
                {dbStatus.ready ? '✅ Ready' : '❌ Not Ready'}
              </span>
              {dbStatus.docs !== undefined && (
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  ({dbStatus.docs} docs)
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseTest;