# Imagen base para desarrollo
FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache git curl netcat-openbsd

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Cambiar propietario del directorio
RUN chown -R nextjs:nodejs /app
USER nextjs

# Copiar archivos de configuración de package manager
COPY --chown=nextjs:nodejs package*.json ./

# Instalar dependencias (todas para desarrollo)
RUN npm install --legacy-peer-deps

# Copiar el resto del código fuente
COPY --chown=nextjs:nodejs . .

# Exponer el puerto de desarrollo
EXPOSE 3000

# Variables de entorno para desarrollo
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Comando de inicio para desarrollo
CMD ["npm", "start"]