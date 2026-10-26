# Ecommerce Web con ChatBot + WhatsApp

Proyecto de comercio electrónico con chatbot inteligente basado en Python/Flask y React, con integración a WhatsApp con whatsapp-web.js.

## 📋 Características

- **E-commerce**: Catálogo de productos, carrito de compras, sistema de órdenes
- **ChatBot Inteligente**: Respuestas basadas en IA, FAQs, soporte al cliente
- **WhatsApp Integration**: Chatbot accesible desde WhatsApp en tiempo real
- **Autenticación**: Sistema de usuarios seguros
- **Base de datos**: SQLite (escalable a PostgreSQL)

## 🏗️ Estructura del Proyecto

```
.
├── frontend/              # Aplicación React
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/               # Servidor Flask
│   ├── app/
│   │   ├── models/       # Modelos de base de datos
│   │   ├── routes/       # Rutas API
│   │   ├── services/     # Lógica de negocio
│   │   └── __init__.py
│   ├── requirements.txt
│   └── run.py
├── whatsapp-service/      # 🆕 Servicio WhatsApp (Node.js)
│   ├── server.js
│   ├── package.json
│   └── README.md
├── docs/                  # Documentación
└── README.md
```

## 🚀 Inicio Rápido

### Requisitos
- Python 3.8+
- Node.js 16+
- pip, npm
- Chrome/Chromium (para WhatsApp)

### 1. Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python run.py
```

El servidor estará en: `http://localhost:5000`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm start
```

La app estará en: `http://localhost:3000`

### 3. WhatsApp Service (Nuevo) 🆕

```bash
cd whatsapp-service
npm install
npm start
```

El servicio estará en: `http://localhost:3001`

**Importante**: Escanea el código QR que aparecerá en la terminal para conectar tu WhatsApp.

## 📚 Documentación

- [Backend Setup](backend/README.md)
- [Frontend Setup](frontend/README.md)
- [WhatsApp Service Setup](whatsapp-service/README.md)
- [Documentación Completa](docs/SETUP.md)

## 🛠️ Stack Tecnológico

### Backend
- Flask
- Flask-SQLAlchemy (ORM)
- Flask-CORS
- python-dotenv

### Frontend
- React
- Axios (HTTP client)
- Tailwind CSS (estilos)

### WhatsApp Service
- Node.js
- whatsapp-web.js
- Express.js
- Axios

### Base de Datos
- SQLite

## 🔄 Flujo de Integración

```
Usuario WhatsApp
      ↓
  whatsapp-service (Node.js)
      ↓
  Backend Flask (Python)
      ↓
  Chatbot Service
      ↓
  Respuesta al usuario
```

## 📝 Variables de Entorno

### Backend (`.env`)
```env
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///ecommerce.db
```

### WhatsApp Service (`.env`)
```env
PORT=3001
FLASK_API_URL=http://localhost:5000
NODE_ENV=development
BOT_NAME=Sofia Bot
```
## 🌐 Deployment & Hosting

El proyecto está completamente listo para deployment en producción.

Producción en VPS Hostinger con Docker Compose. Ver [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md).

```
Caddy (SSL)  ──→  dbohorkz.com (React) · api.dbohorkz.com (Flask) · wa.dbohorkz.com (QR WhatsApp)
```

---
## 🛠️ Licencia

MIT

