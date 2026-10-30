# Etapa 1: compilar el SPA de React
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# La URL del backend se fija en tiempo de compilación
ARG REACT_APP_API_URL=https://api.dbohorkz.com
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

# Etapa 2: servir con Caddy (SSL automático + proxy a backend y WhatsApp)
FROM caddy:2-alpine

COPY --from=build /app/build /srv
