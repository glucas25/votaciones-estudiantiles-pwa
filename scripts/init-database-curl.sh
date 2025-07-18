#!/bin/bash

# Script de inicialización de base de datos usando curl
# No requiere dependencias de Node.js

set -e

echo "🗄️ Inicialización de Base de Datos con curl"
echo "==========================================="

# Configuración
COUCHDB_URL="http://localhost:5984"
COUCHDB_USER="admin"
COUCHDB_PASS="votaciones2024"
DB_NAME="votaciones_estudiantiles"
AUTH="$COUCHDB_USER:$COUCHDB_PASS"

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

# Función para hacer peticiones a CouchDB
couchdb_request() {
    local method="$1"
    local path="$2"
    local data="$3"
    local url="$COUCHDB_URL$path"
    
    if [ -n "$data" ]; then
        curl -s -u "$AUTH" -X "$method" -H "Content-Type: application/json" -d "$data" "$url"
    else
        curl -s -u "$AUTH" -X "$method" "$url"
    fi
}

# Paso 1: Verificar conexión con CouchDB
print_step "Verificando conexión con CouchDB..."
if ! curl -s "$COUCHDB_URL" > /dev/null 2>&1; then
    print_error "No se puede conectar con CouchDB en $COUCHDB_URL"
    echo "Asegúrate de que CouchDB esté corriendo:"
    echo "  docker-compose -f docker-compose-simple.yml up -d couchdb"
    exit 1
fi

# Verificar credenciales
if ! curl -s -u "$AUTH" "$COUCHDB_URL/_all_dbs" > /dev/null 2>&1; then
    print_error "Credenciales incorrectas para CouchDB"
    echo "Usuario: $COUCHDB_USER"
    echo "Verificar contraseña en docker-compose"
    exit 1
fi

print_status "Conectado a CouchDB exitosamente"

# Paso 2: Crear base de datos
print_step "Creando base de datos '$DB_NAME'..."
response=$(couchdb_request "PUT" "/$DB_NAME" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok" || echo "$response" | grep -q "exists"; then
    print_status "Base de datos '$DB_NAME' lista"
else
    print_warning "Base de datos ya existe o hubo un problema"
fi

# Paso 3: Crear documentos de configuración
print_step "Creando configuración del sistema..."

# Configuración general
config_doc='{
  "_id": "config_system",
  "type": "system_config",
  "version": "1.0.0",
  "electionYear": 2024,
  "institutionName": "Institución Educativa",
  "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "settings": {
    "maxStudentsPerCourse": 50,
    "maxCandidatesPerPosition": 10,
    "activationCodeExpiryHours": 12
  }
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$config_doc" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Configuración del sistema creada"
else
    print_warning "Configuración del sistema ya existe"
fi

# Niveles educativos
levels_doc='{
  "_id": "config_levels",
  "type": "education_levels",
  "year": 2024,
  "levels": [
    {
      "code": "BASICA_ELEMENTAL",
      "name": "Básica Elemental",
      "grades": ["1ro", "2do", "3ro", "4to"]
    },
    {
      "code": "BASICA_MEDIA",
      "name": "Básica Media", 
      "grades": ["5to", "6to", "7mo"]
    },
    {
      "code": "BASICA_SUPERIOR",
      "name": "Básica Superior",
      "grades": ["8vo", "9no", "10mo"]
    },
    {
      "code": "BACHILLERATO",
      "name": "Bachillerato",
      "grades": ["1ro Bach", "2do Bach", "3ro Bach"]
    }
  ]
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$levels_doc" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Niveles educativos creados"
else
    print_warning "Niveles educativos ya existen"
fi

# Paso 4: Crear códigos de activación
print_step "Creando códigos de activación..."

# Código para Bachillerato
tomorrow=$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+1d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
next_week=$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)

activation_bach='{
  "_id": "activation_2024_BACHILLERATO",
  "type": "activation_code",
  "code": "ELEC2024-BACH",
  "level": "BACHILLERATO",
  "courses": ["1ro Bach A", "1ro Bach B", "2do Bach A", "2do Bach B", "3ro Bach A"],
  "validFrom": "'$tomorrow'",
  "validUntil": "'$next_week'",
  "active": true,
  "year": 2024
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$activation_bach" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Código ELEC2024-BACH creado"
else
    print_warning "Código ELEC2024-BACH ya existe"
fi

# Código para Básica Superior
activation_basica='{
  "_id": "activation_2024_BASICA_SUP",
  "type": "activation_code", 
  "code": "ELEC2024-BASICA-SUP",
  "level": "BASICA_SUPERIOR",
  "courses": ["8vo A", "8vo B", "9no A", "9no B", "10mo A", "10mo B"],
  "validFrom": "'$tomorrow'",
  "validUntil": "'$next_week'",
  "active": true,
  "year": 2024
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$activation_basica" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Código ELEC2024-BASICA-SUP creado"
else
    print_warning "Código ELEC2024-BASICA-SUP ya existe"
fi

# Paso 5: Crear datos de ejemplo
print_step "Creando datos de ejemplo..."

# Estudiante de ejemplo 1
student1='{
  "_id": "student_2024_10A_001",
  "type": "student",
  "cedula": "1234567890",
  "nombres": "María José",
  "apellidos": "García López", 
  "curso": "10mo A",
  "nivel": "BASICA_SUPERIOR",
  "year": 2024,
  "hasVoted": false,
  "isAbsent": false,
  "votedAt": null
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$student1" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Estudiante de ejemplo creado: María José García"
else
    print_warning "Estudiante de ejemplo ya existe"
fi

# Estudiante de ejemplo 2
student2='{
  "_id": "student_2024_1BACH_001",
  "type": "student",
  "cedula": "0987654321",
  "nombres": "Carlos Andrés",
  "apellidos": "Martínez Silva",
  "curso": "1ro Bach A", 
  "nivel": "BACHILLERATO",
  "year": 2024,
  "hasVoted": false,
  "isAbsent": false,
  "votedAt": null
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$student2" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Estudiante de ejemplo creado: Carlos Andrés Martínez"
else
    print_warning "Estudiante de ejemplo ya existe"
fi

# Candidato de ejemplo
candidate1='{
  "_id": "candidate_2024_president_001",
  "type": "candidate",
  "nombre": "Ana Sofía Pérez",
  "cargo": "PRESIDENTE",
  "lista": "Lista Azul",
  "color": "#2563eb",
  "foto": null,
  "propuestas": [
    "Mejora de la cafetería estudiantil",
    "Más actividades deportivas y culturales",
    "Implementación de espacios de estudio"
  ],
  "nivel": "BACHILLERATO",
  "year": 2024
}'

response=$(couchdb_request "POST" "/$DB_NAME" "$candidate1" 2>/dev/null || echo "exists")
if echo "$response" | grep -q "ok"; then
    print_status "Candidato de ejemplo creado: Ana Sofía Pérez"
else
    print_warning "Candidato de ejemplo ya existe"
fi

# Paso 6: Verificar que todo se creó correctamente
print_step "Verificando base de datos..."
db_info=$(couchdb_request "GET" "/$DB_NAME")
doc_count=$(echo "$db_info" | grep -o '"doc_count":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "0")

print_status "Base de datos inicializada con $doc_count documentos"

echo ""
echo "🎉 ¡Base de datos inicializada exitosamente!"
echo ""
echo "📋 Recursos creados:"
echo "   ✅ Configuración del sistema"
echo "   ✅ Niveles educativos (4 niveles)"
echo "   ✅ Códigos de activación (2 códigos)"
echo "   ✅ Estudiantes de ejemplo (2 estudiantes)"
echo "   ✅ Candidatos de ejemplo (1 candidato)"
echo ""
echo "🔐 Códigos de activación disponibles:"
echo "   📚 ELEC2024-BACH (Bachillerato)"
echo "   📚 ELEC2024-BASICA-SUP (Básica Superior)"
echo ""
echo "🌐 Acceder a:"
echo "   • Aplicación: http://localhost:3000"
echo "   • CouchDB Admin: http://localhost:5984/_utils"
echo "     Usuario: admin"
echo "     Contraseña: votaciones2024"
echo ""
echo "📊 Ver base de datos:"
echo "   curl -u admin:votaciones2024 http://localhost:5984/$DB_NAME"