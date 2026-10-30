# Despliegue en VPS Hostinger

Todo corre en un VPS (Hostinger KVM 1, Ubuntu, IP `179.197.89.184`) con Docker Compose (`docker-compose.prod.yml`):

```
Internet ──► Caddy (80/443, SSL automático Let's Encrypt)
              ├─ dbohorkz.com / www  → React (estático, fallback SPA)
              ├─ api.dbohorkz.com    → backend Flask (gunicorn)
              └─ wa.dbohorkz.com     → bot WhatsApp (solo /api/qr y /api/health, con usuario/clave)
backend ──► postgres (volumen pgdata)
```

Servicios externos: **Cloudinary** (imágenes subidas desde el admin) y **Resend** (correo).
Dominio registrado en **GoDaddy**, con los nameservers por defecto de GoDaddy.

> Tip: si al pegar varias líneas en la terminal SSH aparece `^[[200~` en la primera, ejecuta (a mano):
> `echo 'set enable-bracketed-paste off' >> ~/.inputrc && bind -f ~/.inputrc`

---

## Instalación desde cero

### 1. Servidor

```bash
apt update && apt upgrade -y
docker --version || curl -fsSL https://get.docker.com | sh
# Swap de 2 GB (necesario en planes de 4 GB por Chromium del bot)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
# Firewall: solo SSH y web
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443 && ufw --force enable
```

### 2. Código y `.env`

```bash
git clone https://github.com/lvelasquez25/dbohorkz.git /opt/dbohorkz
cd /opt/dbohorkz && cp .env.prod.example .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
sed -i "s|^SECRET_KEY=$|SECRET_KEY=$(openssl rand -hex 32)|" .env
sed -i "s|^JWT_SECRET_KEY=$|JWT_SECRET_KEY=$(openssl rand -hex 32)|" .env
# Clave de la página del QR (se muestra una vez; guardarla)
P=$(openssl rand -hex 8); echo "CLAVE DEL QR: $P"
H=$(docker run --rm caddy:2-alpine caddy hash-password --plaintext "$P"); sed -i "s|^WA_PASSWORD_HASH=.*|WA_PASSWORD_HASH=${H//\$/\$\$}|" .env
nano .env   # ACME_EMAIL, CLOUDINARY_*, RESEND_API_KEY
```

Ver qué campos siguen vacíos (sin mostrar valores):

```bash
grep -E '^[A-Z_]+=$' .env | cut -d= -f1
```

### 3. DNS (GoDaddy → DNS → Registros)

| Tipo | Nombre | Valor          |
|------|--------|----------------|
| A    | @      | IP_DEL_VPS     |
| CNAME| www    | dbohorkz.com   |
| A    | api    | IP_DEL_VPS     |
| A    | wa     | IP_DEL_VPS     |

No debe quedar ningún registro `A @ → Parked`. Si se usa Resend, agregar también los registros que
muestra su panel (Domains → dbohorkz.com).

### 4. Arrancar

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Si los certificados no salen porque el DNS aún no apuntaba al VPS: `docker compose -f docker-compose.prod.yml restart web`.

### 5. Usuario admin (hacerlo de inmediato: el registro es abierto)

En una sola línea; escribir la clave a mano cuando la pida:

```bash
read -s -p "Clave admin: " AP && echo && docker compose -f docker-compose.prod.yml exec -T -e AP="$AP" backend python -c "import urllib.request,json,os;print(urllib.request.urlopen(urllib.request.Request('http://localhost:5000/api/auth/register',data=json.dumps({'username':'admin','email':'TU_CORREO','password':os.environ['AP']}).encode(),headers={'Content-Type':'application/json'})).read().decode())"
```

### 6. Restaurar datos (si hay respaldo)

```bash
gunzip -c /root/backups/db-AAAA-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### 7. Vincular WhatsApp

Abrir `https://wa.dbohorkz.com/api/qr` (usuario `admin` + clave del QR) y escanear desde
WhatsApp → Dispositivos vinculados. La sesión queda en el volumen `wa-auth`.

---

## Operación diaria

```bash
cd /opt/dbohorkz
# Actualizar a la última versión
git pull && docker compose -f docker-compose.prod.yml up -d --build
# Ver logs
docker compose -f docker-compose.prod.yml logs -f --tail=100 backend
# Liberar espacio de imágenes viejas de Docker
docker image prune -f
```

### Backup diario de la base de datos

`crontab -e` y agregar:

```cron
0 3 * * * cd /opt/dbohorkz && mkdir -p /root/backups && docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > /root/backups/db-$(date +\%F).sql.gz && find /root/backups -name 'db-*.sql.gz' -mtime +7 -delete
```

## Verificación

- `curl https://api.dbohorkz.com/api/health` → `{"status":"ok"}`
- dbohorkz.com carga productos e imágenes; recargar en `/admin` no da 404
- `https://wa.dbohorkz.com/api/send-message` → 404 (no expuesto)
