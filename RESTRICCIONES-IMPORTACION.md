# 📋 RESTRICCIONES Y FORMATO PARA IMPORTACIÓN DE ESTUDIANTES

## ❌ PROBLEMA COMÚN: ¿Por qué falla la importación?

Los errores más frecuentes son:
1. **Cédulas ecuatorianas inválidas** (no pasan el algoritmo de validación)
2. **Formato de curso incorrecto** para el nivel educativo
3. **Nombres con caracteres especiales** no permitidos
4. **Niveles educativos incorrectos**

---

## 📊 RESTRICCIONES DE ARCHIVO

### **Formato de Archivo**
- ✅ **Tipos soportados**: CSV (.csv), Excel (.xlsx, .xls)
- ✅ **Tamaño máximo**: 50MB
- ✅ **Máximo estudiantes**: 1000 registros
- ✅ **Encoding**: UTF-8 (recomendado)

### **Estructura del Archivo**
**Columnas REQUERIDAS** (nombres flexibles):
```csv
cedula,nombres,apellidos,curso,nivel,año
```

**Nombres alternativos aceptados:**
- **cedula**: cedula, cédula, ci, identificacion, id, documento
- **nombres**: nombres, nombre, first_name, firstname, name
- **apellidos**: apellidos, apellido, last_name, lastname, surname
- **curso**: curso, class, grade, grado, seccion, sección
- **nivel**: nivel, level, education_level, nivel_educativo
- **año**: año, year, anio, periodo, academic_year

---

## 🔍 VALIDACIONES POR CAMPO

### **1. CÉDULA/ID (Campo Obligatorio)**

#### **Restricciones:**
- ✅ **Campo requerido** (no puede estar vacío)
- ✅ **Cualquier formato** aceptado (números, letras, guiones, etc.)
- ✅ **Sin duplicados** en el archivo

#### **Ejemplos Válidos:**
```
1750123456     ✅ (Cédula ecuatoriana)
ABC123         ✅ (ID personalizado)
EST-001        ✅ (ID con guiones)
12345          ✅ (ID corto)
ESTUDIANTE001  ✅ (ID alfanumérico)
```

#### **Ejemplos Inválidos:**
```
                ❌ (Campo vacío)
```

### **2. NOMBRES (Campo Obligatorio)**

#### **Restricciones:**
- ✅ **Mínimo 2 caracteres**
- ✅ **Máximo 50 caracteres**
- ✅ **Solo letras, espacios, apostrofes ('), guiones (-)**
- ✅ **Caracteres latinos** (á, é, í, ó, ú, ñ, ü)
- ✅ **Se normaliza automáticamente** (Primera Letra Mayúscula)

#### **Ejemplos Válidos:**
```
Juan Carlos        ✅
María José         ✅
José-Luis          ✅
Ana O'connor       ✅
Sofía              ✅
```

#### **Ejemplos Inválidos:**
```
J                  ❌ (Muy corto)
Juan123            ❌ (Contiene números)
Juan@Carlos        ❌ (Caracteres especiales no permitidos)
```

### **3. APELLIDOS (Campo Obligatorio)**

#### **Restricciones:**
- ✅ **Mínimo 2 caracteres**
- ✅ **Máximo 50 caracteres**
- ✅ **Mismas reglas que nombres**

#### **Ejemplos Válidos:**
```
Pérez González     ✅
López              ✅
De la Cruz         ✅
O'Connor-Silva     ✅
```

### **4. NIVEL (Campo Obligatorio)**

#### **Valores Permitidos:**
```
BASICA_ELEMENTAL   ✅ (1ro, 2do, 3ro, 4to)
BASICA_MEDIA       ✅ (5to, 6to, 7mo)
BASICA_SUPERIOR    ✅ (8vo, 9no, 10mo)
BACHILLERATO       ✅ (1ro, 2do, 3ro Bach)

Alternativas aceptadas:
ELEMENTAL          ✅ (se convierte a BASICA_ELEMENTAL)
MEDIA             ✅ (se convierte a BASICA_MEDIA)
SUPERIOR          ✅ (se convierte a BASICA_SUPERIOR)
BACH              ✅ (se convierte a BACHILLERATO)
```

#### **Ejemplos Inválidos:**
```
PRIMARIA          ❌
SECUNDARIA        ❌
UNIVERSIDAD       ❌
```

### **5. CURSO (Campo Obligatorio)**

#### **Formato Flexible:**
El sistema acepta **cualquier formato** de curso que ingrese el usuario.

#### **Ejemplos Válidos:**
```
Primero A         ✅ 
1ro A             ✅
1ero A            ✅
1ero BGU A        ✅
Segundo B         ✅
2do Bach B        ✅
Tercero C         ✅
3ro EGB C         ✅
Octavo A          ✅
8vo A             ✅
Noveno B          ✅
9no B             ✅
Decimo A          ✅
10mo A            ✅
Curso 1A          ✅
Grado 5B          ✅
```

#### **Ejemplos Inválidos:**
```
                  ❌ (Campo vacío)
```

### **6. AÑO (Campo Opcional)**

#### **Restricciones:**
- ✅ **Rango válido**: 2020 - 2026
- ✅ **Solo números**
- ✅ **Valor por defecto**: Año actual

#### **Ejemplos Válidos:**
```
2024              ✅
2025              ✅
```

---

## 📝 FORMATO CORRECTO DE ARCHIVO CSV

### **Ejemplo Completo:**
```csv
cedula,nombres,apellidos,curso,nivel,año
EST001,Juan Carlos,Pérez González,Tercero Bach A,BACHILLERATO,2024
EST002,María José,López Silva,Segundo BGU B,BACHILLERATO,2024
EST003,Pedro Antonio,Martínez Cruz,Decimo A,BASICA_SUPERIOR,2024
EST004,Ana Isabel,García Torres,9no B,BASICA_SUPERIOR,2024
EST005,Luis Miguel,Hernández López,Septimo A,BASICA_MEDIA,2024
```

### **Con Nombres Alternativos de Columnas:**
```csv
ci,nombre,apellido,grado,level,year
1750123456,Juan Carlos,Pérez González,3ro Bach A,BACHILLERATO,2024
0912345678,María José,López Silva,2do Bach B,BACHILLERATO,2024
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### **Error: "Cédula: Dígito verificador de cédula inválido"**
```
Problema: La cédula no pasa la validación ecuatoriana
Solución: Verificar que las cédulas sean reales y válidas
Herramienta: Usar validador de cédulas ecuatorianas online
```

### **Error: "Curso: Formato de curso inválido para nivel X"**
```
Problema: El formato del curso no coincide con el nivel
Ejemplos:
- "1ro A" con nivel "BASICA_MEDIA" ❌
- "5to A" con nivel "BACHILLERATO" ❌

Solución: Verificar correspondencia nivel-curso
```

### **Error: "Nombres: contiene caracteres inválidos"**
```
Problema: Nombres con números o símbolos especiales
Ejemplos problemáticos:
- "Juan123" ❌
- "María@José" ❌
- "Ana (Nickname)" ❌

Solución: Solo usar letras, espacios, apostrofes y guiones
```

### **Error: "Nivel: Nivel educativo inválido"**
```
Problema: Valor de nivel no reconocido
Ejemplos problemáticos:
- "PRIMARIA" ❌
- "SECUNDARIA" ❌
- "PREESCOLAR" ❌

Solución: Usar solo los 4 niveles permitidos
```

### **Error: "Cédula: Ya existe un estudiante con esta cédula"**
```
Problema: Cédulas duplicadas en el archivo o base de datos
Solución: 
1. Eliminar duplicados del archivo
2. O usar "Reset a Mock" para limpiar la base de datos
```

---

## 🛠️ HERRAMIENTAS DE AYUDA

### **Generador de Cédulas Ecuatorianas (Para Testing)**
Usa herramientas online como:
- Generador de cédulas ecuatorianas válidas
- Validador de cédulas en línea

### **Template CSV Básico**
```csv
cedula,nombres,apellidos,curso,nivel,año
1750123456,Juan Carlos,Pérez González,3ro Bach A,BACHILLERATO,2024
0912345678,María José,López Silva,2do Bach B,BACHILLERATO,2024
1850123456,Pedro Antonio,Martínez Cruz,10mo A,BASICA_SUPERIOR,2024
```

### **Validación Previa**
Antes de importar, verificar:
1. ✅ Todas las cédulas son válidas (10 dígitos, algoritmo ecuatoriano)
2. ✅ Nombres y apellidos solo contienen letras, espacios, ' y -
3. ✅ Nivel está en la lista permitida
4. ✅ Curso coincide con el formato del nivel
5. ✅ No hay duplicados en el archivo

---

## 🎯 PROCESO RECOMENDADO

### **1. Preparar Archivo**
1. Usar template CSV proporcionado
2. Completar con datos reales válidos
3. Verificar cada campo manualmente

### **2. Importar en Lotes Pequeños**
1. Probar con 5-10 estudiantes primero
2. Si funciona, importar el archivo completo
3. Monitorear logs de validación

### **3. En Caso de Errores**
1. Revisar el reporte de validación detallado
2. Corregir errores específicos en el archivo
3. Volver a intentar la importación

---

📞 **Si sigues teniendo problemas, por favor comparte:**
1. Una muestra de tu archivo CSV (3-5 filas)
2. Los errores específicos que aparecen
3. Screenshot del panel de validación