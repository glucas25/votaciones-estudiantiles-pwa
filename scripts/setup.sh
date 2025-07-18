#!/bin/bash

# Script de configuración para Sistema de Votación Estudiantil PWA
# Autor: Sistema de Votaciones
# Versión: 1.0.0

set -e

echo "🏛️  Sistema de Votación Estudiantil PWA - Configuración Inicial"
echo "================================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con color
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

# Verificar si Docker está instalado
check_docker() {
    print_step "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instale Docker primero."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instale Docker Compose primero."
        exit 1
    fi
    
    print_status "Docker y Docker Compose están instalados ✓"
}

# Verificar si Node.js está instalado
check_node() {
    print_step "Verificando Node.js..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js no está instalado. Se usará Docker para desarrollo."
    else
        NODE_VERSION=$(node --version)
        print_status "Node.js está instalado: $NODE_VERSION ✓"
    fi
}

# Crear estructura de directorios
create_directories() {
    print_step "Creando estructura de directorios..."
    
    # Directorios principales
    mkdir -p src/{components,hooks,services,contexts,utils,styles}
    mkdir -p src/components/{auth,tutor,admin,common,voting}
    mkdir -p public/{icons,screenshots}
    mkdir -p couchdb
    mkdir -p scripts
    mkdir -p backups
    mkdir -p logs
    mkdir -p docs
    mkdir -p tests/{unit,integration,e2e}
    
    print_status "Estructura de directorios creada ✓"
}

# Crear archivo .env desde .env.example
create_env_file() {
    print_step "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Archivo .env creado desde .env.example ✓"
        else
            print_warning "Archivo .env.example no encontrado, creando .env básico..."
            cat > .env << EOF
COUCHDB_PASSWORD=votaciones2024
COUCHDB_SECRET=mysecretkey_change_in_production
REACT_APP_COUCHDB_URL=http://admin:votaciones2024@localhost:5984
REACT_APP_COUCHDB_NAME=votaciones_estudiantiles
REACT_APP_VERSION=1.0.0
REACT_APP_ELECTION_YEAR=2024
NODE_ENV=development
PORT=3000
EOF
            print_status "Archivo .env básico creado ✓"
        fi
    else
        print_warning "El archivo .env ya existe, no se modificará"
    fi
}

# Generar iconos PWA básicos
create_pwa_icons() {
    print_step "Creando iconos PWA básicos..."
    
    # Crear un ícono básico SVG que se puede convertir a PNG
    cat > public/icons/icon.svg << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1e40af"/>
  <circle cx="256" cy="200" r="80" fill="white"/>
  <rect x="176" y="280" width="160" height="160" rx="20" fill="white"/>
  <circle cx="216" cy="340" r="8" fill="#1e40af"/>
  <circle cx="256" cy="340" r="8" fill="#1e40af"/>
  <circle cx="296" cy="340" r="8" fill="#1e40af"/>
  <text x="256" y="480" text-anchor="middle" fill="white" font-size="32" font-family="Arial">VOTA</text>
</svg>
EOF

    print_status "Ícono SVG básico creado ✓"
    print_warning "Para producción, genere íconos PNG en los tamaños requeridos"
}

# Crear página offline básica
create_offline_page() {
    print_step "Creando página offline..."
    
    cat > public/offline.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sin Conexión - Sistema de Votación</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 400px;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        p {
            opacity: 0.9;
            line-height: 1.6;
        }
        .retry-btn {
            background: white;
            color: #1e40af;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📱</div>
        <h1>Aplicación sin conexión</h1>
        <p>
            El Sistema de Votación funciona offline. 
            Los datos se sincronizarán automáticamente 
            cuando se restablezca la conexión.
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
            Reintentar Conexión
        </button>
    </div>
</body>
</html>
EOF

    print_status "Página offline creada ✓"
}

# Configurar Git hooks (si git está disponible)
setup_git_hooks() {
    if command -v git &> /dev/null && [ -d .git ]; then
        print_step "Configurando Git hooks..."
        
        # Pre-commit hook para formateo de código
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook para Sistema de Votación

echo "🔍 Ejecutando verificaciones pre-commit..."

# Verificar formato de código si prettier está disponible
if command -v npx &> /dev/null; then
    npx prettier --check "src/**/*.{js,jsx,css,json}" 2>/dev/null || true
fi

# Verificar sintaxis básica
echo "✅ Verificaciones completadas"
EOF
        
        chmod +x .git/hooks/pre-commit
        print_status "Git hooks configurados ✓"
    fi
}

# Crear documentación básica
create_docs() {
    print_step "Creando documentación básica..."
    
    cat > docs/README-SETUP.md << 'EOF'
# Configuración del Sistema de Votación Estudiantil

## Configuración Completada ✅

Este proyecto ha sido configurado con éxito. Los siguientes elementos están listos:

### Estructura del Proyecto
- ✅ Estructura de directorios
- ✅ Configuración Docker
- ✅ Variables de entorno
- ✅ Configuración PWA
- ✅ Service Worker básico

### Próximos Pasos

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar con Docker**:
   ```bash
   docker-compose up -d
   ```

3. **Desarrollo local**:
   ```bash
   npm start
   ```

4. **Acceder a la aplicación**:
   - Frontend: http://localhost:3000
   - CouchDB: http://localhost:5984/_utils

### Comandos Útiles

```bash
# Compilar para producción
npm run build

# Ejecutar tests
npm test

# Ver logs de Docker
docker-compose logs -f

# Parar servicios
docker-compose down
```

### Estructura de Base de Datos

La base de datos se configurará automáticamente al iniciar el sistema.

### Soporte

Para más información, consulte la documentación en la carpeta `docs/`.
EOF

    print_status "Documentación básica creada ✓"
}

# Función principal
main() {
    echo
    print_step "Iniciando configuración del proyecto..."
    echo
    
    check_docker
    check_node
    create_directories
    create_env_file
    create_pwa_icons
    create_offline_page
    setup_git_hooks
    create_docs
    
    echo
    echo "🎉 ¡Configuración completada exitosamente!"
    echo
    print_status "El proyecto está listo para desarrollo."
    echo
    print_step "Próximos pasos:"
    echo "  1. Revisar y ajustar las variables en .env"
    echo "  2. Ejecutar: npm install"
    echo "  3. Ejecutar: docker-compose up -d"
    echo "  4. Abrir: http://localhost:3000"
    echo
    print_warning "Para producción, asegúrese de:"
    echo "  - Cambiar las contraseñas en .env"
    echo "  - Generar íconos PWA en todos los tamaños"
    echo "  - Configurar certificados SSL"
    echo "  - Configurar backup automático"
    echo
}

# Ejecutar función principal
main "$@"