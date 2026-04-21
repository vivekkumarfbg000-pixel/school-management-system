-- Enable RLS and create isolation policies for all multi-tenant tables
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'users' AND tablename != 'schools')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(t_name) || ' ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "School isolation" ON public.' || quote_ident(t_name) || ';';
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'school_id') THEN
            EXECUTE 'CREATE POLICY "School isolation" ON public.' || quote_ident(t_name) || ' USING (school_id = (auth.jwt() ->> ''school_id''));';
        END IF;
    END LOOP;
END
$$;

-- Specific policy for schools table (only admins of that school can see/update)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School isolation" ON public.schools;
CREATE POLICY "School isolation" ON public.schools USING (id::text = (auth.jwt() ->> 'school_id'));

-- Users table is typically managed by Supabase Auth, but if we have a public.users table:
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School isolation" ON public.users;
CREATE POLICY "School isolation" ON public.users USING (school_id = (auth.jwt() ->> 'school_id'));
