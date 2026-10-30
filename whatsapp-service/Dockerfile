FROM node:18-slim

WORKDIR /app

# Instalar Chromium y dependencias necesarias para Puppeteer en Debian slim
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libfreetype6 \
    libharfbuzz0b \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Decirle a Puppeteer dónde está Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copiar dependencias
COPY package.json ./
RUN npm install --only=production

# Copiar código
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
