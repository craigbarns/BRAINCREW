# Braincrew

Plateforme B2B d’orchestration d’agents IA en marque blanche, construite sur DeepSeek Harness et Cordis.

## Architecture

```text
braincrew/
├── apps/
│   ├── web/                 # Next.js, Tailwind, composants shadcn-style
│   ├── api/                 # Fastify, Supabase Auth, Stripe, BullMQ
│   └── worker/              # exécutions agent/workflow et métriques
├── packages/
│   ├── auth/                # client Supabase partagé
│   ├── contracts/           # contrats Zod API + jobs
│   ├── database/            # Prisma, migration PostgreSQL et RLS
│   ├── observability/       # logs structurés avec secrets expurgés
│   ├── orchestrator-dsh/    # adaptateur isolé DeepSeek Harness/Cordis
│   └── ui/                  # design system partagé
├── plugins/
│   ├── web-access/          # accès HTTPS protégé contre le SSRF
│   ├── gmail/               # API Gmail OAuth
│   └── crm/                 # adaptateur CRM HTTPS allowlisté
├── infra/
│   ├── supabase/            # Auth trigger, rôles et Storage policies
│   └── railway/             # guide de déploiement
├── .railway/railway.ts      # IaC web + API + worker + Redis
└── docs/adr/                # décisions d’architecture
```

Supabase héberge PostgreSQL, Auth et Storage. Railway héberge les trois processus applicatifs et Redis. Les requêtes API utilisent une transaction tenant-scopée et PostgreSQL applique une seconde barrière par RLS forcé.

## Démarrage sans services externes

```bash
source /Users/gregorybaranes/.nvm/nvm.sh
nvm use 22
pnpm install
cp .env.example .env
pnpm dev:web
```

Le dashboard fonctionne avec ses données de démonstration. Pour lancer l’API en mémoire :

```bash
AUTH_BYPASS=true pnpm dev:api
```

## Démarrage avec PostgreSQL et Redis

Docker est optionnel mais simplifie l’environnement local :

```bash
docker compose -f infra/docker-compose.local.yml up -d
pnpm db:generate
pnpm db:migrate --name initial
pnpm db:seed
pnpm dev
```

Copier `.env.example` vers `.env` et remplacer les URLs locales ou Supabase avant la migration.

## Initialisation Supabase

1. Créer un projet Supabase vide et récupérer les connexions dans **Connect**.
2. Utiliser une connexion directe ou Supavisor session (`:5432`) pour `DIRECT_URL`, et le rôle runtime `braincrew_app` pour `DATABASE_URL`.
3. Déployer dans cet ordre :

```bash
export DIRECT_URL='postgresql://...'
export DATABASE_URL="$DIRECT_URL"
pnpm db:deploy
pnpm db:seed
psql "$DIRECT_URL" --set ON_ERROR_STOP=1 --file infra/supabase/roles.sql
psql "$DIRECT_URL" --set ON_ERROR_STOP=1 --file infra/supabase/auth-trigger.sql
psql "$DIRECT_URL" --set ON_ERROR_STOP=1 --file infra/supabase/storage-policies.sql
```

Après `roles.sql`, attribuer des mots de passe distincts à `braincrew_app` et `braincrew_worker` depuis le gestionnaire de secrets, puis construire les URLs runtime avec ces rôles. `DIRECT_URL` reste réservé aux migrations ; `WEBHOOK_DATABASE_URL` utilise un rôle privilégié séparé et n’est accessible qu’au service API.

Le seed installe les définitions DeepSeek et les trois plugins approuvés avant la création du trigger Auth. Toute nouvelle inscription Supabase crée ensuite l’utilisateur applicatif, son premier workspace, sa marque et ses installations de plugins.

## Déploiement Railway

La configuration actuelle est déclarée dans `.railway/railway.ts` : `BRAINCREW` (web), `api`, `worker` et `redis`, tous en région Europe Ouest et reliés au dépôt `craigbarns/BRAINCREW`. Installer la CLI récente et examiner le plan avant application :

```bash
npm install --global @railway/cli@latest
railway login
railway init
railway config plan
railway config apply
```

Renseigner ensuite les variables marquées `preserve()` dans chaque service Railway, puis déployer :

```bash
railway up --service BRAINCREW --ci
railway up --service api --ci
railway up --service worker --ci
railway status
```

Configurer le webhook Stripe sur `https://api.braincrew.ai/v1/webhooks/stripe`, puis placer le secret de signature dans `STRIPE_WEBHOOK_SECRET`. Faire pointer les DNS de `braincrew.ai` et `api.braincrew.ai` vers les cibles données par Railway.

En attendant les DNS personnalisés, les URLs Railway générées sont `https://braincrew-production.up.railway.app` et `https://api-production-720e.up.railway.app`. Le CORS API accepte temporairement les deux origines web.

## Contrôles qualité

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Les secrets Supabase, Stripe, DeepSeek et les URLs PostgreSQL privilégiées ne doivent jamais être exposés au service web.
