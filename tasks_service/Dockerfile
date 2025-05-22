FROM node:16

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar tzdata y configurar la zona horaria
RUN apt-get update && apt-get install -y tzdata \
    && ln -fs /usr/share/zoneinfo/America/Guayaquil /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata

# Copiar los archivos package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto 3002
EXPOSE 3002

# Comando para iniciar la aplicación
CMD ["node", "src/app.js"]
