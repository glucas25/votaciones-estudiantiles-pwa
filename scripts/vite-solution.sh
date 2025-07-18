#!/bin/bash

# Solución definitiva usando Vite en lugar de React Scripts
# Sistema de Votación Estudiantil PWA

echo "⚡ Solución Definitiva con Vite - Sin problemas de dependencias"
echo "============================================================="

# Limpiar todo
echo "🧹 Limpiando contenedores anteriores..."
docker stop $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=couch") 2>/dev/null || true
docker stop $(docker ps -aq --filter "name=react") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=votaciones") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=couch") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=react") 2>/dev/null || true

# Crear package.json con Vite (no React Scripts)
echo "📦 Creando configuración con Vite..."
cat > package.json << 'EOF'
{
  "name": "votaciones-estudiantiles-pwa",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.0"
  }
}
EOF

# Crear configuración de Vite
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})
EOF

# Crear estructura de archivos para Vite
mkdir -p src public

# index.html para Vite (en raíz del proyecto)
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1e40af" />
    <title>Sistema de Votación Estudiantil</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# src/main.jsx (punto de entrada para Vite)
cat > src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# src/App.jsx
cat > src/App.jsx << 'EOF'
import React, { useState, useEffect } from 'react'

function App() {
  const [dbStatus, setDbStatus] = useState('Verificando...')
  const [online, setOnline] = useState(navigator.onLine)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    // Verificar CouchDB cada 5 segundos
    const checkDB = async () => {
      try {
        const response = await fetch('http://localhost:5984')
        if (response.ok) {
          setDbStatus('🟢 CouchDB Conectado')
        } else {
          setDbStatus('🟡 CouchDB Sin respuesta')
        }
      } catch (error) {
        setDbStatus('🔴 CouchDB No disponible')
      }
    }

    // Actualizar tiempo cada segundo
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }

    checkDB()
    const dbInterval = setInterval(checkDB, 5000)
    const timeInterval = setInterval(updateTime, 1000)
    
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(dbInterval)
      clearInterval(timeInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const styles = {
    app: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center',
      padding: '20px'
    },
    container: {
      maxWidth: '800px',
      width: '100%'
    },
    title: {
      fontSize: '3rem',
      marginBottom: '10px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
    },
    subtitle: {
      fontSize: '1.2rem',
      marginBottom: '30px',
      opacity: '0.9'
    },
    statusPanel: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      padding: '25px',
      marginBottom: '30px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    statusRow: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '10px 0',
      fontSize: '1.1rem'
    },
    rolesPanel: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      padding: '25px',
      marginBottom: '20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    rolesTitle: {
      fontSize: '1.5rem',
      marginBottom: '20px'
    },
    buttonContainer: {
      display: 'flex',
      gap: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },
    button: {
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#1e40af',
      border: 'none',
      borderRadius: '15px',
      padding: '20px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      minWidth: '140px',
      minHeight: '80px',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    },
    features: {
      fontSize: '1rem',
      opacity: '0.9',
      lineHeight: '1.6'
    }
  }

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <h1 style={styles.title}>🏛️ Sistema de Votación Estudiantil</h1>
        <p style={styles.subtitle}>Progressive Web App - Powered by Vite ⚡</p>
        
        <div style={styles.statusPanel}>
          <h2>📊 Estado del Sistema</h2>
          <div style={styles.statusRow}>
            <span><strong>🌐 Conexión:</strong></span>
            <span>{online ? '🟢 Online' : '🔴 Offline'}</span>
          </div>
          <div style={styles.statusRow}>
            <span><strong>💾 Base de Datos:</strong></span>
            <span>{dbStatus}</span>
          </div>
          <div style={styles.statusRow}>
            <span><strong>⚡ Aplicación:</strong></span>
            <span>🟢 Vite Funcionando</span>
          </div>
          <div style={styles.statusRow}>
            <span><strong>🕒 Hora:</strong></span>
            <span>{currentTime}</span>
          </div>
        </div>

        <div style={styles.rolesPanel}>
          <h2 style={styles.rolesTitle}>👤 Seleccionar Rol</h2>
          <div style={styles.buttonContainer}>
            <button 
              style={styles.button}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={{fontSize: '2rem'}}>👨‍💼</span>
              <span>Administrador</span>
            </button>
            <button 
              style={styles.button}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={{fontSize: '2rem'}}>👨‍🏫</span>
              <span>Tutor</span>
            </button>
            <button 
              style={styles.button}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <span style={{fontSize: '2rem'}}>🎓</span>
              <span>Estudiante</span>
            </button>
          </div>
        </div>

        <div style={styles.features}>
          <p>
            ⚡ Build súper rápido con Vite<br />
            🔄 Hot Module Replacement<br />
            📱 Instalable como PWA<br />
            🔌 Funciona sin internet
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
EOF

# Docker Compose con Vite
cat > docker-compose-vite.yml << 'EOF'
services:
  couchdb:
    image: couchdb:3.3
    container_name: couchdb_vite
    environment:
      COUCHDB_USER: admin
      COUCHDB_PASSWORD: votaciones2024
    ports:
      - "5984:5984"
    volumes:
      - couchdb_vite_data:/opt/couchdb/data
    restart: unless-stopped

  vite:
    image: node:18-alpine
    container_name: vite_app
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
    volumes:
      - .:/app
    command: sh -c "npm install && npm run dev"
    depends_on:
      - couchdb
    restart: unless-stopped

volumes:
  couchdb_vite_data:
EOF

echo "✅ Configuración con Vite creada"

# Iniciar servicios
echo "🚀 Iniciando servicios con Vite..."
docker-compose -f docker-compose-vite.yml up -d

echo ""
echo "🎉 ¡Servicios iniciados con Vite!"
echo ""
echo "⚡ Vite es mucho más rápido que React Scripts y no tiene problemas de dependencias"
echo ""
echo "📊 Ver progreso:"
echo "   docker logs vite_app -f"
echo ""
echo "🌐 URLs (disponibles en 30-60 segundos):"
echo "   • Aplicación: http://localhost:3000"
echo "   • CouchDB: http://localhost:5984/_utils (admin/votaciones2024)"
echo ""
echo "📋 Estado actual:"
docker-compose -f docker-compose-vite.yml ps

echo ""
echo "⏳ Monitoreando instalación por 1 minuto..."
timeout 60 docker logs vite_app -f 2>/dev/null || true

echo ""
echo "🎯 Próximos pasos:"
echo "   • Verificar app: curl http://localhost:3000"
echo "   • Inicializar BD: ./scripts/init-database-curl.sh"
echo "   • Ver logs: docker logs vite_app -f"
echo "   • Parar: docker-compose -f docker-compose-vite.yml down"
echo ""
echo "✨ Vite debería arrancar sin problemas de dependencias!"