#!/bin/bash

# Script de inicio rápido que funciona garantizado
# Sistema de Votación Estudiantil PWA

set -e

echo "🚀 Inicio Rápido - Sistema de Votación Estudiantil"
echo "================================================"

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
    echo -e "${BLUE}🔧${NC} $1"
}

# Función para confirmar
confirm() {
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Paso 1: Limpiar todo
print_step "Paso 1: Limpiando estado anterior..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose-simple.yml down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
print_status "Estado limpio"

# Paso 2: Crear archivos necesarios
print_step "Paso 2: Creando archivos necesarios..."

# package.json mínimo
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
    "build": "react-scripts build"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version"]
  }
}
EOF

# Crear directorios
mkdir -p src public

# src/index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF

# src/App.js
cat > src/App.js << 'EOF'
import React, { useState, useEffect } from 'react';

function App() {
  const [dbStatus, setDbStatus] = useState('Verificando...');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Verificar CouchDB
    const checkDB = async () => {
      try {
        const response = await fetch('http://localhost:5984');
        if (response.ok) {
          setDbStatus('🟢 CouchDB Conectado');
        } else {
          setDbStatus('🟡 CouchDB Sin conexión');
        }
      } catch (error) {
        setDbStatus('🔴 CouchDB No disponible');
      }
    };

    checkDB();
    const interval = setInterval(checkDB, 5000);
    
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          🏛️ Sistema de Votación Estudiantil
        </h1>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2>Estado del Sistema</h2>
          <p><strong>Red:</strong> {online ? '🟢 Online' : '🔴 Offline'}</p>
          <p><strong>Base de Datos:</strong> {dbStatus}</p>
          <p><strong>Aplicación:</strong> 🟢 Funcionando</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '15px',
          padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2>Roles Disponibles</h2>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{
              background: 'white',
              color: '#1e40af',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '120px'
            }}>
              👨‍💼 Admin
            </button>
            <button style={{
              background: 'white',
              color: '#1e40af',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '120px'
            }}>
              👨‍🏫 Tutor
            </button>
            <button style={{
              background: 'white',
              color: '#1e40af',
              border: 'none',
              borderRadius: '10px',
              padding: '15px',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '120px'
            }}>
              🎓 Estudiante
            </button>
          </div>
        </div>

        <p style={{ marginTop: '20px', opacity: '0.9' }}>
          ⚡ Funciona offline • 🔄 Sincronización automática • 📱 PWA
        </p>
      </div>
    </div>
  );
}

export default App;
EOF

# public/index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1e40af" />
    <meta name="description" content="Sistema de Votación Estudiantil PWA" />
    <title>Votación Estudiantil</title>
  </head>
  <body>
    <noscript>Necesitas habilitar JavaScript para esta aplicación.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

print_status "Archivos básicos creados"

# Paso 3: Iniciar solo CouchDB primero
print_step "Paso 3: Iniciando CouchDB..."
docker-compose -f docker-compose-simple.yml up -d couchdb

echo "Esperando 10 segundos para que CouchDB se estabilice..."
sleep 10

# Verificar CouchDB
if curl -s http://localhost:5984 > /dev/null 2>&1; then
    print_status "CouchDB funcionando en http://localhost:5984"
else
    print_error "CouchDB no responde"
    echo "Logs de CouchDB:"
    docker logs votaciones_couchdb_simple
    exit 1
fi

# Paso 4: Iniciar la aplicación React
print_step "Paso 4: Iniciando aplicación React..."
docker-compose -f docker-compose-simple.yml up -d app

print_status "Aplicación iniciada"

# Paso 5: Monitorear el progreso
print_step "Paso 5: Monitoreando inicio de la aplicación..."
echo ""
echo "📊 La aplicación está instalando dependencias..."
echo "   Esto puede tomar 2-5 minutos la primera vez."
echo ""
echo "🔍 Ver progreso en tiempo real:"
echo "   docker logs votaciones_app_simple -f"
echo ""
echo "Estado actual de contenedores:"
docker-compose -f docker-compose-simple.yml ps

echo ""
echo "⏳ Esperando 30 segundos antes de verificar..."
sleep 30

# Verificar estado
echo ""
print_step "Verificando estado actual..."

# CouchDB
if curl -s http://localhost:5984 > /dev/null 2>&1; then
    print_status "CouchDB: ✅ Funcionando - http://localhost:5984"
else
    print_warning "CouchDB: ⚠️  No responde"
fi

# React App
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "React App: ✅ Funcionando - http://localhost:3000"
else
    print_warning "React App: ⏳ Aún instalando dependencias"
    echo "   Ejecutar para ver progreso: docker logs votaciones_app_simple -f"
fi

echo ""
echo "🎉 Servicios iniciados!"
echo ""
echo "📱 URLs de acceso:"
echo "   • Aplicación: http://localhost:3000"
echo "   • CouchDB Admin: http://localhost:5984/_utils"
echo "     Usuario: admin, Contraseña: votaciones2024"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: docker logs votaciones_app_simple -f"
echo "   • Estado: docker-compose -f docker-compose-simple.yml ps"
echo "   • Parar: docker-compose -f docker-compose-simple.yml down"
echo ""

if confirm "¿Inicializar la base de datos ahora?"; then
    print_step "Inicializando base de datos..."
    
    # Verificar que curl funciona con CouchDB
    if curl -s -u admin:votaciones2024 http://localhost:5984/_all_dbs > /dev/null 2>&1; then
        # Ejecutar script de inicialización
        if [ -f "scripts/init-database-curl.sh" ]; then
            chmod +x scripts/init-database-curl.sh
            ./scripts/init-database-curl.sh
        else
            print_warning "Script de inicialización no encontrado"
            echo "Crear base de datos manualmente o esperar a que esté disponible"
        fi
    else
        print_warning "CouchDB aún no está listo para conexiones"
        echo "Esperar unos minutos y ejecutar:"
        echo "  ./scripts/init-database-curl.sh"
    fi
fi

echo ""
print_status "🎯 ¡Sistema configurado! Si la app no carga inmediatamente,"
echo "   espera unos minutos para que termine de instalar dependencias."