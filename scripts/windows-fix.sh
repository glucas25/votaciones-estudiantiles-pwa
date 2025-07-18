#!/bin/bash

# Solución específica para Windows con Git Bash
# Sistema de Votación Estudiantil PWA

echo "🪟 Solución para Windows - Corrigiendo React Scripts"
echo "===================================================="

# Parar contenedores anteriores
echo "🛑 Limpiando contenedores anteriores..."
docker stop votaciones_app_simple votaciones_app_working 2>/dev/null || true
docker rm votaciones_app_simple votaciones_app_working 2>/dev/null || true

# Crear package.json compatible
echo "📦 Creando package.json compatible..."
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
    "start": "GENERATE_SOURCEMAP=false react-scripts start",
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [">0.2%", "not dead"],
    "development": ["last 1 chrome version"]
  }
}
EOF

# Crear docker-compose específico para Windows
echo "🐳 Creando configuración Docker para Windows..."
cat > docker-compose-windows.yml << 'EOF'
services:
  couchdb:
    image: couchdb:3.3
    container_name: votaciones_couchdb_windows
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=votaciones2024
    ports:
      - "5984:5984"
    volumes:
      - couchdb_data_windows:/opt/couchdb/data
    restart: unless-stopped

  app:
    image: node:18-alpine
    container_name: votaciones_app_windows
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
      - HOST=0.0.0.0
      - GENERATE_SOURCEMAP=false
      - WDS_SOCKET_HOST=localhost
    volumes:
      - .:/app
    command: |
      sh -c "
      echo 'Limpiando instalación anterior...' &&
      rm -rf node_modules package-lock.json yarn.lock &&
      echo 'Instalando dependencias React mínimas...' &&
      npm install --legacy-peer-deps --no-audit --no-fund &&
      echo 'Verificando instalación...' &&
      npm ls react-scripts &&
      echo 'Iniciando React App...' &&
      npm start
      "
    depends_on:
      - couchdb
    restart: "no"
    stdin_open: true
    tty: true

volumes:
  couchdb_data_windows:
EOF

# Parar servicio anterior de CouchDB si existe
echo "🔄 Parando servicios anteriores..."
docker-compose -f docker-compose-simple.yml down 2>/dev/null || true

# Iniciar con nueva configuración
echo "🚀 Iniciando servicios con configuración para Windows..."
docker-compose -f docker-compose-windows.yml up -d

echo ""
echo "✅ Servicios iniciados con configuración para Windows"
echo ""
echo "📊 Comandos para monitorear:"
echo "   docker-compose -f docker-compose-windows.yml logs -f app"
echo "   docker-compose -f docker-compose-windows.yml ps"
echo ""

# Esperar un poco y verificar CouchDB
echo "⏳ Esperando 15 segundos para verificar servicios..."
sleep 15

echo "🔍 Verificando servicios..."

# Verificar CouchDB
if curl -s http://localhost:5984 > /dev/null 2>&1; then
    echo "✅ CouchDB: Funcionando - http://localhost:5984"
else
    echo "⚠️  CouchDB: No responde aún"
fi

# Ver estado de contenedores
echo ""
echo "📋 Estado de contenedores:"
docker-compose -f docker-compose-windows.yml ps

echo ""
echo "📱 Para monitorear la instalación de React:"
echo "   docker logs votaciones_app_windows -f"
echo ""
echo "🌐 URLs cuando esté listo (2-5 minutos):"
echo "   • Aplicación: http://localhost:3000"
echo "   • CouchDB Admin: http://localhost:5984/_utils"
echo "     Usuario: admin, Contraseña: votaciones2024"
echo ""

# Ofrecer monitoreo automático
read -p "¿Ver logs de instalación en tiempo real? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Monitoreando instalación..."
    echo "   (Presiona Ctrl+C para salir del monitoreo)"
    echo ""
    docker logs votaciones_app_windows -f
fi

echo ""
echo "🎯 Una vez que React esté funcionando, inicializar BD:"
echo "   ./scripts/init-database-curl.sh"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Parar servicios: docker-compose -f docker-compose-windows.yml down"
echo "   • Reiniciar: docker-compose -f docker-compose-windows.yml restart"
echo "   • Ver logs: docker-compose -f docker-compose-windows.yml logs -f"