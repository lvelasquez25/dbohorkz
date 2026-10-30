#!/bin/bash
# Despliegue en el VPS. Lo ejecuta GitHub Actions por SSH: la llave de GitHub está
# restringida en /root/.ssh/authorized_keys para correr solo este script.
# También se puede correr a mano: bash /opt/dbohorkz/deploy/deploy.sh
#
# Todo va entre llaves para que bash lea el script completo antes de ejecutarlo:
# `git pull` puede modificar este mismo archivo mientras corre.
{
  set -euo pipefail
  cd /opt/dbohorkz
  COMPOSE="docker compose -f docker-compose.prod.yml"

  echo "== Respaldo de la base de datos"
  if [ -x /root/backup-db.sh ]; then /root/backup-db.sh; fi

  echo "== Actualizando código"
  git pull --ff-only
  git log --oneline -1

  echo "== Construyendo y reiniciando servicios"
  $COMPOSE up -d --build --remove-orphans

  echo "== Limpieza de imágenes viejas"
  docker image prune -f

  $COMPOSE ps
  exit 0
}
