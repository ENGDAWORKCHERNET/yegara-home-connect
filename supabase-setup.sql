-- =========================================================
-- YEGARA FULL DATABASE SCHEMA INITIALIZATION
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lflkzaeevvipwalveybc/sql/new
-- =========================================================

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner','tenant','guard');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending','verified','late','paid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.trust_score AS ENUM ('high','medium','low');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.maintenance_status AS ENUM ('pending','in_progress','resolved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.recurrence_type AS ENUM ('monthly','quarterly','yearly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Helper schema & functions
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'phone','')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'tenant'))
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 5. Houses Table
CREATE TABLE IF NOT EXISTS public.houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  house_number text NOT NULL,
  description text NOT NULL DEFAULT '',
  rent_amount numeric(12,2) NOT NULL DEFAULT 0,
  recurrence public.recurrence_type NOT NULL DEFAULT 'monthly',
  next_due_date date NOT NULL DEFAULT (now() + interval '30 days')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS houses_owner_idx ON public.houses(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.houses TO authenticated;
GRANT ALL ON public.houses TO service_role;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS houses_updated_at ON public.houses;
CREATE TRIGGER houses_updated_at BEFORE UPDATE ON public.houses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Tenant Assignments Table
CREATE TABLE IF NOT EXISTS public.tenant_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ta_house_idx ON public.tenant_assignments(house_id);
CREATE INDEX IF NOT EXISTS ta_tenant_idx ON public.tenant_assignments(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_assignments TO authenticated;
GRANT ALL ON public.tenant_assignments TO service_role;
ALTER TABLE public.tenant_assignments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS ta_updated_at ON public.tenant_assignments;
CREATE TRIGGER ta_updated_at BEFORE UPDATE ON public.tenant_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_path text NOT NULL,
  expected_amount numeric(12,2) NOT NULL DEFAULT 0,
  extracted_amount numeric(12,2),
  status public.payment_status NOT NULL DEFAULT 'pending',
  trust_score public.trust_score NOT NULL DEFAULT 'low',
  ai_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS payments_house_idx ON public.payments(house_id);
CREATE INDEX IF NOT EXISTS payments_tenant_idx ON public.payments(tenant_id);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 8. Maintenance Requests Table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  image_path text,
  status public.maintenance_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mr_house_idx ON public.maintenance_requests(house_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS mr_updated_at ON public.maintenance_requests;
CREATE TRIGGER mr_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 10. Access check functions
CREATE OR REPLACE FUNCTION app.owns_house(_user_id uuid, _house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.houses h WHERE h.id = _house_id AND h.owner_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION app.can_view_house(_user_id uuid, _house_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    app.owns_house(_user_id, _house_id)
    OR app.has_role(_user_id, 'guard')
    OR EXISTS (
      SELECT 1 FROM public.tenant_assignments ta
      WHERE ta.house_id = _house_id AND ta.tenant_id = _user_id
    )
    OR (
      app.has_role(_user_id, 'tenant')
      AND NOT EXISTS (
        SELECT 1 FROM public.tenant_assignments ta
        WHERE ta.house_id = _house_id AND ta.status = 'approved'
      )
    );
$$;

CREATE OR REPLACE FUNCTION app.shares_house_with(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_assignments ta
    JOIN public.houses h ON h.id = ta.house_id
    WHERE (h.owner_id = _a AND ta.tenant_id = _b)
       OR (h.owner_id = _b AND ta.tenant_id = _a)
  );
$$;

GRANT EXECUTE ON FUNCTION app.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.owns_house(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.can_view_house(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.shares_house_with(uuid, uuid) TO authenticated, service_role;

-- 11. Row Level Security Policies
-- Profiles
DROP POLICY IF EXISTS profiles_read_related ON public.profiles;
CREATE POLICY profiles_read_related ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR app.has_role(auth.uid(), 'guard') OR app.shares_house_with(auth.uid(), id));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- User roles
DROP POLICY IF EXISTS user_roles_read_own ON public.user_roles;
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Houses
DROP POLICY IF EXISTS houses_read_related ON public.houses;
CREATE POLICY houses_read_related ON public.houses FOR SELECT TO authenticated
USING (app.can_view_house(auth.uid(), id));

DROP POLICY IF EXISTS houses_insert_owner ON public.houses;
CREATE POLICY houses_insert_owner ON public.houses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND app.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS houses_update_owner ON public.houses;
CREATE POLICY houses_update_owner ON public.houses FOR UPDATE TO authenticated
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS houses_delete_owner ON public.houses;
CREATE POLICY houses_delete_owner ON public.houses FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Tenant assignments
DROP POLICY IF EXISTS ta_read_related ON public.tenant_assignments;
CREATE POLICY ta_read_related ON public.tenant_assignments FOR SELECT TO authenticated
USING (tenant_id = auth.uid() OR app.owns_house(auth.uid(), house_id) OR app.has_role(auth.uid(), 'guard'));

DROP POLICY IF EXISTS ta_insert_tenant ON public.tenant_assignments;
CREATE POLICY ta_insert_tenant ON public.tenant_assignments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = tenant_id AND status = 'pending');

DROP POLICY IF EXISTS ta_update_owner_or_tenant ON public.tenant_assignments;
CREATE POLICY ta_update_owner_or_tenant ON public.tenant_assignments FOR UPDATE TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()))
WITH CHECK (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));

DROP POLICY IF EXISTS ta_delete_tenant ON public.tenant_assignments;
CREATE POLICY ta_delete_tenant ON public.tenant_assignments FOR DELETE TO authenticated
USING (auth.uid() = tenant_id);

-- Payments
DROP POLICY IF EXISTS payments_read_own_or_owner ON public.payments;
CREATE POLICY payments_read_own_or_owner ON public.payments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));

DROP POLICY IF EXISTS payments_insert_tenant ON public.payments;
CREATE POLICY payments_insert_tenant ON public.payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS payments_update_owner ON public.payments;
CREATE POLICY payments_update_owner ON public.payments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));

-- Maintenance requests
DROP POLICY IF EXISTS mr_read_own_or_owner ON public.maintenance_requests;
CREATE POLICY mr_read_own_or_owner ON public.maintenance_requests FOR SELECT TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));

DROP POLICY IF EXISTS mr_insert_tenant ON public.maintenance_requests;
CREATE POLICY mr_insert_tenant ON public.maintenance_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS mr_update_own_or_owner ON public.maintenance_requests;
CREATE POLICY mr_update_own_or_owner ON public.maintenance_requests FOR UPDATE TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()))
WITH CHECK (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));

DROP POLICY IF EXISTS mr_delete_tenant ON public.maintenance_requests;
CREATE POLICY mr_delete_tenant ON public.maintenance_requests FOR DELETE TO authenticated
USING (auth.uid() = tenant_id);

-- Announcements
DROP POLICY IF EXISTS ann_read_related ON public.announcements;
CREATE POLICY ann_read_related ON public.announcements FOR SELECT TO authenticated
USING (author_id = auth.uid() OR app.has_role(auth.uid(), 'guard') OR app.shares_house_with(auth.uid(), author_id));

DROP POLICY IF EXISTS ann_insert_owner ON public.announcements;
CREATE POLICY ann_insert_owner ON public.announcements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id AND app.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS ann_delete_author ON public.announcements;
CREATE POLICY ann_delete_author ON public.announcements FOR DELETE TO authenticated
USING (auth.uid() = author_id);

-- 12. Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Tenants can upload their own receipts" ON storage.objects;
CREATE POLICY "Tenants can upload their own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can read their own receipts" ON storage.objects;
CREATE POLICY "Users can read their own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 13. Backfill existing users into profiles and user_roles
INSERT INTO public.profiles (id, full_name, email, phone)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'phone', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT
  id,
  COALESCE((raw_user_meta_data->>'role')::public.app_role, 'tenant')
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;
