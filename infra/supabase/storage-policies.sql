INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "organization members can read assets" ON storage.objects;
CREATE POLICY "organization members can read assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND EXISTS (
    SELECT 1 FROM public."Membership" membership
    WHERE membership."organizationId"::text = (storage.foldername(name))[1]
      AND membership."userId" = auth.uid()
      AND membership.status = 'ACTIVE'
  )
);

DROP POLICY IF EXISTS "organization admins can upload assets" ON storage.objects;
CREATE POLICY "organization admins can upload assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets'
  AND EXISTS (
    SELECT 1 FROM public."Membership" membership
    WHERE membership."organizationId"::text = (storage.foldername(name))[1]
      AND membership."userId" = auth.uid()
      AND membership.status = 'ACTIVE'
      AND membership.role IN ('OWNER', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "organization admins can update assets" ON storage.objects;
CREATE POLICY "organization admins can update assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND EXISTS (
    SELECT 1 FROM public."Membership" membership
    WHERE membership."organizationId"::text = (storage.foldername(name))[1]
      AND membership."userId" = auth.uid()
      AND membership.role IN ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  bucket_id = 'organization-assets'
  AND EXISTS (
    SELECT 1 FROM public."Membership" membership
    WHERE membership."organizationId"::text = (storage.foldername(name))[1]
      AND membership."userId" = auth.uid()
      AND membership.status = 'ACTIVE'
      AND membership.role IN ('OWNER', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "organization admins can delete assets" ON storage.objects;
CREATE POLICY "organization admins can delete assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'organization-assets'
  AND EXISTS (
    SELECT 1 FROM public."Membership" membership
    WHERE membership."organizationId"::text = (storage.foldername(name))[1]
      AND membership."userId" = auth.uid()
      AND membership.status = 'ACTIVE'
      AND membership.role IN ('OWNER', 'ADMIN')
  )
);
