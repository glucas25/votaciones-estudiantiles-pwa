# 📖 MANUAL DE USO - SISTEMA DE TRANSICIÓN DE DATOS

## 🎯 OBJETIVO
Este manual describe cómo usar el sistema de transición entre datos mock y reales en el Sistema de Votación Estudiantil.

## 📍 ACCESO AL SISTEMA

1. **Ingresar como Administrador**
   - Seleccionar "Administrador" en la página principal
   - Iniciar sesión con credenciales de administrador

2. **Navegar al Panel de Transición**
   - En AdminDashboard, hacer clic en la pestaña **"🔄 Transición"**
   - El panel se cargará automáticamente con estadísticas actuales

## 📊 ENTENDIENDO EL PANEL

### **Indicadores de Estado**
- **🧪 mock**: Sistema usando datos de prueba
- **📊 real**: Sistema usando datos reales importados
- **🔄 mixed**: Mezcla de datos mock y reales (requiere limpieza)

### **Estadísticas Mostradas**
- **Tipo de Datos**: Estado actual del sistema
- **Total Estudiantes**: Cantidad total en la base de datos
- **Datos Mock**: Cantidad de estudiantes de prueba
- **Datos Reales**: Cantidad de estudiantes reales
- **Backups**: Número de respaldos disponibles

## 🚀 OPERACIONES DISPONIBLES

### **1. 💾 Crear Backup**
**Cuándo usar:** Antes de cualquier operación importante
```
Función: Respalda todos los datos actuales
Tiempo: 5-10 segundos
Resultado: Backup nombrado automáticamente con timestamp
```

### **2. 🧪 Reset a Mock**
**Cuándo usar:** Para volver a datos de desarrollo/testing
```
Función: Limpia todo y restaura datos mock limpios
Tiempo: 10-15 segundos
Resultado: 8 estudiantes mock + 6 candidatos mock
⚠️ ATENCIÓN: Elimina todos los datos reales
```

### **3. 📥 Descargar Template**
**Cuándo usar:** Para obtener estructura de datos mock
```
Función: Descarga JSON con estructura de datos mock
Tiempo: Inmediato
Resultado: Archivo mock_template.json
Uso: Referencia para estructura de datos
```

### **4. ⏪ Rollback**
**Cuándo usar:** Cuando una importación falla o genera problemas
```
Función: Restaura el backup más reciente
Tiempo: 15-30 segundos
Resultado: Datos restaurados al estado anterior
Disponible: Solo si hay backups disponibles
```

## 📂 IMPORTACIÓN DE DATOS REALES

### **Preparación del Archivo**
1. **Formato soportado:** CSV o Excel (.xlsx, .xls)
2. **Tamaño máximo:** 50MB
3. **Límite de registros:** 1000 estudiantes
4. **Columnas requeridas:**
   ```
   cedula    - Cédula/ID del estudiante (requerido)
   nombres   - Nombres del estudiante (requerido)  
   apellidos - Apellidos del estudiante (requerido)
   curso     - Curso/Sección (ej: 3BGU-A)
   nivel     - Nivel educativo (BACHILLERATO, BASICA_SUPERIOR, etc.)
   año       - Año académico (opcional)
   ```

### **Proceso de Importación**
1. **Ir a pestaña "👥 Estudiantes"**
2. **Hacer clic en "📁 Importar Estudiantes"**
3. **Seleccionar archivo** (drag & drop o click)
4. **Revisar vista previa** de datos
5. **Validar datos** (se ejecuta automáticamente)
6. **Confirmar importación**

⚠️ **IMPORTANTE:** El sistema crea backup automático antes de importar

### **Validaciones Automáticas**
- ✅ Formato de cédulas
- ✅ Campos requeridos completos
- ✅ Detección de duplicados
- ✅ Validación de niveles educativos
- ✅ Límites de cantidad

## 🔄 FLUJO RECOMENDADO PARA TRANSICIÓN

### **Escenario 1: Primera Importación de Datos Reales**
```
1. 💾 Crear Backup (seguridad)
2. 👥 Ir a pestaña Estudiantes
3. 📁 Importar archivo de estudiantes reales
4. ✅ Verificar importación exitosa
5. 🔄 Confirmar en panel de transición que el estado es "real"
```

### **Escenario 2: Volver a Testing con Mock**
```
1. 🔄 Ir a panel de transición
2. 🧪 Click en "Reset a Mock"
3. ✅ Confirmar operación
4. 🔍 Verificar que el estado es "mock"
5. 🧪 Sistema listo para desarrollo/testing
```

### **Escenario 3: Recuperación de Error**
```
1. 🔄 Ir a panel de transición
2. ⏪ Click en "Rollback"
3. ⏱️ Esperar restauración
4. ✅ Verificar que datos se restauraron correctamente
5. 📋 Revisar logs para entender el problema
```

## 📋 MONITOREO Y LOGS

### **Logs de Transición**
- **Ubicación:** Panel de transición → Sección "📋 Registro de Transiciones"
- **Información:** Timestamp + descripción de cada operación
- **Utilidad:** Debugging y auditoría de cambios

### **Ejemplo de Logs**
```
[2025-01-20T10:30:15.123Z] 📊 Tipo de datos detectado: mock (8 mock, 0 reales)
[2025-01-20T10:31:45.456Z] 📦 Creando backup: backup_1705750305456...
[2025-01-20T10:32:01.789Z] ✅ Backup creado exitosamente: backup_1705750305456 (8 estudiantes, 6 candidatos, 0 votos)
[2025-01-20T10:35:22.012Z] 🚀 Iniciando importación de 150 estudiantes reales...
[2025-01-20T10:35:45.345Z] ✅ Importación de datos reales completada: 150 estudiantes
```

## ⚠️ PRECAUCIONES Y BUENAS PRÁCTICAS

### **Antes de Importar Datos Reales**
1. ✅ **Crear backup** manual
2. ✅ **Validar archivo** en entorno de prueba
3. ✅ **Revisar columnas** y formato
4. ✅ **Confirmar con el equipo** antes de proceder

### **Durante Importación Grande (500+ estudiantes)**
1. ⏳ **No cerrar navegador** durante el proceso
2. 🔌 **Mantener conexión estable**
3. 📊 **Monitorear progress bar**
4. 🚫 **No realizar otras operaciones** simultáneas

### **Después de Importación**
1. ✅ **Verificar cantidad** de estudiantes importados
2. 🔍 **Revisar logs** para confirmar éxito
3. 📊 **Probar funcionalidad** de votación
4. 💾 **Crear backup** del estado final

## 🆘 SOLUCIÓN DE PROBLEMAS

### **Error: "Duplicados encontrados"**
```
Causa: Cédulas repetidas en archivo o base de datos
Solución: 
1. Revisar archivo y eliminar duplicados
2. O usar Reset a Mock para limpiar base de datos
```

### **Error: "Importación fallida en chunk X"**
```
Causa: Error en procesamiento de un lote de datos
Solución:
1. Sistema hace rollback automático
2. Revisar logs para identificar problema
3. Corregir archivo y reintentar
```

### **Estado "mixed" no deseado**
```
Causa: Importación parcial o datos inconsistentes
Solución:
1. Reset a Mock para limpiar todo
2. O Rollback al último backup válido
```

### **Panel no carga estadísticas**
```
Causa: Error en base de datos o servicio
Solución:
1. Recargar página (F5)
2. Si persiste, revisar consola de desarrollador
3. Contactar soporte técnico
```

## 📞 SOPORTE

**Para problemas técnicos:**
- Revisar logs en panel de transición
- Tomar screenshot del error
- Contactar al equipo de desarrollo

**Para dudas de uso:**
- Consultar este manual
- Revisar documentación FASE2-TRANSICION-DATOS.md

---

📅 **Creado:** 2025-01-20  
📝 **Versión:** 1.0  
🔄 **Última actualización:** 2025-01-20