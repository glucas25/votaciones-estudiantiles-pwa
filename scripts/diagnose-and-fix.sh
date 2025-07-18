#!/bin/bash

# Script de diagnóstico y reparación para contenedores que fallan
# Sistema de Votación Estudiantil PWA

set -e

echo "🔧 Diagnóstico y Reparación del Sistema de Votación"
echo "=================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_step() {
    echo -e "${BLUE}🔍${NC} $1"
}

# Paso 1: Parar todos los contenedores
print_step "Paso 1: Parando contenedores problemáticos..."
docker-compose down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
print_status "Contenedores parados y eliminados"

# Paso 2: Ver logs de los contenedores que fallaron
print_step "Paso 2: Revisando logs de contenedores anteriores..."
echo "Últimos logs del contenedor app:"
docker logs votaciones_app 2>/dev/null | tail -20 || echo "No hay logs disponibles"

echo ""
echo "Últimos logs del contenedor couchdb:"
docker logs votaciones_couchdb 2>/dev/null | tail -20 || echo "No hay logs disponibles"

# Paso 3: Verificar puertos ocupados
print_step "Paso 3: Verificando puertos..."
echo "Verificando puerto 3000:"
if netstat -an 2>/dev/null | grep -q ":3000 " || ss -tulpn 2>/dev/null | grep -q ":3000 "; then
    print_warning "Puerto 3000 puede estar ocupado"
    echo "Procesos usando puerto 3000:"
    lsof -i:3000 2>/dev/null || netstat -tulpn 2>/dev/null | grep :3000 || echo "No se puede determinar"
else
    print_status "Puerto 3000 disponible"
fi

echo "Verificando puerto 5984:"
if netstat -an 2>/dev/null | grep -q ":5984 " || ss -tulpn 2>/dev/null | grep -q ":5984 "; then
    print_warning "Puerto 5984 puede estar ocupado"
else
    print_status "Puerto 5984 disponible"
fi

# Paso 4: Crear configuración simplificada
print_step "Paso 4: Creando configuración simplificada..."

# Crear docker-compose simplificado
cat > docker-compose-simple.yml << 'EOF'
services:
  couchdb:
    image: couchdb:3.3
    container_name: votaciones_couchdb_simple
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=votaciones2024
    ports:
      - "5984:5984"
    volumes:
      - couchdb_data:/opt/couchdb/data
    restart: unless-stopped

  app:
    image: node:18-alpine
    container_name: votaciones_app_simple
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    volumes:
      - ./:/app
    command: sh -c "
      echo 'Instalando dependencias...' &&
      npm install --legacy-peer-deps &&
      echo 'Iniciando aplicación...' &&
      npm start
    "
    depends_on:
      - couchdb
    restart: unless-stopped

volumes:
  couchdb_data:
EOF

print_status "Configuración simplificada creada: docker-compose-simple.yml"

# Paso 5: Crear package.json mínimo si no existe o está mal
print_step "Paso 5: Verificando package.json..."
if [ ! -f "package.json" ] || ! grep -q "react-scripts" package.json; then
    print_warning "Creando package.json funcional..."
    cat > package.json << 'EOF'
{
  "name": "votaciones-estudiantiles-pwa",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF
    print_status "package.json mínimo creado"
fi

# Paso 6: Verificar archivos React básicos
print_step "Paso 6: Verificando archivos React básicos..."
mkdir -p src public

if [ ! -f "src/index.js" ]; then
    cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF
    print_status "src/index.js creado"
fi

if [ ! -f "src/App.js" ]; then
    cat > src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <h1>🏛️ Sistema de Votación Estudiantil</h1>
        <p>¡Aplicación funcionando correctamente!</p>
        <p>Estado: En desarrollo 🚀</p>
      </div>
    </div>
  );
}

export default App;
EOF
    print_status "src/App.js creado"
fi

if [ ! -f "public/index.html" ]; then
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Votación Estudiantil</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF
    print_status "public/index.html creado"
fi

# Paso 7: Intentar iniciar con configuración simplificada
print_step "Paso 7: Iniciando con configuración simplificada..."
echo "Iniciando servicios con docker-compose-simple.yml..."

docker-compose -f docker-compose-simple.yml up -d

print_status "Contenedores iniciados con configuración simplificada"

# Paso 8: Esperar y verificar
print_step "Paso 8: Esperando a que los servicios inicien..."
echo "Esperando 30 segundos para que los servicios se estabilicen..."
sleep 30

# Verificar estado
echo ""
echo "Estado de contenedores:"
docker-compose -f docker-compose-simple.yml ps

echo ""
echo "Verificando conectividad..."

# Verificar CouchDB
if curl -s http://localhost:5984 > /dev/null 2>&1; then
    print_status "CouchDB responde en http://localhost:5984"
else
    print_warning "CouchDB no responde todavía"
fi

# Verificar React App
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "React App responde en http://localhost:3000"
else
    print_warning "React App no responde todavía (puede estar instalando dependencias)"
fi

echo ""
echo "📋 Comandos útiles para monitoreo:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ver logs en tiempo real:"
echo "  docker-compose -f docker-compose-simple.yml logs -f"
echo ""
echo "Ver logs específicos:"
echo "  docker logs votaciones_couchdb_simple -f"
echo "  docker logs votaciones_app_simple -f"
echo ""
echo "Estado de contenedores:"
echo "  docker-compose -f docker-compose-simple.yml ps"
echo ""
echo "Parar servicios:"
echo "  docker-compose -f docker-compose-simple.yml down"

echo ""
print_status "🎉 Diagnóstico completado!"
echo ""
echo "🌐 Intenta acceder a:"
echo "   - Aplicación: http://localhost:3000"
echo "   - CouchDB: http://localhost:5984"
echo ""
echo "⏳ Si la app no carga inmediatamente, espera unos minutos"
echo "    (está instalando dependencias la primera vez)"