#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Install it: corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
fi

echo "=== Clipper home-server setup ==="
echo ""

# Data directory
DEFAULT_DATA_DIR="/var/lib/clipper"
read -rp "Data directory [$DEFAULT_DATA_DIR]: " DATA_DIR
DATA_DIR=${DATA_DIR:-$DEFAULT_DATA_DIR}

DB_URL="file:${DATA_DIR}/content.db"

if [ ! -d "$DATA_DIR" ]; then
  echo "Creating $DATA_DIR..."
  if [[ "$DATA_DIR" == /var/lib* ]] || [[ "$DATA_DIR" == /usr/local* ]]; then
    sudo mkdir -p "$DATA_DIR"
    sudo chown "$(id -u):$(id -g)" "$DATA_DIR"
  else
    mkdir -p "$DATA_DIR"
  fi
fi

# Environment
if [ -f .env ]; then
  echo ".env already exists — leaving it alone. Make sure DATABASE_URL is set to:"
  echo "  DATABASE_URL=\"$DB_URL\""
else
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@clipper.os}"
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(openssl rand -base64 24)}"
  AUTH_SECRET="$(openssl rand -base64 32)"

  cat > .env <<EOF
DATABASE_URL="$DB_URL"
AUTH_SECRET="$AUTH_SECRET"
AUTH_TRUST_HOST="true"
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
EOF

  echo ".env created."
  echo "  Admin email:    $ADMIN_EMAIL"
  echo "  Admin password: $ADMIN_PASSWORD"
  echo "  (save this password; it will not be shown again)"
fi

# Deps + build
echo ""
echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Generating Prisma client..."
pnpm exec prisma generate

echo "Running migrations..."
pnpm exec prisma migrate deploy

echo "Seeding admin user..."
pnpm db:seed

echo "Building..."
pnpm build

echo ""
echo "=== Setup complete ==="
echo ""
echo "Start the server with:"
echo "  pnpm start"
echo ""
echo "Or install the systemd unit from docs/DEPLOYMENT.md."
