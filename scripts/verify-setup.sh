#!/bin/bash

# Script para verificar que todo el sistema esté funcionando
# Sistema de Votación Estudiantil PWA

echo "🔍 Verificando configuración del Sistema de Votación..."
echo "====================================================="

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

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Verificar que Docker Compose esté corriendo
echo "1. Verificando contenedores..."
if docker-compose ps | grep -q "Up"; then
    print_status "Contenedores de Docker están corriendo"
    docker-compose ps
else
    print_error "Los contenedores no están corriendo"
    echo "Ejecutar: docker-compose up -d"
    exit 1
fi

echo ""
echo "2. Verificando conectividad..."

# Verificar que la aplicación responda
echo "Verificando aplicación React (puerto 3000)..."
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Aplicación React accesible en http://localhost:3000"
else
    print_warning "Aplicación React no responde todavía (puede estar iniciando)"
fi

# Verificar que CouchDB responda
echo "Verificando CouchDB (puerto 5984)..."
if curl -s http://localhost:5984 > /dev/null; then
    print_status "CouchDB accesible en http://localhost:5984"
    
    # Verificar credenciales
    if curl -s -u admin:votaciones2024 http://localhost:5984/_all_dbs > /dev/null; then
        print_status "Credenciales de CouchDB funcionando"
    else
        print_warning "Verificar credenciales de CouchDB"
    fi
else
    print_error "CouchDB no está respondiendo"
fi

echo ""
echo "3. Verificando base de datos..."

# Verificar que la base de datos existe
DB_CHECK=$(curl -s -u admin:votaciones2024 http://localhost:5984/votaciones_estudiantiles 2>/dev/null)
if echo "$DB_CHECK" | grep -q "db_name"; then
    print_status "Base de datos 'votaciones_estudiantiles' existe"
    
    # Mostrar información de la BD
    DOC_COUNT=$(echo "$DB_CHECK" | grep -o '"doc_count":[0-9]*' | cut -d':' -f2)
    print_info "Documentos en la base de datos: $DOC_COUNT"
else
    print_warning "Base de datos no inicializada"
    print_info "Ejecutar: docker-compose exec app node scripts/init-database.js"
fi

echo ""
echo "4. Verificando archivos del proyecto..."

# Verificar archivos esenciales
FILES=("src/App.js" "src/index.js" "public/index.html" "public/manifest.json" "public/sw.js")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file existe"
    else
        print_error "$file falta"
    fi
done

echo ""
echo "5. Comandos útiles:"
echo "━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Abrir aplicación:     http://localhost:3000"
echo "💾 Administrar CouchDB:  http://localhost:5984/_utils"
echo "   Usuario: admin"
echo "   Contraseña: votaciones2024"
echo ""
echo "📊 Ver logs en tiempo real:"
echo "   docker-compose logs -f"
echo ""
echo "🔄 Reiniciar servicios:"
echo "   docker-compose restart"
echo ""
echo "🗄️ Inicializar base de datos:"
echo "   docker-compose exec app node scripts/init-database.js"
echo ""
echo "🧹 Limpiar y reiniciar:"
echo "   ./scripts/cleanup.sh && docker-compose up --build -d"

echo ""
if curl -s http://localhost:3000 > /dev/null && curl -s http://localhost:5984 > /dev/null; then
    echo "🎉 ¡Sistema funcionando correctamente!"
    echo "   Puedes acceder a la aplicación en http://localhost:3000"
else
    echo "⚠️  El sistema puede estar iniciando todavía."
    echo "   Espera unos minutos y verifica de nuevo."
fi