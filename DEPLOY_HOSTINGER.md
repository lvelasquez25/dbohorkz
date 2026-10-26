# Despliegue en VPS Hostinger

Todo corre en un VPS con Docker Compose (`docker-compose.prod.yml`):

```
Internet ──► Caddy (80/443, SSL automático)
              ├─ dbohorkz.com / www  → React (estático, fallback SPA)
              ├─ api.dbohorkz.com    → backend Flask (gunicorn)
              └─ wa.dbohorkz.com     → bot WhatsApp (solo /api/qr y /api/health, con usuario/clave)
backend ──► postgres (volumen pgdata)
```

Servicios externos que se mantienen: **Cloudinary** (imágenes subidas) y **Resend** (correo).
El dominio sigue registrado en **GoDaddy**; solo se cambian los registros DNS.

---

## 1. Crear el VPS

1. hPanel → VPS → plantilla **Ubuntu 24.04 with Docker** (o Ubuntu + instalar Docker).
   Plan mínimo recomendado: **KVM 2** (Chromium del bot de WhatsApp consume bastante RAM).
2. Agregar tu llave SSH y anotar la **IP pública** del VPS.
3. Firewall del VPS (hPanel → Firewall): permitir solo **22, 80, 443** (TCP) y **443 UDP**.
4. Conectarse: `ssh root@IP_DEL_VPS`. Si la plantilla no trae Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

## 2. Respaldar la base de datos actual (Railway)

En Railway → servicio Postgres → Variables, copiar `DATABASE_PUBLIC_URL`. Desde el VPS:

```bash
docker run --rm postgres:16-alpine pg_dump --no-owner --no-acl "URL_PUBLICA_DE_RAILWAY" > /root/railway.sql
```

## 3. Clonar y configurar

```bash
git clone https://github.com/<usuario>/dbohorkz.git /opt/dbohorkz
cd /opt/dbohorkz
cp .env.prod.example .env
nano .env
```

Completar `.env` copiando los valores actuales de las variables de Railway. **Mantener el mismo
`JWT_SECRET_KEY`** para no cerrar sesiones. Para la clave de la página del QR:

```bash
docker run --rm caddy:2-alpine caddy hash-password --plaintext 'una-clave'
# Pegar el resultado en WA_PASSWORD_HASH reemplazando cada $ por $$
```

## 4. Restaurar la base de datos (ANTES de arrancar el backend)

```bash
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < /root/railway.sql
```

## 5. DNS (GoDaddy)

Primero revisar dónde están los **nameservers** de dbohorkz.com (GoDaddy → Dominio → DNS → Nameservers):

- **Si apuntan a Cloudflare** (`*.ns.cloudflare.com`): editar los registros en Cloudflare, con la nube
  en **gris (DNS only)** para que Caddy pueda emitir el SSL. O cambiar los nameservers a los de GoDaddy
  y recrear allí **todos** los registros (copiarlos antes de Cloudflare).
- **Si son de GoDaddy**: editar en GoDaddy → DNS.

Registros a crear/cambiar (bajar TTL a 600 un día antes):

| Tipo | Nombre | Valor          |
|------|--------|----------------|
| A    | @      | IP_DEL_VPS     |
| A    | www    | IP_DEL_VPS     |
| A    | api    | IP_DEL_VPS     |
| A    | wa     | IP_DEL_VPS     |

Eliminar el CNAME/registro antiguo que apuntaba a Cloudflare Pages (`dbohorkz.pages.dev`).
**No tocar** los registros de Resend (TXT `resend._domainkey`, MX/TXT de `send`) ni los MX de correo;
si se cambian los nameservers, hay que copiarlos tal cual.

## 6. Arrancar todo

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f web backend
```

Caddy obtiene los certificados en cuanto el DNS resuelve a la IP del VPS.

## 7. Vincular WhatsApp

Abrir `https://wa.dbohorkz.com/api/qr`, entrar con `WA_USER` y la clave, y escanear desde
WhatsApp → Dispositivos vinculados. La sesión queda guardada en el volumen `wa-auth`.
Antes, desvincular la sesión del bot de Railway (o apagar ese servicio) para que no compitan.

## 8. Verificar

- `curl https://api.dbohorkz.com/api/health` → `{"status":"ok"}`
- dbohorkz.com carga productos e imágenes; recargar en `/admin` no da 404
- Login admin, subir una imagen, crear pedido de prueba desde el carrito
- Mensaje al WhatsApp → el bot responde
- Chatbot web → llega el correo de Resend
- `reboot` del VPS → todo vuelve solo y no pide QR

## 9. Apagar lo anterior

Cuando todo esté verificado (dejar unos días de margen): eliminar servicios en Railway y el proyecto
en Cloudflare Pages.

---

## Operación diaria

```bash
cd /opt/dbohorkz
# Actualizar a la última versión
git pull && docker compose -f docker-compose.prod.yml up -d --build
# Ver logs
docker compose -f docker-compose.prod.yml logs -f --tail=100 backend
```

### Backup diario de la base de datos

`crontab -e` y agregar:

```cron
0 3 * * * cd /opt/dbohorkz && mkdir -p /root/backups && docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > /root/backups/db-$(date +\%F).sql.gz && find /root/backups -name 'db-*.sql.gz' -mtime +7 -delete
```
