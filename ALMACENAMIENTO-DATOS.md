# 💾 ALMACENAMIENTO DE DATOS - SISTEMA DE VOTACIÓN

## 🎯 RESPUESTAS DIRECTAS

### **✅ ¿Los datos importados se guardan en la base de datos?**
**SÍ** - Todos los datos importados se almacenan permanentemente en **IndexedDB** del navegador.

### **🔍 ¿Dónde puedo ver los datos fuera de la aplicación?**
**NO es posible acceder directamente** - Los datos están encriptados en IndexedDB y solo son accesibles desde la aplicación web.

---

## 📂 UBICACIÓN DE ALMACENAMIENTO

### **🌐 IndexedDB (Base de Datos Principal)**
```
Ubicación: Navegador Web → IndexedDB
Nombre: votaciones_estudiantiles_2024
Tipo: Base de datos NoSQL local
Acceso: Solo desde la aplicación
```

### **📋 Colecciones de Datos:**
1. **`students`** - Estudiantes importados/registrados
2. **`candidates`** - Candidatos electorales
3. **`votes`** - Votos registrados
4. **`sessions`** - Sesiones de votación
5. **`election_config`** - Configuración y backups

---

## 🔍 CÓMO ACCEDER A LOS DATOS

### **1. DENTRO DE LA APLICACIÓN (Recomendado)**

#### **Inspector de Base de Datos:**
1. **AdminDashboard** → Pestaña **"🔍 Base de Datos"**
2. Ver todos los datos en formato JSON
3. Exportar backup completo
4. Limpiar colecciones si es necesario

#### **Panel de Transición:**
1. **AdminDashboard** → Pestaña **"🔄 Transición"**
2. Crear backups automáticos
3. Exportar template de datos mock

### **2. HERRAMIENTAS DE DESARROLLADOR (Avanzado)**

#### **Chrome DevTools:**
```bash
1. F12 → Application → IndexedDB
2. Buscar: votaciones_estudiantiles_2024
3. Expandir → Object Stores
4. Ver: students, candidates, votes, etc.
```

#### **Firefox DevTools:**
```bash
1. F12 → Storage → IndexedDB
2. Buscar: votaciones_estudiantiles_2024
3. Navegar por las colecciones
```

### **3. EXPORTACIÓN PROGRAMÁTICA**

#### **Desde Consola del Navegador:**
```javascript
// Abrir consola (F12) y ejecutar:
(async () => {
  const { databaseService } = await import('./src/services/database-indexeddb.js');
  const data = await databaseService.exportAllData();
  console.log('📊 Datos exportados:', data);
  
  // Descargar como JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'votaciones_export.json';
  a.click();
})();
```

---

## 💾 FORMATOS DE BACKUP

### **1. JSON Export (Inspector de BD)**
```json
{
  "students": [
    {
      "_id": "student_EST001_1705751234567",
      "_rev": "1-abc123",
      "cedula": "EST001",
      "nombres": "Juan Carlos",
      "apellidos": "Pérez González",
      "curso": "Tercero Bach A",
      "nivel": "BACHILLERATO",
      "type": "student",
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "candidates": [...],
  "votes": [...]
}
```

### **2. CSV Export (Para Excel)**
Desde el Inspector de BD puedes exportar cada colección y convertir a CSV.

---

## 🔧 GESTIÓN DE DATOS

### **✅ OPERACIONES DISPONIBLES:**

#### **Backup Automático:**
- Se crea automáticamente antes de importaciones
- Se guarda en `election_config` collection
- Mantiene últimos 5 backups

#### **Exportación Manual:**
1. **Inspector BD** → Botón "💾 Exportar JSON"
2. **Panel Transición** → "📥 Descargar Template"

#### **Limpieza de Datos:**
1. **Inspector BD** → Botón "🗑️ Limpiar" por colección
2. **Panel Transición** → "🧪 Reset a Mock"

### **🔒 PERSISTENCIA:**
- **Permanente** en el navegador
- **Sobrevive** al cerrar/abrir navegador
- **Se mantiene** entre sesiones
- **No se pierde** al recargar página

---

## ⚠️ LIMITACIONES Y CONSIDERACIONES

### **🚫 NO PUEDES:**
- Acceder desde otro navegador
- Acceder desde otro dispositivo
- Usar herramientas externas de BD
- Sincronizar automáticamente entre dispositivos

### **✅ SÍ PUEDES:**
- Exportar a JSON para backup
- Migrar datos entre navegadores (exportar/importar)
- Hacer backup antes de operaciones críticas
- Ver todos los datos desde el Inspector

### **💡 RECOMENDACIONES:**

#### **Para Backup Regular:**
1. Usar **Inspector BD** semanalmente
2. Exportar JSON y guardar en lugar seguro
3. Crear backups antes de importaciones grandes

#### **Para Migración de Datos:**
1. Exportar desde navegador origen
2. Importar en navegador destino usando Panel Transición
3. Verificar integridad con Inspector BD

#### **Para Troubleshooting:**
1. Usar **Inspector BD** para verificar estado actual
2. Revisar logs en Panel Transición
3. Crear backup antes de cualquier operación de limpieza

---

## 🔍 VERIFICACIÓN DE DATOS

### **Confirmar que los datos se guardaron:**
1. **AdminDashboard** → **"🔍 Base de Datos"**
2. Seleccionar pestaña **"students"**
3. Verificar que aparecen los estudiantes importados
4. Confirmar que tienen `_id` y `_rev` (campos de BD)

### **Ejemplo de estudiante guardado correctamente:**
```json
{
  "_id": "student_EST001_1705751234567",
  "_rev": "1-abc123def456",
  "cedula": "EST001",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez González",
  "curso": "Tercero Bach A",
  "nivel": "BACHILLERATO",
  "type": "student",
  "createdAt": "2024-01-20T10:30:00.000Z",
  "status": "pending"
}
```

---

## 📞 SOPORTE

**Si necesitas acceder a los datos para análisis externo:**
1. Usar Inspector BD para exportar JSON
2. Convertir JSON a CSV con herramientas online
3. Importar CSV en Excel/Google Sheets para análisis

**Para backup de seguridad:**
1. Exportar JSON regularmente
2. Guardar en múltiples ubicaciones
3. Verificar integridad antes de operaciones críticas