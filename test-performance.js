// Performance test script for Phase 7 optimizations
// This script can be run in the browser console to test performance improvements

console.log('🚀 Starting Performance Tests for Phase 7 Optimizations');

// Test 1: Cache System Test
if (typeof smartCache !== 'undefined') {
  console.log('✅ Smart Cache system is available');
  
  // Test cache operations
  smartCache.set('test-key', { data: 'test' }, 'electoralLists');
  const cached = smartCache.get('test-key', 'electoralLists');
  console.log('✅ Cache set/get test:', cached ? 'PASSED' : 'FAILED');
  
  // Test cache stats
  const stats = smartCache.getStats();
  console.log('📊 Cache stats:', stats);
} else {
  console.warn('⚠️ Smart Cache not available - this is expected if not in browser');
}

// Test 2: Performance Monitor Test  
if (typeof performanceMonitor !== 'undefined') {
  console.log('✅ Performance Monitor is available');
  
  // Test timer functionality
  const timer = performanceMonitor.startTimer('testOperation');
  setTimeout(() => {
    timer.end({ test: true });
    console.log('✅ Performance timer test completed');
    
    // Get test metrics
    const stats = performanceMonitor.getMetricStats('testOperation');
    console.log('📊 Test operation stats:', stats);
  }, 100);
} else {
  console.warn('⚠️ Performance Monitor not available - this is expected if not in browser');
}

// Test 3: Database Service Test
if (typeof databaseService !== 'undefined') {
  console.log('✅ Database Service is available');
  
  // Test database ready state
  console.log('📋 Database ready state:', databaseService.isReady());
  
  // Test database stats (async)
  databaseService.getDatabaseStats().then(stats => {
    console.log('📊 Database stats:', stats);
  }).catch(err => {
    console.error('❌ Database stats error:', err);
  });
} else {
  console.warn('⚠️ Database Service not available - this is expected if not in browser');
}

// Test 4: Memory usage check
if ('memory' in performance) {
  const memInfo = {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
  };
  console.log('🧠 Memory usage:', memInfo);
} else {
  console.log('🧠 Memory API not available');
}

// Test 5: IndexedDB connection test
if (typeof indexedDB !== 'undefined') {
  console.log('✅ IndexedDB is available');
  
  // Test opening database
  const request = indexedDB.open('votaciones_estudiantiles_2024', 3);
  request.onsuccess = () => {
    console.log('✅ IndexedDB connection test: PASSED');
    request.result.close();
  };
  request.onerror = () => {
    console.error('❌ IndexedDB connection test: FAILED');
  };
} else {
  console.warn('⚠️ IndexedDB not available');
}

console.log('🎯 Performance tests initiated. Check logs above for results.');
console.log('💡 To run more tests, open the app in browser and run this script in console');