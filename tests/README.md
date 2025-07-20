# Testing Documentation

Este directorio contiene la suite completa de testing para el Sistema de Votación Estudiantil PWA.

## Estructura de Tests

```
tests/
├── unit/                    # Tests unitarios
│   ├── services/           # Tests de servicios
│   │   ├── database.test.js
│   │   └── auth.test.js
│   ├── contexts/           # Tests de contextos React
│   │   └── AuthContext.test.jsx
│   ├── hooks/              # Tests de hooks personalizados
│   │   └── useAuth.test.jsx
│   └── components/         # Tests de componentes
│       ├── auth/           # Componentes de autenticación
│       │   ├── AdminLogin.test.jsx
│       │   ├── TutorLogin.test.jsx
│       │   └── ProtectedRoute.test.jsx
│       ├── common/         # Componentes compartidos
│       │   └── ConnectionStatus.test.jsx
│       └── tutor/          # Componentes del tutor
│           └── StudentCard.test.jsx
├── integration/            # Tests de integración
│   └── auth-flow.test.jsx
└── e2e/                   # Tests end-to-end
    ├── auth.spec.js
    └── tutor-panel.spec.js
```

## Tipos de Tests

### Tests Unitarios (`tests/unit/`)
- **Servicios**: Operaciones de base de datos, lógica de autenticación
- **Contextos**: Proveedores de React Context y gestión de estado
- **Hooks**: Comportamiento de hooks personalizados y efectos secundarios
- **Componentes**: Funcionalidad individual y renderizado de componentes

### Tests de Integración (`tests/integration/`)
- **Flujos de Autenticación**: Workflows completos de autenticación
- **Flujos de Datos**: Interacciones entre contextos y servicios
- **Journeys de Usuario**: Interacciones multi-componente

### Tests End-to-End (`tests/e2e/`)
- **Autenticación**: Flujos de login/logout en todos los roles
- **Panel del Tutor**: Testing completo del workflow del tutor
- **Panel de Admin**: Testing de funcionalidad administrativa
- **Cross-browser**: Chrome, Firefox, Safari, Mobile

## Ejecutar Tests

### Tests Unitarios e Integración (Vitest)
```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests una vez con coverage
npm run test:coverage

# Ejecutar tests unitarios específicos
npm run test:unit

# Ejecutar tests de integración específicos
npm run test:integration

# Ejecutar archivo de test específico
npm test auth.test.js

# Ejecutar tests que coincidan con un patrón
npm test -- --grep "authentication"
```

### Tests End-to-End (Playwright)
```bash
# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests E2E con UI
npm run test:e2e:ui

# Ejecutar tests E2E en modo headed
npm run test:e2e:headed

# Ejecutar navegador específico
npx playwright test --project=chromium

# Ejecutar archivo de test específico
npx playwright test auth.spec.js

# Ejecutar en modo debug
npx playwright test --debug
```

### Ejecutar Todos los Tests
```bash
# Ejecutar tests unitarios, integración y E2E
npm run test:all

# Generar reporte completo
npm run test:report
```

## Configuración de Tests

### Configuración de Vitest (`vitest.config.js`)
- **Environment**: jsdom para testing de componentes React
- **Setup**: Configuración global y mocks
- **Coverage**: Reportes en texto, JSON y HTML
- **Globals**: Funciones de test disponibles globalmente

### Configuración de Playwright (`playwright.config.js`)
- **Navegadores**: Chromium, Firefox, WebKit
- **Mobile**: iOS Safari, Android Chrome
- **Reporting**: Reportes HTML y JSON
- **Screenshots**: En caso de fallo
- **Video**: Retener en caso de fallo

## Utilidades de Test

### `src/test/setup.js`
- Configuración global de tests
- Mocks de PouchDB
- Mocks de LocalStorage
- Mocks de navegación

### `src/test/utils.jsx`
- `renderWithProviders()`: Renderiza componentes con contextos
- Datos mock para usuarios, estudiantes, candidatos
- Funciones helper para tests

## Escribir Tests

### Ejemplo de Test Unitario
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Ejemplo de Test E2E
```javascript
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Admin').click()
  await page.fill('[placeholder="Username"]', 'admin')
  await page.fill('[placeholder="Password"]', 'admin2024')
  await page.click('button[type="submit"]')
  
  await expect(page.getByText('Dashboard')).toBeVisible()
})
```

## Cobertura de Tests

La suite de tests apunta a una cobertura comprehensiva:

- **Tests Unitarios**: 90%+ cobertura de código
- **Tests de Integración**: Flujos críticos de usuario
- **Tests E2E**: Funcionalidad core a través de navegadores

### Reportes de Cobertura
- Generados en directorio `coverage/`
- Reporte HTML en `coverage/index.html`
- Reporte JSON para integración CI/CD

## Integración Continua

Los tests están diseñados para ejecutarse en entornos CI/CD:

### Ejemplo GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm run test:run
    npm run test:e2e
```

### Artefactos de Test
- Resultados de tests: Formato JSON
- Screenshots: Artefactos de fallo
- Videos: Grabaciones de tests E2E
- Reportes de cobertura: HTML/JSON

## Estrategia de Mocking

### Mocks de Servicios
- **PouchDB**: Mocked para datos de test consistentes
- **Auth Service**: Mocked para estados de login controlados
- **LocalStorage**: Mocked para testing de sesiones

### Mocks de Componentes
- **Dependencias externas**: Librerías de charts, generadores PDF
- **APIs del navegador**: File API, Notifications
- **Funciones dependientes del tiempo**: Date.now(), timers

## Mejores Prácticas

### Tests Unitarios
- Testear una cosa a la vez
- Usar nombres de test descriptivos
- Mockear dependencias externas
- Testear casos de éxito y error

### Tests de Integración
- Testear workflows reales de usuario
- Usar mocking mínimo
- Enfocarse en interacciones entre componentes
- Verificar flujo de datos entre capas

### Tests E2E
- Testear journeys críticos de usuario
- Usar patrones page object
- Manejar operaciones async correctamente
- Testear a través de diferentes navegadores/dispositivos

## Debugging Tests

### Tests Unitarios/Integración
```bash
# Debug con Node inspector
node --inspect-brk node_modules/.bin/vitest

# Debug con Chrome DevTools
npm run test:debug
```

### Tests E2E
```bash
# Ejecutar en modo headed
npx playwright test --headed

# Debug con Playwright Inspector
npx playwright test --debug

# Ejecutar con trace
npx playwright test --trace on
```

## Troubleshooting

### Problemas Comunes

1. **Tests fallando por timing**
   - Usar `waitFor()` para operaciones async
   - Aumentar timeouts cuando sea necesario

2. **Mocks no funcionando**
   - Verificar que los mocks están en el setup correcto
   - Limpiar mocks entre tests

3. **Tests E2E flaky**
   - Usar selectores robustos
   - Esperar por elementos antes de interactuar
   - Evitar dependencias de timing

### Comandos de Debug
```bash
# Ver logs detallados
npm test -- --verbose

# Ejecutar test específico
npm test -- --grep "test name"

# Ver coverage detallado
npm run test:coverage -- --reporter=verbose
```

## Mantenimiento

### Actualizar Mocks
- Revisar mocks cuando cambien las APIs
- Mantener mocks sincronizados con implementación real
- Documentar cambios en mocks

### Agregar Nuevos Tests
- Seguir la estructura de directorios existente
- Usar naming conventions consistentes
- Agregar tests para nueva funcionalidad

### Performance
- Ejecutar tests en paralelo cuando sea posible
- Optimizar mocks para velocidad
- Usar test data factories para datos consistentes