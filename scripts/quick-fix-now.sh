#!/bin/bash

# Solución rápida inmediata para el problema de ajv
# Sistema de Votación Estudiantil PWA

echo "⚡ Solución Rápida - Corrigiendo React Scripts"
echo "============================================="

# Parar app actual
echo "🛑 Parando aplicación problemática..."
docker stop votaciones_app_simple 2>/dev/null || true
docker rm votaciones_app_simple 2>/dev/null || true

# Crear package.json con dependencias específicas que funcionan
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

# Iniciar contenedor con nueva configuración
echo "🚀 Iniciando con configuración corregida..."
docker run -d \
  --name votaciones_app_working \
  --network votaciones_network \
  -p 3000:3000 \
  -v "$(pwd):/app" \
  -w /app \
  -e NODE_ENV=development \
  -e CHOKIDAR_USEPOLLING=true \
  -e HOST=0.0.0.0 \
  -e GENERATE_SOURCEMAP=false \
  node:18-alpine \
  sh -c "
    echo 'Limpiando...' &&
    rm -rf node_modules package-lock.json &&
    echo 'Instalando dependencias mínimas...' &&
    npm install --legacy-peer-deps --no-audit --no-fund &&
    echo 'Iniciando React...' &&
    npm start
  "

echo ""
echo "✅ Aplicación iniciada con configuración corregida"
echo ""
echo "📊 Ver progreso:"
echo "   docker logs votaciones_app_working -f"
echo ""
echo "🌐 URLs:"
echo "   • App: http://localhost:3000 (esperar 2-3 minutos)"
echo "   • CouchDB: http://localhost:5984"
echo ""

# Monitorear automáticamente por 30 segundos
echo "⏳ Monitoreando inicio por 30 segundos..."
timeout 30 docker logs votaciones_app_working -f 2>/dev/null || true

echo ""
echo "🎯 Comandos útiles:"
echo "   • Ver logs: docker logs votaciones_app_working -f"
echo "   • Estado: docker ps | grep votaciones"
echo "   • Parar: docker stop votaciones_app_working"
echo ""
echo "Si funciona, inicializar BD con:"
echo "   ./scripts/init-database-curl.sh"