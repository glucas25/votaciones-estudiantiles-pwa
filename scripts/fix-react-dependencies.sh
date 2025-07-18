#!/bin/bash

# Script para corregir el problema de dependencias ajv con React Scripts
# Sistema de Votación Estudiantil PWA

set -e

echo "🔧 Corrigiendo problema de dependencias React Scripts"
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

print_step() {
    echo -e "${BLUE}🔧${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Parar la aplicación
print_step "Parando aplicación React..."
docker-compose -f docker-compose-simple.yml stop app
print_status "Aplicación parada"

# Crear package.json con dependencias compatibles
print_step "Creando package.json con dependencias compatibles..."
cat > package.json << 'EOF'
{
  "name": "votaciones-estudiantiles-pwa",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
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
  },
  "resolutions": {
    "ajv": "^6.12.6",
    "ajv-keywords": "^3.5.2"
  },
  "overrides": {
    "ajv": "^6.12.6",
    "ajv-keywords": "^3.5.2"
  }
}
EOF

print_status "package.json actualizado con resoluciones de dependencias"

# Actualizar el docker-compose para usar --legacy-peer-deps y yarn
print_step "Actualizando configuración Docker..."
cat > docker-compose-fixed.yml << 'EOF'
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
      - couchdb_data_simple:/opt/couchdb/data
    restart: unless-stopped

  app:
    image: node:18-alpine
    container_name: votaciones_app_fixed
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
      - HOST=0.0.0.0
      - GENERATE_SOURCEMAP=false
    volumes:
      - ./:/app
    command: >
      sh -c "
      echo 'Limpiando instalación anterior...' &&
      rm -rf node_modules package-lock.json &&
      echo 'Instalando dependencias con resoluciones...' &&
      npm install --legacy-peer-deps --no-optional --no-audit &&
      echo 'Iniciando aplicación...' &&
      npm start
      "
    depends_on:
      - couchdb
    restart: "no"

volumes:
  couchdb_data_simple:
EOF

print_status "Configuración Docker actualizada"

# Opción alternativa: crear un Dockerfile específico para React
print_step "Creando Dockerfile optimizado para React..."
cat > Dockerfile.react << 'EOF'
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Crear directorio de trabajo
WORKDIR /app

# Configurar npm para evitar problemas
RUN npm config set fund false
RUN npm config set audit false

# Copiar package.json
COPY package.json ./

# Limpiar e instalar dependencias
RUN rm -rf node_modules package-lock.json
RUN npm install --legacy-peer-deps --no-optional

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Variables de entorno para React
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV HOST=0.0.0.0
ENV GENERATE_SOURCEMAP=false

# Comando de inicio
CMD ["npm", "start"]
EOF

# Crear versión con Dockerfile personalizado
cat > docker-compose-dockerfile.yml << 'EOF'
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
      - couchdb_data_simple:/opt/couchdb/data
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile.react
    container_name: votaciones_app_dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    depends_on:
      - couchdb
    restart: unless-stopped

volumes:
  couchdb_data_simple:
EOF

print_status "Dockerfile para React creado"

echo ""
echo "🎯 Opciones disponibles para corregir el problema:"
echo ""
echo "1️⃣  Opción 1 - Configuración con resoluciones (Recomendado):"
echo "   docker-compose -f docker-compose-fixed.yml up --build -d"
echo ""
echo "2️⃣  Opción 2 - Dockerfile personalizado:"
echo "   docker-compose -f docker-compose-dockerfile.yml up --build -d"
echo ""
echo "3️⃣  Opción 3 - Instalar localmente:"
echo "   npm install --legacy-peer-deps"
echo "   npm start"
echo ""

# Función para elegir opción
echo "Selecciona una opción (1, 2, o 3):"
read -p "Opción: " choice

case $choice in
    1)
        print_step "Iniciando con configuración con resoluciones..."
        docker-compose -f docker-compose-fixed.yml up -d
        echo ""
        echo "📊 Monitoreando logs:"
        echo "   docker logs votaciones_app_fixed -f"
        ;;
    2)
        print_step "Construyendo con Dockerfile personalizado..."
        docker-compose -f docker-compose-dockerfile.yml up --build -d
        echo ""
        echo "📊 Monitoreando logs:"
        echo "   docker logs votaciones_app_dockerfile -f"
        ;;
    3)
        print_step "Preparando para instalación local..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        echo ""
        echo "Ejecuta estos comandos:"
        echo "   npm install --legacy-peer-deps"
        echo "   npm start"
        ;;
    *)
        print_warning "Opción no válida. Usando opción 1 por defecto..."
        docker-compose -f docker-compose-fixed.yml up -d
        ;;
esac

echo ""
echo "🔍 Para monitorear el progreso:"
echo "   docker-compose -f docker-compose-fixed.yml logs -f app"
echo ""
echo "🌐 URLs cuando esté listo:"
echo "   • Aplicación: http://localhost:3000"
echo "   • CouchDB: http://localhost:5984"
echo ""
echo "⏳ La primera vez puede tomar 3-5 minutos por la limpieza de dependencias"