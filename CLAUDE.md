# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student voting system PWA built with React and Vite, using PouchDB for local-first data storage. The application provides role-based interfaces for administrators, tutors, and students to manage and participate in school elections.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (local only)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (when implemented)
npm test
```

## Architecture

### Database Architecture
- **IndexedDB**: Native browser database for offline functionality  
- **Local-first**: App works completely offline with local data storage
- **Data Transition System**: Robust mock ↔ real data management
- Connection status displayed via `ConnectionStatus` component
- Database service located in `src/services/database-indexeddb.js`
- Transition service located in `src/services/dataTransition.js`

### Application Structure
- **Multi-role system**: Admin, Tutor, Student interfaces
- **Context-based auth**: `AuthContext` manages authentication state
- **Protected routes**: `ProtectedRoute` and `TutorRoute` components
- **Progressive enhancement**: Currently only tutor interface is implemented

### Component Organization
```
src/components/
├── admin/           # Administrator interface (ACTIVE)
│   ├── AdminDashboard.jsx          # Dashboard principal
│   ├── StudentManager.jsx          # Gestión de estudiantes  
│   ├── StudentImport.jsx           # Importación masiva
│   ├── ActivationCodesManager.jsx  # 🔑 Gestión códigos dinámicos
│   └── DataTransitionPanel.jsx     # Panel transición datos
├── auth/            # Authentication components
│   └── TutorLogin.jsx              # 🔑 Login simplificado con códigos
├── common/          # Shared components (ConnectionStatus)
├── tutor/           # Tutor interface (active)
└── voting/          # Voting interface (planned)
```

### Key Services
- `src/services/database-indexeddb.js`: IndexedDB interface with CRUD operations
- `src/services/dataTransition.js`: Sistema de transición mock ↔ real
- `src/services/fileProcessor.js`: Procesamiento robusto CSV/Excel
- `src/services/migration.js`: Migración automática de datos
- `src/services/activationCodes.js`: **🔑 Dynamic activation codes management**
- `src/services/auth.js`: Authentication logic
- `src/hooks/useDatabase.jsx`: Database React hook
- `src/hooks/useAuth.jsx`: Authentication React hook

## Environment Configuration

### Local Development
- App runs on `localhost:3000`
- Hot reloading enabled for fast development

### Database Connection
- Local DB: `votaciones_estudiantiles` 
- Automatic index creation for `type` and `type+code` fields
- Data persisted in browser's IndexedDB

## Development Notes

### Current Implementation Status
- ✅ Tutor interface and authentication
- ✅ **Admin interface with full dashboard functionality**
- ✅ **Data transition system (mock ↔ real)**
- ✅ **Bulk import for 600-1000 students**
- ✅ **Automatic backup and rollback system**
- ✅ **🔑 Dynamic activation codes system (COMPLETED)**
  - Auto-generation based on real course data
  - Complete admin management panel
  - Real-time validation and course detection
  - Auto-deletion on new elections
  - CSV export and usage tracking
- 🚧 Student interface (placeholder alerts)
- ✅ Database service and offline support (IndexedDB)
- ✅ Local development setup and PWA configuration

### Testing Structure
Test directories exist but are not yet implemented:
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

### Scripts and Setup
Multiple setup scripts are available in `scripts/` directory for different configuration scenarios. The `docs/README-SETUP.md` provides detailed setup instructions.

## 🔑 ARQUITECTURA DE CÓDIGOS DE ACTIVACIÓN DINÁMICOS

### ⚠️ SISTEMA COMPLETAMENTE REDISEÑADO - VERSIÓN FINAL:

#### Nueva Arquitectura: Códigos Dinámicos Generados por Admin

**El sistema cambió de códigos hardcodeados a generación automática basada en base de datos:**

### 🎯 NUEVA ESTRUCTURA - CÓDIGOS DINÁMICOS:

#### Sistema: Generación automática desde cursos existentes
```javascript
// Flujo de códigos dinámicos:
1. Admin importa estudiantes → Cursos detectados automáticamente
2. Admin genera códigos → Un código por curso existente
3. Tutor usa código → Acceso directo al curso correspondiente

// Ejemplos de códigos generados dinámicamente:
VOTACION-A7X9K → "1ro Bach A" (basado en estudiantes reales)
VOTACION-B8Y2L → "2do Bach B" (basado en estudiantes reales)
VOTACION-C9Z3M → "8vo A" (basado en estudiantes reales)
```

### 🏗️ COMPONENTES DE LA NUEVA ARQUITECTURA:

#### Base de Datos:
- **Nueva tabla**: `activation_codes` en IndexedDB
- **Esquema completo**: código, curso, nivel, timestamps, contadores de uso

#### Servicios:
- **src/services/activationCodes.js** - Servicio completo de gestión
  - Generación automática basada en cursos con estudiantes
  - Validación de códigos en tiempo real
  - Contadores de uso y auditoria
  - Auto-eliminación en nueva elección

#### Componentes:
- **src/components/admin/ActivationCodesManager.jsx** - Panel completo de administración
  - Generación automática de códigos
  - Visualización de cursos disponibles  
  - Exportación a CSV
  - Gestión de ciclo de vida completo

- **src/components/auth/TutorLogin.jsx** - Login simplificado
  - Solo código + nombre (sin selector de curso)
  - Validación en tiempo real
  - Detección automática de curso
  - Feedback visual inmediato

### 💡 FLUJO DE TRABAJO COMPLETO:

#### 1. Administrador:
```bash
1. Panel Admin → Pestaña "Estudiantes" → Importar datos
2. Panel Admin → Pestaña "🔑 Códigos Activación" → "GENERAR CÓDIGOS AUTOMÁTICAMENTE"
3. Sistema detecta todos los cursos con estudiantes
4. Genera código único por curso (formato: VOTACION-XXXXX)
5. Exporta lista de códigos para entregar a tutores
```

#### 2. Tutor:
```bash
1. Recibe código del administrador
2. Login con código + nombre
3. Sistema valida automáticamente
4. Acceso directo al panel con curso cargado
```

### 🛡️ VENTAJAS DEL NUEVO SISTEMA:

- ✅ **Basado en datos reales** - Solo cursos con estudiantes importados
- ✅ **Generación automática** - Sin errores de configuración manual
- ✅ **Validación dinámica** - Códigos siempre sincronizados con BD
- ✅ **Auto-eliminación** - Códigos se limpian automáticamente en nueva elección
- ✅ **Auditoria completa** - Tracking de uso y timestamps
- ✅ **Exportación** - Lista de códigos en CSV para administradores
- ✅ **UX mejorada** - Solo código + nombre, sin selección manual

### 🔍 UBICACIÓN DEL CÓDIGO:

#### Nuevos archivos creados:
- **src/services/activationCodes.js** - Servicio completo (400+ líneas)
- **src/components/admin/ActivationCodesManager.jsx** - Panel admin (290+ líneas)  
- **src/components/admin/ActivationCodesManager.css** - Estilos completos

#### Archivos modificados:
- **src/services/database-indexeddb.js** - Nueva tabla `activation_codes`
- **src/components/auth/TutorLogin.jsx** - Simplificado para códigos dinámicos
- **src/contexts/AuthContext.jsx** - Adaptado para validación dinámica
- **src/components/admin/AdminDashboard.jsx** - Nueva pestaña de códigos + auto-eliminación

### 🗑️ AUTO-ELIMINACIÓN EN NUEVA ELECCIÓN:

El sistema automáticamente elimina todos los códigos de activación cuando el administrador inicia una "Nueva Elección":

```javascript
// En AdminDashboard.jsx - handleNewElection():
1. Elimina códigos automáticamente con activationCodesService.clearAllCodes()
2. Elimina estudiantes, candidatos, votos, sesiones
3. Confirma eliminación con reporte detallado
4. Admin debe generar nuevos códigos para la nueva elección
```