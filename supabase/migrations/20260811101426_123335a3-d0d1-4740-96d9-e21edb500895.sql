CREATE SCHEMA IF NOT EXISTS app;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

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

REVOKE ALL ON FUNCTION app.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.owns_house(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.can_view_house(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.shares_house_with(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.owns_house(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.can_view_house(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.shares_house_with(uuid, uuid) TO authenticated, service_role;

-- profiles
DROP POLICY IF EXISTS profiles_read_authenticated ON public.profiles;
CREATE POLICY profiles_read_related ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR app.has_role(auth.uid(), 'guard')
  OR app.shares_house_with(auth.uid(), id)
);

-- user_roles
DROP POLICY IF EXISTS user_roles_read_authenticated ON public.user_roles;
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- houses
DROP POLICY IF EXISTS houses_read_authenticated ON public.houses;
CREATE POLICY houses_read_related ON public.houses FOR SELECT TO authenticated
USING (app.can_view_house(auth.uid(), id));
DROP POLICY IF EXISTS houses_insert_owner ON public.houses;
CREATE POLICY houses_insert_owner ON public.houses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND app.has_role(auth.uid(), 'owner'));

-- tenant_assignments
DROP POLICY IF EXISTS ta_read_authenticated ON public.tenant_assignments;
CREATE POLICY ta_read_related ON public.tenant_assignments FOR SELECT TO authenticated
USING (
  tenant_id = auth.uid()
  OR app.owns_house(auth.uid(), house_id)
  OR app.has_role(auth.uid(), 'guard')
);

-- announcements
DROP POLICY IF EXISTS ann_read_authenticated ON public.announcements;
CREATE POLICY ann_read_related ON public.announcements FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR app.has_role(auth.uid(), 'guard')
  OR app.shares_house_with(auth.uid(), author_id)
);
DROP POLICY IF EXISTS ann_insert_owner ON public.announcements;
CREATE POLICY ann_insert_owner ON public.announcements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id AND app.has_role(auth.uid(), 'owner'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);