-- Enable RLS on every table in the public schema. Our app routes go
-- through service-role (bypassing RLS), so we don't need permissive
-- per-table policies — RLS-enabled with no policies = anon role
-- cannot read or write, which is the security posture we want for a
-- public-internet PWA.
--
-- Idempotent: skips tables that already have it on.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END
$$;

-- Sanity report of the result so you can see what was on/off afterward.
SELECT c.relname AS tablename, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public'
ORDER BY c.relname;
