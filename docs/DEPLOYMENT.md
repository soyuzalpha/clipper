# Deployment — Ubuntu single-node

The app is a single Next.js process backed by a local SQLite file. Designed for
a home server behind a reverse proxy (Caddy / nginx) with HTTPS terminated
upstream.

## Prerequisites

- Node.js 20+ and pnpm
- A non-root user that will own the data directory and run the service

## One-time setup

Run the automated script from the project root:

```bash
./scripts/setup.sh
```

It prompts for a data directory (default `/var/lib/clipper`), creates it,
generates `.env` with a random `AUTH_SECRET` and `ADMIN_PASSWORD`, installs
dependencies, runs migrations, seeds the admin user, and builds the app.
Save the admin password it prints.

<details>
<summary>Manual steps (if you prefer)</summary>

1. Create the data directory (owned by the service user, not root):

   ```bash
   sudo mkdir -p /var/lib/clipper
   sudo chown $USER:$USER /var/lib/clipper
   ```

2. Configure environment:

   ```bash
   cp .env.example .env
   openssl rand -base64 32   # paste into AUTH_SECRET
   $EDITOR .env              # set DATABASE_URL, AUTH_SECRET, ADMIN_PASSWORD
   ```

3. Install, migrate, seed, build:

   ```bash
   pnpm install --frozen-lockfile
   pnpm db:generate
   pnpm exec prisma migrate deploy
   pnpm db:seed
   pnpm build
   ```

</details>

## Run as a systemd service

Create `/etc/systemd/system/clipper.service`:

```ini
[Unit]
Description=Clipper Content OS
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/opt/clipper
EnvironmentFile=/opt/clipper/.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now clipper
sudo journalctl -u clipper -f   # logs
```

## Reverse proxy

NextAuth requires HTTPS in production. Terminate TLS at the proxy and forward
to `127.0.0.1:3000`. Make sure `AUTH_TRUST_HOST=true` is set in `.env` so
NextAuth honors the proxy's `X-Forwarded-Host`.

Caddy example:

```caddyfile
clipper.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
}
```

## Backups

The entire state is a single file. Snapshot it while the service is running
(SQLite is safe for online backups via the `.backup` API, but `cp` is fine for
a copy-on-write FS like ZFS/btrfs):

```bash
sqlite3 /var/lib/clipper/content.db ".backup '/var/backups/clipper-$(date +%F).db'"
```

## Updating

```bash
git pull
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
sudo systemctl restart clipper
```

## Resetting the admin password

```bash
node -e '
  const { PrismaClient } = require("./src/generated/prisma/client");
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  const bcrypt = require("bcryptjs");
  (async () => {
    const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }) });
    const hash = await bcrypt.hash(process.argv[2], 10);
    await prisma.user.update({ where: { email: "admin@clipper.os" }, data: { passwordHash: hash } });
    await prisma.$disconnect();
  })();
' 'new-password-here'
```
