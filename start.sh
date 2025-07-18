#!/bin/bash

# Script de inicio para Sistema de Votación Estudiantil PWA
# Versión de Producción con Nginx

set -e

echo "🏛️  Sistema de Votación Estudiantil PWA - Iniciando..."
echo "=================================================="

# Variables de entorno por defecto
: ${NGINX_HOST:=localhost}
: ${NGINX_PORT:=80}
: ${COUCHDB_HOST:=couchdb}
: ${COUCHDB_PORT:=5984}

# Función para logging con timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar configuración de Nginx
log "🔧 Configurando Nginx..."

# Sustituir variables de entorno en configuración de Nginx si es necesario
if [ ! -z "$NGINX_CUSTOM_CONFIG" ]; then
    log "📝 Aplicando configuración personalizada de Nginx"
    envsubst '${NGINX_HOST} ${NGINX_PORT} ${COUCHDB_HOST} ${COUCHDB_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
fi

# Verificar que los archivos de la aplicación existen
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    log "❌ Error: Archivos de la aplicación no encontrados"
    exit 1
fi

log "✅ Archivos de aplicación encontrados"

# Crear directorio de logs si no existe
mkdir -p /var/log/nginx

# Verificar permisos
log "🔐 Verificando permisos..."
chown -R nginx:nginx /usr/share/nginx/html
chown -R nginx:nginx /var/log/nginx
chmod -R 755 /usr/share/nginx/html

# Verificar conectividad con CouchDB (si está configurado)
if [ ! -z "$COUCHDB_HOST" ]; then
    log "🔍 Verificando conectividad con CouchDB en $COUCHDB_HOST:$COUCHDB_PORT..."
    
    # Esperar hasta 60 segundos para que CouchDB esté disponible
    timeout=60
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if nc -z $COUCHDB_HOST $COUCHDB_PORT 2>/dev/null; then
            log "✅ CouchDB está disponible"
            break
        fi
        
        if [ $counter -eq 0 ]; then
            log "⏳ Esperando a que CouchDB esté disponible..."
        fi
        
        sleep 2
        counter=$((counter + 2))
    done
    
    if [ $counter -ge $timeout ]; then
        log "⚠️  Advertencia: CouchDB no está disponible después de ${timeout}s"
        log "🔄 La aplicación funcionará en modo offline"
    fi
fi

# Verificar configuración de Nginx
log "🧪 Verificando configuración de Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    log "❌ Error en configuración de Nginx"
    exit 1
fi

log "✅ Configuración de Nginx válida"

# Configurar timezone si está especificado
if [ ! -z "$TZ" ]; then
    log "🌍 Configurando timezone: $TZ"
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
    echo $TZ > /etc/timezone
fi

# Crear archivo de información de versión
cat > /usr/share/nginx/html/version.json << EOF
{
  "version": "${APP_VERSION:-1.0.0}",
  "buildDate": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "nginx": "$(nginx -v 2>&1 | sed 's/nginx version: nginx\///')",
  "environment": "${NODE_ENV:-production}",
  "features": {
    "pwa": true,
    "offline": true,
    "sync": true
  }
}
EOF

# Configurar cabeceras de seguridad adicionales si es producción
if [ "$NODE_ENV" = "production" ]; then
    log "🔒 Aplicando configuración de seguridad para producción"
    
    # Agregar cabeceras de seguridad adicionales
    cat >> /etc/nginx/conf.d/security.conf << EOF
# Configuración adicional de seguridad
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:; manifest-src 'self';" always;
add_header X-Robots-Tag "noindex, nofollow" always;
EOF
fi

# Mostrar información del sistema
log "📊 Información del sistema:"
log "   - Nginx: $(nginx -v 2>&1)"
log "   - Timezone: $(date +'%Z %z')"
log "   - Espacio en disco: $(df -h / | awk 'NR==2{print $4}') disponible"
log "   - Memoria: $(free -h | awk 'NR==2{print $7}') disponible"

# Configurar rotación de logs
cat > /etc/logrotate.d/nginx << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 nginx nginx
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

# Mensaje de inicio exitoso
log "🚀 Sistema configurado correctamente"
log "📱 Aplicación disponible en puerto $NGINX_PORT"
log "🌐 PWA lista para instalación"

# Mostrar estadísticas de archivos servidos
total_files=$(find /usr/share/nginx/html -type f | wc -l)
total_size=$(du -sh /usr/share/nginx/html | cut -f1)
log "📁 Archivos: $total_files ($total_size)"

# Función para manejar señales de terminación
cleanup() {
    log "📴 Recibida señal de terminación, cerrando gracefully..."
    nginx -s quit
    exit 0
}

# Configurar trap para señales
trap cleanup SIGTERM SIGINT SIGQUIT

# Función para monitorear la salud del servicio
health_check() {
    while true; do
        sleep 30
        
        # Verificar que Nginx esté corriendo
        if ! pgrep nginx > /dev/null; then
            log "❌ Nginx no está corriendo, reiniciando..."
            nginx
        fi
        
        # Verificar espacio en disco
        available_space=$(df / | awk 'NR==2{print $4}')
        if [ $available_space -lt 1048576 ]; then  # Menos de 1GB
            log "⚠️  Advertencia: Poco espacio en disco disponible: $(df -h / | awk 'NR==2{print $4}')"
        fi
        
        # Limpiar logs antiguos si es necesario
        find /var/log/nginx -name "*.log" -mtime +7 -delete 2>/dev/null || true
    done
}

# Iniciar monitoreo en segundo plano
health_check &

# Mensaje final
echo ""
log "✨ ¡Sistema de Votación Estudiantil PWA iniciado exitosamente!"
log "🔗 Acceda a la aplicación en: http://$NGINX_HOST:$NGINX_PORT"
echo ""

# Iniciar Nginx en primer plano
log "🌐 Iniciando servidor web Nginx..."
exec nginx -g "daemon off;"