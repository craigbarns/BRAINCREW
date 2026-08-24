# ADR 0002 — Isolation multi-tenant en profondeur

Statut : accepté.

Les ressources métier possèdent `organizationId`. Les relations entre ressources tenant sont composites afin qu’une référence inter-organisation échoue au niveau de la clé étrangère. Toute requête applicative passe par une transaction `withTenant` qui configure `app.current_organization_id` et `app.current_user_id` avec `set_config(..., true)`.

PostgreSQL RLS constitue la dernière barrière. Le rôle runtime est `NOBYPASSRLS`; le rôle de migration est distinct. Les jobs worker configurent eux aussi explicitement l’organisation, avec `app.is_worker=true`.
