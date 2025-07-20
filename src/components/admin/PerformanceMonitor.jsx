// src/components/admin/PerformanceMonitor.jsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase.js';
import databaseService from '../../services/database-indexeddb.js';
import './PerformanceMonitor.css';

const PerformanceMonitor = () => {
  const { isReady, getStats } = useDatabase();
  const [stats, setStats] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    memoryUsage: 0,
    queryTime: 0,
    cacheHitRate: 0,
    activeConnections: 0
  });

  // Load initial stats
  useEffect(() => {
    if (isReady) {
      loadStats();
      startRealTimeMonitoring();
    }
  }, [isReady]);

  /**
   * Load database statistics
   */
  const loadStats = async () => {
    try {
      const databaseStats = await getStats();
      setStats(databaseStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  /**
   * Start real-time monitoring
   */
  const startRealTimeMonitoring = () => {
    const interval = setInterval(async () => {
      try {
        // Get current performance metrics
        const currentStats = await getStats();
        
        setRealTimeMetrics({
          memoryUsage: performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A',
          queryTime: currentStats?.performance?.averageQueryTime || 0,
          cacheHitRate: currentStats?.performance?.queries > 0 ? 
            ((currentStats.performance.cacheHits / currentStats.performance.queries) * 100).toFixed(1) : 0,
          activeConnections: Object.keys(currentStats?.databases || {}).length
        });
      } catch (err) {
        console.error('Failed to update real-time metrics:', err);
      }
    }, 2000); // Update every 2 seconds

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  /**
   * Generate mock student data for testing
   */
  const generateMockStudents = (count) => {
    const levels = ['BACHILLERATO', 'BASICA_SUPERIOR', 'BASICA_MEDIA', 'BASICA_ELEMENTAL'];
    const courses = ['A', 'B', 'C', 'D'];
    const nombres = ['Ana', 'Carlos', 'María', 'José', 'Luis', 'Carmen', 'Pedro', 'Isabel', 'Miguel', 'Elena'];
    const apellidos = ['García', 'Martínez', 'López', 'Sánchez', 'González', 'Pérez', 'Rodríguez', 'Fernández'];

    const students = [];
    
    for (let i = 0; i < count; i++) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const course = courses[Math.floor(Math.random() * courses.length)];
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      
      students.push({
        cedula: `17${String(i).padStart(8, '0')}`,
        nombre: nombre,
        apellidos: `${apellido} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`,
        level: level,
        course: `${level.charAt(0)}${Math.floor(i / 25) + 1}° ${course}`,
        numero: (i % 30) + 1,
        votado: Math.random() > 0.7, // 30% already voted
        status: 'active'
      });
    }
    
    return students;
  };

  /**
   * Generate mock candidates
   */
  const generateMockCandidates = () => {
    const levels = ['BACHILLERATO', 'BASICA_SUPERIOR'];
    const cargos = ['PRESIDENTE', 'VICEPRESIDENTE'];
    const nombres = ['Andrea', 'Roberto', 'Sofía', 'Daniel', 'Valentina', 'Sebastián'];
    const apellidos = ['Morales', 'Jiménez', 'Vargas', 'Herrera', 'Castro', 'Delgado'];
    
    const candidates = [];
    
    levels.forEach(level => {
      cargos.forEach(cargo => {
        for (let i = 0; i < 3; i++) { // 3 candidates per position per level
          candidates.push({
            nombre: nombres[Math.floor(Math.random() * nombres.length)],
            apellidos: apellidos[Math.floor(Math.random() * apellidos.length)],
            cargo: cargo,
            level: level,
            ticketId: `Lista ${['Azul', 'Roja', 'Verde'][i]}`,
            foto: '',
            propuestas: `Propuesta ${i + 1} para ${cargo}`,
            votos: 0
          });
        }
      });
    });
    
    return candidates;
  };

  /**
   * Run performance test with specified number of students
   */
  const runPerformanceTest = async (studentCount = 700) => {
    if (!isReady) {
      alert('Database not ready');
      return;
    }

    setIsRunningTest(true);
    setTestProgress(0);

    const testResult = {
      timestamp: new Date().toISOString(),
      studentCount,
      phases: [],
      totalTime: 0,
      success: false,
      errors: []
    };

    try {
      // Phase 1: Generate mock data
      setTestProgress(10);
      const startTime = performance.now();
      
      console.log(`🧪 Starting performance test with ${studentCount} students...`);
      const students = generateMockStudents(studentCount);
      const candidates = generateMockCandidates();
      
      testResult.phases.push({
        name: 'Data Generation',
        time: performance.now() - startTime,
        success: true
      });

      // Phase 2: Bulk insert students
      setTestProgress(30);
      const studentsStartTime = performance.now();
      
      const studentsResult = await databaseService.bulkCreate('students', students, 'student');
      const studentsTime = performance.now() - studentsStartTime;
      
      testResult.phases.push({
        name: 'Students Insert',
        time: studentsTime,
        success: studentsResult.success,
        count: studentsResult.successful
      });

      if (!studentsResult.success) {
        throw new Error('Failed to insert students');
      }

      // Phase 3: Bulk insert candidates
      setTestProgress(50);
      const candidatesStartTime = performance.now();
      
      const candidatesResult = await databaseService.bulkCreate('candidates', candidates, 'candidate');
      const candidatesTime = performance.now() - candidatesStartTime;
      
      testResult.phases.push({
        name: 'Candidates Insert',
        time: candidatesTime,
        success: candidatesResult.success,
        count: candidatesResult.successful
      });

      // Phase 4: Query performance test
      setTestProgress(70);
      const queryStartTime = performance.now();
      
      // Test various query patterns
      const queryTests = [
        // Find students by level
        () => databaseService.findDocuments('students', {
          selector: { type: 'student', level: 'BACHILLERATO' },
          limit: 100
        }),
        // Find students by course
        () => databaseService.findDocuments('students', {
          selector: { type: 'student', level: 'BACHILLERATO', course: 'B1° A' },
          limit: 50
        }),
        // Search students by name
        () => databaseService.searchDocuments('students', 'Ana', ['nombre', 'apellidos']),
        // Find all candidates
        () => databaseService.findDocuments('candidates', {
          selector: { type: 'candidate' }
        })
      ];

      const queryResults = [];
      for (const test of queryTests) {
        const queryStart = performance.now();
        try {
          const result = await test();
          queryResults.push({
            time: performance.now() - queryStart,
            success: true,
            count: result.docs?.length || 0
          });
        } catch (err) {
          queryResults.push({
            time: performance.now() - queryStart,
            success: false,
            error: err.message
          });
        }
      }

      const avgQueryTime = queryResults.reduce((sum, r) => sum + r.time, 0) / queryResults.length;
      
      testResult.phases.push({
        name: 'Query Performance',
        time: performance.now() - queryStartTime,
        success: true,
        avgQueryTime,
        queryCount: queryResults.length
      });

      // Phase 5: Memory and performance metrics
      setTestProgress(90);
      const finalStats = await getStats();
      
      testResult.phases.push({
        name: 'Final Metrics',
        success: true,
        metrics: {
          totalDocs: Object.values(finalStats.databases).reduce((sum, db) => sum + (db.docs || 0), 0),
          totalSize: Object.values(finalStats.databases).reduce((sum, db) => sum + (db.size || 0), 0),
          averageQueryTime: finalStats.performance.averageQueryTime,
          cacheHits: finalStats.performance.cacheHits,
          cacheSize: finalStats.performance.cacheSize
        }
      });

      testResult.totalTime = performance.now() - startTime;
      testResult.success = true;
      setTestProgress(100);

      console.log('✅ Performance test completed successfully');
      console.log('📊 Test Results:', testResult);

    } catch (err) {
      console.error('❌ Performance test failed:', err);
      testResult.errors.push(err.message);
      testResult.success = false;
    } finally {
      setTestResults(prev => [testResult, ...prev.slice(0, 4)]); // Keep last 5 tests
      setIsRunningTest(false);
      setTestProgress(0);
      await loadStats(); // Refresh stats
    }
  };

  /**
   * Clear test data
   */
  const clearTestData = async () => {
    if (!confirm('⚠️ This will delete ALL test data. Continue?')) {
      return;
    }

    try {
      setIsRunningTest(true);
      
      // Clear students and candidates
      const studentsResult = await databaseService.findDocuments('students', {
        selector: { type: 'student' }
      });
      
      const candidatesResult = await databaseService.findDocuments('candidates', {
        selector: { type: 'candidate' }
      });

      // Delete all students
      for (const student of studentsResult.docs || []) {
        await databaseService.deleteDocument('students', student._id, student._rev);
      }

      // Delete all candidates
      for (const candidate of candidatesResult.docs || []) {
        await databaseService.deleteDocument('candidates', candidate._id, candidate._rev);
      }

      await loadStats();
      alert('✅ Test data cleared successfully');
      
    } catch (err) {
      console.error('Failed to clear test data:', err);
      alert(`❌ Failed to clear test data: ${err.message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (ms) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  /**
   * Format file size
   */
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isReady) {
    return (
      <div className="performance-monitor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Initializing performance monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>⚡ Monitor de Rendimiento</h2>
        <p>Monitoreo en tiempo real y pruebas de carga del sistema</p>
      </div>

      {/* Real-time Metrics */}
      <div className="realtime-metrics">
        <h3>📊 Métricas en Tiempo Real</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">🧠</div>
            <div className="metric-info">
              <div className="metric-value">{realTimeMetrics.memoryUsage} MB</div>
              <div className="metric-label">Memoria JS</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">⚡</div>
            <div className="metric-info">
              <div className="metric-value">{realTimeMetrics.queryTime.toFixed(2)}ms</div>
              <div className="metric-label">Tiempo Consulta</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">💾</div>
            <div className="metric-info">
              <div className="metric-value">{realTimeMetrics.cacheHitRate}%</div>
              <div className="metric-label">Cache Hit Rate</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🔗</div>
            <div className="metric-info">
              <div className="metric-value">{realTimeMetrics.activeConnections}</div>
              <div className="metric-label">Bases de Datos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status */}
      {stats && (
        <div className="database-status">
          <h3>🗄️ Estado de Bases de Datos</h3>
          <div className="db-grid">
            {Object.entries(stats.databases).map(([dbName, dbStats]) => (
              <div key={dbName} className="db-card">
                <div className="db-name">{dbName}</div>
                <div className="db-stats">
                  <div className="db-stat">
                    <span className="stat-label">Documentos:</span>
                    <span className="stat-value">{dbStats.docs || 0}</span>
                  </div>
                  <div className="db-stat">
                    <span className="stat-label">Tamaño:</span>
                    <span className="stat-value">{formatSize(dbStats.size || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Testing */}
      <div className="performance-testing">
        <h3>🧪 Pruebas de Rendimiento</h3>
        <p>Ejecuta pruebas de carga para validar el rendimiento con grandes volúmenes de datos</p>
        
        {isRunningTest && (
          <div className="test-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${testProgress}%` }}
              ></div>
              <span className="progress-text">{testProgress}%</span>
            </div>
            <p>Ejecutando prueba de rendimiento...</p>
          </div>
        )}
        
        <div className="test-controls">
          <button 
            onClick={() => runPerformanceTest(700)}
            disabled={isRunningTest}
            className="btn-primary"
          >
            {isRunningTest ? '🔄 Ejecutando...' : '🚀 Prueba con 700 Estudiantes'}
          </button>
          
          <button 
            onClick={() => runPerformanceTest(1000)}
            disabled={isRunningTest}
            className="btn-primary"
          >
            {isRunningTest ? '🔄 Ejecutando...' : '🚀 Prueba con 1000 Estudiantes'}
          </button>
          
          <button 
            onClick={clearTestData}
            disabled={isRunningTest}
            className="btn-secondary"
          >
            {isRunningTest ? '🔄 Procesando...' : '🗑️ Limpiar Datos de Prueba'}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="test-results">
          <h3>📈 Resultados de Pruebas</h3>
          <div className="results-list">
            {testResults.map((result, index) => (
              <div key={index} className={`result-card ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <div className="result-title">
                    {result.success ? '✅' : '❌'} Prueba con {result.studentCount} estudiantes
                  </div>
                  <div className="result-time">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div className="result-summary">
                  <div className="summary-item">
                    <span>Tiempo Total:</span>
                    <span>{formatTime(result.totalTime)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Fases:</span>
                    <span>{result.phases.length}</span>
                  </div>
                  <div className="summary-item">
                    <span>Estado:</span>
                    <span className={result.success ? 'success' : 'error'}>
                      {result.success ? 'Exitoso' : 'Falló'}
                    </span>
                  </div>
                </div>
                
                {result.phases.length > 0 && (
                  <div className="phases-details">
                    {result.phases.map((phase, phaseIndex) => (
                      <div key={phaseIndex} className="phase-item">
                        <span className="phase-name">{phase.name}:</span>
                        <span className="phase-time">{formatTime(phase.time)}</span>
                        {phase.count && <span className="phase-count">({phase.count} items)</span>}
                      </div>
                    ))}
                  </div>
                )}
                
                {result.errors.length > 0 && (
                  <div className="result-errors">
                    <strong>Errores:</strong>
                    <ul>
                      {result.errors.map((error, errorIndex) => (
                        <li key={errorIndex}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;