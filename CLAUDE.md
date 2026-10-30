# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-commerce application for "Uniformes Penitenciarios" (INPEC uniforms store) with chatbot, WhatsApp integration, shopping cart, and order management. Three-service architecture:

- **Backend**: Flask REST API (Python) — port 5000
- **Frontend**: React SPA (JavaScript) — port 3000
- **WhatsApp Service**: Node.js bot — port 3001

## Commands

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend (React)
```bash
cd frontend
npm install
npm start        # Dev server
npm run build    # Production build
npm test         # Run tests
```

### WhatsApp Service
```bash
cd whatsapp-service
npm install
npm run dev      # Dev with nodemon
npm start        # Production
```

### Full Stack (Docker)
```bash
docker-compose up                          # Production
docker-compose -f docker-compose.dev.yml up  # Development
```

## Architecture

### Data Flow
```
WhatsApp User → whatsapp-service (Node.js) → backend (Flask) → PostgreSQL
Web User      → frontend (React)           → backend (Flask) → PostgreSQL
Cart checkout → POST /api/orders           → DB + WhatsApp message
```

### Backend (`backend/app/`)
- **Factory pattern**: `app/__init__.py` creates Flask app, initializes extensions (SQLAlchemy, CORS, Mail, Limiter), registers blueprints, serves `/Images/` static files
- **Models**: `User`, `Product`, `ProductImage`, `ChatMessage`, `Order`, `OrderItem` (in `models/`)
- **Routes/Blueprints**:
  - `auth` (`/api/auth/`) — register, login with JWT
  - `products` (`/api/products/`) — CRUD + image upload (Cloudinary or local) + gallery
  - `chatbot` (`/api/chatbot/`) — FAQ bot + email notification via Resend
  - `orders` (`/api/orders/`) — create order (public), list/update (admin)
- **Auth middleware**: `@require_auth` (JWT validation), `@require_admin` (JWT + username check against `ADMIN_USERNAME`)
- **Image upload**: Validates extension + magic bytes + size (5MB max). Uses Cloudinary if configured, otherwise local filesystem
- **Database**: SQLite locally; PostgreSQL in production (auto-converts `postgres://` to `postgresql://`)

### Frontend (`frontend/src/`)
- **Router** (`App.jsx`): `/` → Home, `/admin` → AdminPage. Wrapped in `CartProvider`
- **Home page** (`pages/Home.jsx`): composes Header → HeroSection → CarruselDestacados → ProductsSection → NosotrosSection → ContactoSection → Footer
- **ProductsSection**: Sidebar accordion (categories) + product grid. Uses `ProductCard` with "Ver más" (opens `ProductModal`) and "Agregar" (adds to cart)
- **Cart** (`context/CartContext.jsx`): React Context for cart state. `checkoutWhatsApp()` creates order via API then opens WhatsApp with order number
- **CartDrawer**: Slide-out panel with items, qty controls, customer name/phone fields, WhatsApp checkout button
- **AdminPage** (`pages/AdminPage.jsx`): Two tabs — "Productos" (CRUD + gallery upload) and "Pedidos" (list + status management)
- **API client** (`services/api.js`): Axios instance with JWT interceptor. Exports `productosAPI`, `authAPI`, `chatbotAPI`, `ordersAPI`, `imageUrl()` helper
- **Image URL resolution** (`imageUrl()`): URLs starting with `http` pass through; UUID filenames route to the backend (`API_URL`); others stay relative (bundled in the frontend build)
- **Tailwind CSS** via craco (`craco.config.js`)

### WhatsApp Service (`whatsapp-service/`)
- `server.js`: WhatsApp Web client (via `whatsapp-web.js`) + Express API
- Uses `LocalAuth` to persist session in `.wwebjs_auth/`
- QR code available at `GET /api/qr` (web page with auto-refresh)
- Forwards incoming messages to Flask `/api/chatbot/message` and replies with response
- REST endpoints: `GET /api/health`, `GET /api/info`, `GET /api/qr`, `POST /api/send-message`

## Order System

Orders are created when a customer clicks "Enviar pedido por WhatsApp" in the cart:
1. `POST /api/orders/` creates the order with a unique number (format: `PED-YYYYMMDD-XXXX`)
2. The order number is shown in the cart confirmation
3. WhatsApp message includes the order number for reference
4. Admin can view and manage orders in `/admin` → Pedidos tab
5. Status flow: pendiente → confirmado → enviado → entregado (or cancelado)

## Known Issues / TODOs
- Chatbot is FAQ-based only; OpenAI integration is prepared but not wired in (`OPENAI_API_KEY` read but unused)
- Images uploaded via admin go to Cloudinary (permanent). Original images committed in `frontend/public/Images/` are bundled in the frontend build

## Environment Variables

**Backend** (`.env` in `backend/` locally; root `.env` on the VPS):
- `DATABASE_URL` — PostgreSQL URL (falls back to SQLite)
- `SECRET_KEY` / `JWT_SECRET_KEY` — Flask + JWT secrets (auto-generated if missing, but not persistent across restarts)
- `CORS_ORIGINS` — Comma-separated allowed origins (default: `http://localhost:3000`)
- `ADMIN_USERNAME` — Username for admin access (default: `admin`)
- `RESEND_API_KEY` — For email notifications
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — Image storage
- `OPENAI_API_KEY` — Optional, for AI chatbot (not active)

**Frontend** (`.env.production` in `frontend/`; on the VPS it's a build arg from `SITE_DOMAIN`):
- `REACT_APP_API_URL` — Backend URL (default: `https://api.dbohorkz.com`)

**WhatsApp Service** (`.env` in `whatsapp-service/`):
- `FLASK_API_URL` — Backend URL (default: `http://localhost:5000`)
- `TYPING_DELAY` — Simulated typing delay in ms

## Deployment
Hostinger VPS with Docker Compose (`docker-compose.prod.yml`); full guide in `DEPLOY_HOSTINGER.md`.
- **web** (Caddy, `frontend/Dockerfile` + `deploy/Caddyfile`): serves React build at dbohorkz.com with SPA fallback, auto SSL, proxies `api.dbohorkz.com` → backend and `wa.dbohorkz.com` (only `/api/qr`, `/api/health`, basic auth) → whatsapp
- **backend**: gunicorn, Postgres in the `postgres` container, local uploads in `uploads` volume (`UPLOAD_FOLDER=/app/uploads`)
- **whatsapp**: session persisted in `wa-auth` volume
- **Config**: root `.env` (template: `.env.prod.example`). `REACT_APP_API_URL` is baked at build time from `SITE_DOMAIN`
- **Images**: Original product images bundled in the frontend build (`/Images/`). New uploads stored in Cloudinary
- **Domain**: registered at GoDaddy; A records point to the VPS. Keep Resend DNS records intact
