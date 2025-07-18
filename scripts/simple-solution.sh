#!/bin/bash

# Solución súper simple que funciona en Windows
# Sistema de Votación Estudiantil PWA

echo "🎯 Solución Súper Simple para Windows"
echo "===================================="

# Limpiar
echo "🧹 Limpiando estado anterior..."
docker stop $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true

# Crear la configuración más simple posible
echo "📝 Creando configuración mínima..."

# package.json ultra simple
cat > package.json << 'EOF'
{
  "name": "votaciones-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start"
  },
  "browserslist": {
    "development": ["last 1 chrome version"]
  }
}
EOF

# Crear src/App.js ultra simple
mkdir -p src
cat > src/App.js << 'EOF'
function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial',
      textAlign: 'center'
    }}>
      <div>
        <h1>🏛️ Sistema de Votación Estudiantil</h1>
        <p>✅ Aplicación funcionando correctamente!</p>
        <div style={{marginTop: '20px'}}>
          <button style={{margin: '10px', padding: '15px 25px', fontSize: '16px', borderRadius: '8px', border: 'none', background: 'white', color: '#1e40af', cursor: 'pointer'}}>
            👨‍💼 Administrador
          </button>
          <button style={{margin: '10px', padding: '15px 25px', fontSize: '16px', borderRadius: '8px', border: 'none', background: 'white', color: '#1e40af', cursor: 'pointer'}}>
            👨‍🏫 Tutor
          </button>
          <button style={{margin: '10px', padding: '15px 25px', fontSize: '16px', borderRadius: '8px', border: 'none', background: 'white', color: '#1e40af', cursor: 'pointer'}}>
            🎓 Estudiante
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
EOF

# Crear src/index.js ultra simple
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF

# Crear public/index.html ultra simple
mkdir -p public
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
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

# Docker Compose ultra simple
cat > docker-compose-ultra-simple.yml << 'EOF'
services:
  couchdb:
    image: couchdb:3.3
    container_name: couch_simple
    environment:
      COUCHDB_USER: admin
      COUCHDB_PASSWORD: votaciones2024
    ports:
      - "5984:5984"
    volumes:
      - couch_data:/opt/couchdb/data

  react:
    image: node:18-alpine
    container_name: react_simple
    working_dir: /workspace
    ports:
      - "3000:3000"
    environment:
      HOST: 0.0.0.0
      GENERATE_SOURCEMAP: false
      CHOKIDAR_USEPOLLING: true
    volumes:
      - .:/workspace
    command: sh -c "npm install --legacy-peer-deps && npm start"

volumes:
  couch_data:
EOF

echo "✅ Archivos creados"

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose-ultra-simple.yml up -d

echo ""
echo "✅ Servicios iniciados!"
echo ""
echo "📊 Ver progreso de instalación:"
echo "   docker logs react_simple -f"
echo ""
echo "🌐 URLs (disponibles en 2-3 minutos):"
echo "   • React App: http://localhost:3000"
echo "   • CouchDB: http://localhost:5984"
echo ""
echo "📋 Estado actual:"
docker-compose -f docker-compose-ultra-simple.yml ps

echo ""
echo "⏳ Monitoreando por 1 minuto..."
timeout 60 docker logs react_simple -f 2>/dev/null || true

echo ""
echo "🎯 Para continuar:"
echo "   • Ver logs: docker logs react_simple -f"
echo "   • Verificar: curl http://localhost:3000"
echo "   • Inicializar BD: ./scripts/init-database-curl.sh"
echo "   • Parar: docker-compose -f docker-compose-ultra-simple.yml down"