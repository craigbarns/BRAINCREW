-- Run with the dedicated `braincrew_migrator` connection after the Prisma
-- migration and seed. The role owns the application tables and bypasses their
-- forced RLS policies, which is required while provisioning a new tenant.

CREATE OR REPLACE FUNCTION public.handle_braincrew_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    "firstName",
    "lastName",
    "avatarUrl",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@pending.local'),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture'),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    "avatarUrl" = EXCLUDED."avatarUrl",
    "updatedAt" = now();

  IF NOT EXISTS (
    SELECT 1 FROM public."Membership" WHERE "userId" = NEW.id AND status = 'ACTIVE'
  ) THEN
    -- The first workspace shares the auth UUID so the web client can select it
    -- without a privileged membership lookup. Additional organizations keep
    -- their own UUID and will be selected explicitly by the future switcher.
    workspace_id := NEW.id;
    INSERT INTO public."Organization" (
      id, name, slug, status, "createdAt", "updatedAt"
    ) VALUES (
      workspace_id,
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', split_part(COALESCE(NEW.email, 'workspace'), '@', 1)),
      'workspace-' || replace(left(NEW.id::text, 13), '-', ''),
      'ACTIVE',
      now(),
      now()
    );
    INSERT INTO public."OrganizationBranding" (
      id, "organizationId", "primaryColor", "secondaryColor", "accentColor", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), workspace_id, '#7C5CFC', '#12101A', '#B8FF65', now(), now()
    );
    INSERT INTO public."Membership" (
      "organizationId", "userId", role, status, "createdAt", "updatedAt"
    ) VALUES (
      workspace_id, NEW.id, 'OWNER', 'ACTIVE', now(), now()
    );

    -- Make the safe built-in plugins immediately selectable for a new tenant.
    -- Plugin definitions are installed by `pnpm db:seed` before this trigger.
    INSERT INTO public."PluginInstallation" (
      id,
      "organizationId",
      "pluginDefinitionId",
      name,
      slug,
      status,
      config,
      "createdByUserId",
      "createdAt",
      "updatedAt"
    )
    SELECT
      gen_random_uuid(),
      workspace_id,
      definition.id,
      definition."displayName",
      definition.key,
      'ACTIVE',
      '{}'::jsonb,
      NEW.id,
      now(),
      now()
    FROM public."PluginDefinition" AS definition
    WHERE definition.enabled = true
      AND definition.key IN ('web-access', 'gmail', 'crm')
    ON CONFLICT ("organizationId", slug) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
