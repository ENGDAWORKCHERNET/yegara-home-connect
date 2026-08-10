CREATE TYPE public.app_role AS ENUM ('owner','tenant','guard');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.payment_status AS ENUM ('pending','verified','late','paid');
CREATE TYPE public.trust_score AS ENUM ('high','medium','low');
CREATE TYPE public.maintenance_status AS ENUM ('pending','in_progress','resolved');
CREATE TYPE public.recurrence_type AS ENUM ('monthly','quarterly','yearly');

CREATE TABLE public.profiles (
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
CREATE POLICY "profiles_read_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.houses (
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
CREATE INDEX houses_owner_idx ON public.houses(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.houses TO authenticated;
GRANT ALL ON public.houses TO service_role;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "houses_read_authenticated" ON public.houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "houses_insert_owner" ON public.houses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(),'owner'));
CREATE POLICY "houses_update_owner" ON public.houses FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "houses_delete_owner" ON public.houses FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER houses_updated_at BEFORE UPDATE ON public.houses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tenant_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ta_house_idx ON public.tenant_assignments(house_id);
CREATE INDEX ta_tenant_idx ON public.tenant_assignments(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_assignments TO authenticated;
GRANT ALL ON public.tenant_assignments TO service_role;
ALTER TABLE public.tenant_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ta_read_authenticated" ON public.tenant_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ta_insert_tenant" ON public.tenant_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id AND status = 'pending');
CREATE POLICY "ta_update_owner_or_tenant" ON public.tenant_assignments FOR UPDATE TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()))
WITH CHECK (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));
CREATE POLICY "ta_delete_tenant" ON public.tenant_assignments FOR DELETE TO authenticated USING (auth.uid() = tenant_id);
CREATE TRIGGER ta_updated_at BEFORE UPDATE ON public.tenant_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
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
CREATE INDEX payments_house_idx ON public.payments(house_id);
CREATE INDEX payments_tenant_idx ON public.payments(tenant_id);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_read_own_or_owner" ON public.payments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));
CREATE POLICY "payments_insert_tenant" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "payments_update_owner" ON public.payments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));

CREATE TABLE public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  image_path text,
  status public.maintenance_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mr_house_idx ON public.maintenance_requests(house_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_read_own_or_owner" ON public.maintenance_requests FOR SELECT TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));
CREATE POLICY "mr_insert_tenant" ON public.maintenance_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "mr_update_own_or_owner" ON public.maintenance_requests FOR UPDATE TO authenticated
USING (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()))
WITH CHECK (auth.uid() = tenant_id OR EXISTS (SELECT 1 FROM public.houses h WHERE h.id = house_id AND h.owner_id = auth.uid()));
CREATE POLICY "mr_delete_tenant" ON public.maintenance_requests FOR DELETE TO authenticated USING (auth.uid() = tenant_id);
CREATE TRIGGER mr_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_read_authenticated" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_insert_owner" ON public.announcements FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(),'owner'));
CREATE POLICY "ann_delete_author" ON public.announcements FOR DELETE TO authenticated USING (auth.uid() = author_id);