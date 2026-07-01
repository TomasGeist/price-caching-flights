FROM node:22-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto de NestJS
EXPOSE 3000

# Comando para arrancar en modo desarrollo (hot reload)
CMD [ "npm", "run", "start:dev" ]