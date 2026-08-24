# Railway

L’infrastructure Railway est déclarée dans `.railway/railway.ts` avec le SDK IaC officiel :

- `BRAINCREW` : Next.js, futur domaine `braincrew.ai` (service GitHub existant conservé) ;
- `api` : Fastify, futur domaine `api.braincrew.ai`, migration Prisma en pre-deploy dès que `DIRECT_URL` est défini ;
- `worker` : BullMQ + DeepSeek Harness, sans domaine public ;
- `redis` : file d’exécution privée.

Les appels `preserve()` empêchent les secrets configurés dans Railway d’être inscrits dans Git ou remplacés lors d’un `config apply`.

Railway CLI 5.42.1 minimum est requis :

```bash
npm install --global @railway/cli@latest
railway login
railway init
railway config plan
railway config apply
```

Railway ne permet pas encore de créer les domaines personnalisés depuis l’IaC. Après l’application du plan, ajouter `braincrew.ai` au service `BRAINCREW` et `api.braincrew.ai` au service `api` dans **Settings → Networking**, puis configurer les DNS indiqués.

Les trois services utilisent le dépôt GitHub `craigbarns/BRAINCREW` et se redéploient automatiquement sur `main`. Une fois les secrets définis, un premier déploiement peut aussi être déclenché depuis la CLI :

```bash
railway up --service BRAINCREW --ci
railway up --service api --ci
railway up --service worker --ci
railway status
```
