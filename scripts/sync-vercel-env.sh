#!/usr/bin/env bash
#
# Sube al proyecto de Vercel las variables que necesita el dispensario,
# leyéndolas de .env.local para no copiar secretos a mano.
#
# Requiere estar autenticado con la cuenta dueña del proyecto:
#   vercel login
#   vercel link
#
# Uso:  ./scripts/sync-vercel-env.sh [production|preview|development]
#
set -euo pipefail

TARGET="${1:-production}"
ENV_FILE=".env.local"

VARS=(
  CRON_SECRET
  NEXT_PUBLIC_VAPID_PUBLIC_KEY
  VAPID_PRIVATE_KEY
  VAPID_SUBJECT
)

if [ ! -f "$ENV_FILE" ]; then
  echo "No encuentro $ENV_FILE" >&2
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "No hay sesión de Vercel. Ejecuta: vercel login" >&2
  exit 1
fi

echo "Subiendo variables a Vercel ($TARGET)…"

for name in "${VARS[@]}"; do
  value=$(grep "^${name}=" "$ENV_FILE" | head -1 | cut -d= -f2-)

  if [ -z "$value" ]; then
    echo "  · $name — no está en $ENV_FILE, se omite"
    continue
  fi

  # Si ya existe hay que quitarla antes: `env add` no sobrescribe.
  vercel env rm "$name" "$TARGET" --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" "$TARGET" >/dev/null 2>&1

  echo "  ✓ $name"
done

echo
echo "Listo. Las variables se aplican en el próximo despliegue:"
echo "  vercel --prod"
