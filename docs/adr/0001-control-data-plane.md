# ADR 0001 — Séparer le control plane du data plane

Statut : accepté.

Le dashboard et l’API constituent le control plane. Ils gèrent les organisations, versions, permissions, déclencheurs et demandes d’exécution. Le worker constitue le data plane et est seul autorisé à lancer DeepSeek Harness.

Cette séparation évite qu’un appel HTTP long immobilise l’API, permet de faire évoluer le nombre de workers indépendamment, et limite la surface qui reçoit les secrets modèle et plugins. Les jobs ne transportent que `organizationId` et `executionId`; le worker recharge la version immuable depuis PostgreSQL.
