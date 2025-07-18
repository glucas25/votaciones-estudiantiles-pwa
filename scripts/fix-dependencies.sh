#!/bin/bash

# Script para resolver problemas de dependencias
# Sistema de Votación Estudiantil PWA

set -e

echo "🔧 Resolviendo problemas de dependencias..."
echo "==========================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Paso 1: Generar package-lock.json si no existe
if [ ! -f "package-lock.json" ]; then
    print_step "1. Generando package-lock.json..."
    
    # Asegurar que existe package.json
    if [ ! -f "package.json" ]; then
        print_warning "package.json no encontrado, creando uno básico..."
        cat > package.json << 'EOF'
{
  "name": "votaciones-estudiantiles-pwa",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.8.1",
    "pouchdb": "^8.0.1",
    "pouchdb-find": "^8.0.1",
    "pouchdb-adapter-idb": "^8.0.1",
    "pouchdb-adapter-http": "^8.0.1",
    "pouchdb-replication": "^8.0.1",
    "react-icons": "^4.7.1",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.5.28",
    "xlsx": "^0.18.5",
    "papaparse": "^5.3.2",
    "date-fns": "^2.29.3",
    "uuid": "^9.0.0",
    "lodash": "^4.17.21",
    "recharts": "^2.5.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
    fi
    
    # Generar package-lock.json
    npm install --package-lock-only --legacy-peer-deps
    print_status "package-lock.json generado ✓"
else
    print_status "package-lock.json ya existe ✓"
fi

# Paso 2: Limpiar node_modules si existe
if [ -d "node_modules" ]; then
    print_step "2. Limpiando node_modules existente..."
    rm -rf node_modules
    print_status "node_modules eliminado ✓"
fi

# Paso 3: Instalar dependencias limpias
print_step "3. Instalando dependencias..."
npm install --legacy-peer-deps
print_status "Dependencias instaladas ✓"

# Paso 4: Verificar que React Scripts funciona
print_step "4. Verificando React Scripts..."
if npx react-scripts --version > /dev/null 2>&1; then
    print_status "React Scripts funcionando ✓"
else
    print_warning "Problema con React Scripts, reinstalando..."
    npm install react-scripts@5.0.1 --legacy-peer-deps
fi

# Paso 5: Crear archivos básicos si no existen
print_step "5. Verificando archivos básicos de React..."

# Crear src/index.js
mkdir -p src
if [ ! -f "src/index.js" ]; then
    cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registro falló: ', registrationError);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
    print_status "src/index.js creado ✓"
fi

# Crear src/App.js
if [ ! -f "src/App.js" ]; then
    cat > src/App.js << 'EOF'
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStatus, setDbStatus] = useState('Verificando...');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar conexión con CouchDB
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/db/_all_dbs');
        if (response.ok) {
          setDbStatus('Conectada ✅');
        } else {
          setDbStatus('Sin conexión ⚠️');
        }
      } catch (error) {
        setDbStatus('Sin conexión ⚠️');
      }
    };

    checkDatabase();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo">
          <h1>🏛️ Sistema de Votación Estudiantil</h1>
          <p>Progressive Web App - Offline First</p>
        </div>
        
        <div className="status-panel">
          <div className="status-item">
            <span>Estado de Red:</span>
            <span className={isOnline ? 'online' : 'offline'}>
              {isOnline ? '🟢 Conectado' : '🔴 Offline'}
            </span>
          </div>
          <div className="status-item">
            <span>Base de Datos:</span>
            <span>{dbStatus}</span>
          </div>
        </div>

        <div className="roles-panel">
          <h2>Seleccionar Rol</h2>
          <div className="role-buttons">
            <button className="role-btn admin">
              👨‍💼<br />
              <span>Administrador</span>
            </button>
            <button className="role-btn tutor">
              👨‍🏫<br />
              <span>Tutor</span>
            </button>
            <button className="role-btn student">
              🎓<br />
              <span>Estudiante</span>
            </button>
          </div>
        </div>

        <div className="info-panel">
          <p>
            ⚡ Funciona sin internet<br />
            🔄 Sincronización automática<br />
            📱 Instalable como app
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;
EOF
    print_status "src/App.js creado ✓"
fi

# Crear src/App.css
if [ ! -f "src/App.css" ]; then
    cat > src/App.css << 'EOF'
.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.App-header {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.logo h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
}

.logo p {
  margin: 0 0 30px 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.status-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  min-width: 300px;
  backdrop-filter: blur(10px);
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 1rem;
}

.online { color: #10b981; }
.offline { color: #ef4444; }

.roles-panel {
  margin: 30px 0;
}

.roles-panel h2 {
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.role-buttons {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.role-btn {
  background: rgba(255, 255, 255, 0.95);
  color: #1e40af;
  border: none;
  border-radius: 16px;
  padding: 20px;
  min-width: 120px;
  min-height: 120px;
  cursor: pointer;
  font-weight: bold;
  font-size: 2rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.role-btn span {
  font-size: 0.9rem;
  font-weight: 600;
}

.role-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  background: white;
}

.admin:hover { background: linear-gradient(135deg, #fef3c7, #fbbf24); }
.tutor:hover { background: linear-gradient(135deg, #dbeafe, #60a5fa); }
.student:hover { background: linear-gradient(135deg, #dcfce7, #4ade80); }

.info-panel {
  margin-top: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.info-panel p {
  margin: 0;
  line-height: 1.8;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .App-header {
    padding: 10px;
  }
  
  .role-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .role-btn {
    width: 200px;
  }
  
  .status-panel {
    min-width: auto;
    width: 100%;
    max-width: 300px;
  }
}
EOF
    print_status "src/App.css creado ✓"
fi

# Crear src/index.css
if [ ! -f "src/index.css" ]; then
    cat > src/index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF
    print_status "src/index.css creado ✓"
fi

# Crear public/index.html
mkdir -p public
if [ ! -f "public/index.html" ]; then
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1e40af" />
    <meta
      name="description"
      content="Sistema de Votación Estudiantil PWA - Offline First"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Votación Estudiantil</title>
  </head>
  <body>
    <noscript>Necesitas habilitar JavaScript para ejecutar esta aplicación.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF
    print_status "public/index.html creado ✓"
fi

print_step "6. Actualizando Dockerfile para usar package-lock.json..."

# Actualizar Dockerfile para usar npm ci si existe package-lock.json
cat > Dockerfile << 'EOF'
# Imagen base para desarrollo
FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache git curl netcat-openbsd

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar propietario del directorio
RUN chown -R nextjs:nodejs /app
USER nextjs

# Copiar archivos de configuración de package manager
COPY --chown=nextjs:nodejs package*.json ./

# Instalar dependencias usando el método apropiado
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# Copiar el resto del código fuente
COPY --chown=nextjs:nodejs . .

# Exponer el puerto de desarrollo
EXPOSE 3000

# Variables de entorno para desarrollo
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Comando de inicio para desarrollo
CMD ["npm", "start"]
EOF

print_status "Dockerfile actualizado ✓"

echo ""
print_status "🎉 ¡Dependencias resueltas exitosamente!"
echo ""
print_step "Ahora puedes ejecutar:"
echo "  docker-compose up --build -d"
echo ""
print_status "El build de Docker debería funcionar correctamente ahora ✓"