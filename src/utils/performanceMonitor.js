// Performance Monitor para Sistema de Votaciones Estudiantiles
// Monitoreo específico para IndexedDB y operaciones electorales

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isMonitoring = false;
    this.thresholds = {
      electoralListsLoad: 300, // ms
      studentSearch: 150, // ms
      voteProcess: 30000, // ms (30 segundos)
      pdfGeneration: 8000, // ms
      studentStatusUpdate: 50, // ms
      memoryUsage: 100 * 1024 * 1024, // 100MB
    };
  }

  /**
   * Iniciar monitoreo de performance
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Performance Monitor iniciado');
    
    // Monitorear Core Web Vitals
    this.observeWebVitals();
    
    // Monitorear uso de memoria
    this.startMemoryMonitoring();
    
    // Monitorear IndexedDB operations
    this.instrumentIndexedDB();
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('⏹️ Performance Monitor detenido');
  }

  /**
   * Medir tiempo de operación
   */
  startTimer(operationName) {
    const startTime = performance.now();
    
    return {
      end: (additionalData = {}) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric(operationName, {
          duration,
          timestamp: new Date().toISOString(),
          ...additionalData
        });
        
        // Verificar si excede threshold
        const threshold = this.thresholds[operationName];
        if (threshold && duration > threshold) {
          console.warn(`⚠️ Performance Warning: ${operationName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
        }
        
        return duration;
      }
    };
  }

  /**
   * Registrar métrica
   */
  recordMetric(name, data) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name);
    metrics.push(data);
    
    // Mantener solo las últimas 100 métricas por operación
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    console.log(`📊 Metric recorded: ${name}`, data);
  }

  /**
   * Obtener estadísticas de una métrica
   */
  getMetricStats(name) {
    const metrics = this.metrics.get(name) || [];
    
    if (metrics.length === 0) {
      return null;
    }
    
    const durations = metrics.map(m => m.duration).filter(d => d !== undefined);
    
    if (durations.length === 0) {
      return { count: metrics.length, data: metrics };
    }
    
    const sorted = durations.sort((a, b) => a - b);
    
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      threshold: this.thresholds[name],
      withinThreshold: this.thresholds[name] ? 
        durations.filter(d => d <= this.thresholds[name]).length / durations.length * 100 : null
    };
  }

  /**
   * Obtener reporte completo
   */
  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      memoryUsage: this.getMemoryUsage(),
      metrics: {}
    };
    
    // Procesar todas las métricas
    for (const [name, _] of this.metrics) {
      report.metrics[name] = this.getMetricStats(name);
    }
    
    return report;
  }

  /**
   * Monitorear Core Web Vitals
   */
  observeWebVitals() {
    if ('web-vital' in window) {
      // Si está disponible, usar web-vitals library
      return;
    }
    
    // Observar Paint Timing
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('webVitals', {
            name: entry.name,
            value: entry.startTime,
            type: 'paint'
          });
        }
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
      
      // Observar Navigation Timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            firstByte: entry.responseStart - entry.requestStart
          });
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    }
  }

  /**
   * Monitorear uso de memoria
   */
  startMemoryMonitoring() {
    const checkMemory = () => {
      if (!this.isMonitoring) return;
      
      const memoryInfo = this.getMemoryUsage();
      this.recordMetric('memoryUsage', memoryInfo);
      
      if (memoryInfo.used > this.thresholds.memoryUsage) {
        console.warn('⚠️ High memory usage detected:', memoryInfo);
      }
      
      setTimeout(checkMemory, 30000); // Check every 30 seconds
    };
    
    checkMemory();
  }

  /**
   * Obtener información de memoria
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      used: 'N/A',
      total: 'N/A',
      limit: 'N/A',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Instrumentar IndexedDB para monitoreo
   */
  instrumentIndexedDB() {
    // Wrappear métodos de IndexedDB para monitoreo automático
    if (typeof window !== 'undefined' && window.databaseService) {
      const originalFind = window.databaseService.findDocuments;
      const originalUpdate = window.databaseService.updateDocument;
      const originalCreate = window.databaseService.createDocument;
      
      window.databaseService.findDocuments = async (storeName, query) => {
        const timer = this.startTimer('indexedDBQuery');
        try {
          const result = await originalFind.call(window.databaseService, storeName, query);
          timer.end({ 
            storeName, 
            queryType: 'find',
            resultCount: result.docs?.length || 0 
          });
          return result;
        } catch (error) {
          timer.end({ 
            storeName, 
            queryType: 'find',
            error: error.message 
          });
          throw error;
        }
      };
      
      window.databaseService.updateDocument = async (storeName, document) => {
        const timer = this.startTimer('indexedDBUpdate');
        try {
          const result = await originalUpdate.call(window.databaseService, storeName, document);
          timer.end({ storeName, queryType: 'update' });
          return result;
        } catch (error) {
          timer.end({ storeName, queryType: 'update', error: error.message });
          throw error;
        }
      };
      
      window.databaseService.createDocument = async (storeName, document, type) => {
        const timer = this.startTimer('indexedDBCreate');
        try {
          const result = await originalCreate.call(window.databaseService, storeName, document, type);
          timer.end({ storeName, queryType: 'create', type });
          return result;
        } catch (error) {
          timer.end({ storeName, queryType: 'create', type, error: error.message });
          throw error;
        }
      };
      
      console.log('✅ IndexedDB instrumentation active');
    }
  }

  /**
   * Medir performance de carga de listas electorales
   */
  measureElectoralListsLoad() {
    return this.startTimer('electoralListsLoad');
  }

  /**
   * Medir performance de búsqueda de estudiantes
   */
  measureStudentSearch(query) {
    return this.startTimer('studentSearch');
  }

  /**
   * Medir performance de proceso de votación
   */
  measureVoteProcess() {
    return this.startTimer('voteProcess');
  }

  /**
   * Medir performance de generación de PDF
   */
  measurePDFGeneration(reportType) {
    return this.startTimer('pdfGeneration');
  }

  /**
   * Medir performance de actualización de estado de estudiante
   */
  measureStudentStatusUpdate() {
    return this.startTimer('studentStatusUpdate');
  }

  /**
   * Exportar métricas para análisis
   */
  exportMetrics() {
    const report = this.getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📊 Performance report exported');
  }

  /**
   * Limpiar métricas
   */
  clearMetrics() {
    this.metrics.clear();
    console.log('🧹 Performance metrics cleared');
  }
}

// Crear instancia global
const performanceMonitor = new PerformanceMonitor();

// Auto-start en desarrollo
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}

// Exponer globalmente para debugging
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;