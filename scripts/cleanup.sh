#!/bin/bash

# Script de limpieza para Sistema de Votación Estudiantil PWA
# Resuelve problemas de Docker y reinicia limpio

set -e

echo "🧹 Sistema de Votación Estudiantil - Limpieza y Reinicio"
echo "======================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Función para confirmar acción
confirm() {
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operación cancelada."
        exit 1
    fi
}

print_step "1. Parando contenedores existentes..."
docker-compose down --remove-orphans 2>/dev/null || true
print_status "Contenedores parados ✓"

print_step "2. Eliminando contenedores del proyecto..."
docker container ls -a --filter "name=votaciones" --format "table {{.Names}}" | grep -v NAMES | xargs -r docker container rm -f 2>/dev/null || true
print_status "Contenedores eliminados ✓"

print_step "3. Eliminando imágenes del proyecto..."
docker images --filter "reference=votaciones*" -q | xargs -r docker rmi -f 2>/dev/null || true
print_status "Imágenes eliminadas ✓"

print_step "4. Limpiando caché de Docker build..."
docker builder prune -f 2>/dev/null || true
print_status "Caché de build limpiado ✓"

print_step "5. Verificando archivo package.json..."
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
    "react-icons": "^4.7.1"
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
    print_status "package.json básico creado ✓"
else
    print_status "package.json encontrado ✓"
fi

print_step "6. Creando estructura básica de directorios..."
mkdir -p src/components/{auth,tutor,admin,common,voting}
mkdir -p src/{hooks,services,contexts,utils,styles}
mkdir -p public/icons
mkdir -p couchdb

# Crear App.js básico si no existe
if [ ! -f "src/App.js" ]; then
    print_step "7. Creando App.js básico..."
    cat > src/App.js << 'EOF'
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🏛️ Sistema de Votación Estudiantil</h1>
        <p>Progressive Web App - Offline First</p>
        <p>Estado: En Desarrollo</p>
        <div style={{marginTop: '20px'}}>
          <button style={{margin: '5px', padding: '10px 20px'}}>
            👨‍💼 Administrador
          </button>
          <button style={{margin: '5px', padding: '10px 20px'}}>
            👨‍🏫 Tutor
          </button>
          <button style={{margin: '5px', padding: '10px 20px'}}>
            🎓 Estudiante
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
EOF
    print_status "App.js básico creado ✓"
fi

# Crear index.js básico si no existe
if [ ! -f "src/index.js" ]; then
    cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
    print_status "index.js básico creado ✓"
fi

# Crear CSS básico si no existe
if [ ! -f "src/App.css" ]; then
    cat > src/App.css << 'EOF'
.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
}

.App-header {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

button {
  background: white;
  color: #1e40af;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
EOF
    print_status "App.css básico creado ✓"
fi

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
EOF
    print_status "index.css básico creado ✓"
fi

# Crear index.html básico si no existe
if [ ! -f "public/index.html" ]; then
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1e40af" />
    <meta name="description" content="Sistema de Votación Estudiantil PWA" />
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
    print_status "index.html básico creado ✓"
fi

print_step "8. Verificando configuración de Docker..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Archivo .env creado desde .env.example ✓"
    else
        cat > .env << 'EOF'
COUCHDB_PASSWORD=votaciones2024
COUCHDB_SECRET=mysecretkey
REACT_APP_COUCHDB_URL=http://admin:votaciones2024@localhost:5984
REACT_APP_COUCHDB_NAME=votaciones_estudiantiles
REACT_APP_VERSION=1.0.0
REACT_APP_ELECTION_YEAR=2024
NODE_ENV=development
EOF
        print_status "Archivo .env básico creado ✓"
    fi
fi

print_step "9. Probando configuración de Docker Compose..."
docker-compose config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Configuración de Docker Compose válida ✓"
else
    print_error "Error en configuración de Docker Compose"
    exit 1
fi

echo ""
print_status "🎉 Limpieza completada exitosamente!"
echo ""
print_step "Próximos pasos:"
echo "  1. docker-compose up --build -d"
echo "  2. Esperar a que los servicios inicien"
echo "  3. Abrir http://localhost:3000"
echo ""
print_warning "Si persisten los errores:"
echo "  - Verificar que Docker tenga suficiente memoria (4GB+)"
echo "  - Verificar que los puertos 3000 y 5984 estén libres"
echo "  - Ejecutar: docker system prune -a (elimina todo el caché)"
echo ""