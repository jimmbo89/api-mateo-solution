# Dockerfile
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias y instalarlas
COPY package*.json ./
RUN npm install --omit=dev

# Copiar todo el proyecto
COPY . .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto
EXPOSE 8080

# Comando de inicio
CMD ["node", "app/server.js"]
