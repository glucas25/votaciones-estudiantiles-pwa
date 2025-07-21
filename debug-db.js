// debug-db.js - Script para verificar datos en la base de datos desde la consola del navegador

// Función para verificar estudiantes en la base de datos
async function debugDatabase() {
  try {
    console.log('🔍 Verificando base de datos...');
    
    // Abrir la base de datos directamente
    const dbName = 'votaciones_estudiantiles_2024';
    const request = indexedDB.open(dbName);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      console.log('📊 Base de datos abierta:', db.name);
      console.log('📋 Object stores disponibles:', Array.from(db.objectStoreNames));
      
      // Verificar estudiantes
      const transaction = db.transaction(['students'], 'readonly');
      const store = transaction.objectStore('students');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const students = getAllRequest.result;
        console.log(`👥 Total estudiantes en DB: ${students.length}`);
        
        if (students.length > 0) {
          console.log('📚 Estudiantes encontrados:');
          students.forEach((student, index) => {
            console.log(`  ${index + 1}. ${student.nombres} ${student.apellidos} - Curso: "${student.curso || student.course}" - Level: "${student.level || student.nivel}"`);
          });
          
          // Agrupar por curso
          const byCourse = {};
          students.forEach(student => {
            const course = student.curso || student.course || 'Sin curso';
            if (!byCourse[course]) byCourse[course] = [];
            byCourse[course].push(student);
          });
          
          console.log('📊 Estudiantes por curso:');
          Object.keys(byCourse).forEach(course => {
            console.log(`  "${course}": ${byCourse[course].length} estudiantes`);
          });
        } else {
          console.log('⚠️ No hay estudiantes en la base de datos');
        }
      };
      
      getAllRequest.onerror = function() {
        console.error('❌ Error al leer estudiantes:', getAllRequest.error);
      };
    };
    
    request.onerror = function() {
      console.error('❌ Error al abrir base de datos:', request.error);
    };
    
  } catch (error) {
    console.error('❌ Error en debugDatabase:', error);
  }
}

// Función para limpiar la base de datos
async function clearDatabase() {
  const dbName = 'votaciones_estudiantiles_2024';
  const deleteRequest = indexedDB.deleteDatabase(dbName);
  
  deleteRequest.onsuccess = function() {
    console.log('🗑️ Base de datos eliminada. Recarga la página.');
  };
  
  deleteRequest.onerror = function() {
    console.error('❌ Error al eliminar base de datos');
  };
}

// Hacer las funciones disponibles globalmente
window.debugDatabase = debugDatabase;
window.clearDatabase = clearDatabase;

console.log('🛠️ Funciones de debug disponibles:');
console.log('- debugDatabase() - Verificar contenido de la BD');
console.log('- clearDatabase() - Limpiar la BD completamente');