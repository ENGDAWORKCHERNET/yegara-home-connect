-- ============================================================
-- Notification System — Phase 4: Database Triggers
-- ============================================================

-- ------------------------------------------------------------
-- Trigger 1: New payment uploaded -> notify owner
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_payment_receipt_uploaded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_house_number text;
  v_tenant_name text;
BEGIN
  -- Only create notification if receipt_path is present
  IF NEW.receipt_path IS NOT NULL AND TRIM(NEW.receipt_path) <> '' THEN
    BEGIN
      SELECT owner_id, house_number
      INTO v_owner_id, v_house_number
      FROM public.houses
      WHERE id = NEW.house_id;

      SELECT full_name
      INTO v_tenant_name
      FROM public.profiles
      WHERE id = NEW.tenant_id;

      v_tenant_name := COALESCE(NULLIF(TRIM(v_tenant_name), ''), 'A tenant');
      v_house_number := COALESCE(NULLIF(TRIM(v_house_number), ''), 'a house');

      IF v_owner_id IS NOT NULL THEN
        PERFORM public.create_notification(
          v_owner_id,
          'New receipt uploaded',
          v_tenant_name || ' uploaded a receipt for ' || v_house_number,
          'receipt_uploaded',
          '/payments'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Safe fallback: never block the original insert
      RAISE WARNING 'handle_payment_receipt_uploaded failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_payment_receipt_uploaded ON public.payments;
CREATE TRIGGER on_payment_receipt_uploaded
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payment_receipt_uploaded();

-- ------------------------------------------------------------
-- Trigger 2: New maintenance request -> notify owner
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_maintenance_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_house_number text;
  v_tenant_name text;
BEGIN
  BEGIN
    SELECT owner_id, house_number
    INTO v_owner_id, v_house_number
    FROM public.houses
    WHERE id = NEW.house_id;

    SELECT full_name
    INTO v_tenant_name
    FROM public.profiles
    WHERE id = NEW.tenant_id;

    v_tenant_name := COALESCE(NULLIF(TRIM(v_tenant_name), ''), 'A tenant');
    v_house_number := COALESCE(NULLIF(TRIM(v_house_number), ''), 'a house');

    IF v_owner_id IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner_id,
        'New maintenance request',
        v_tenant_name || ' submitted a maintenance request for ' || v_house_number,
        'maintenance_request',
        '/maintenance'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Safe fallback: never block the original insert
    RAISE WARNING 'handle_maintenance_request_created failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_maintenance_request_created ON public.maintenance_requests;
CREATE TRIGGER on_maintenance_request_created
  AFTER INSERT ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_maintenance_request_created();

-- ------------------------------------------------------------
-- Trigger 3: New announcement -> notify all tenants
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_announcement_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name text;
  r RECORD;
BEGIN
  BEGIN
    SELECT full_name
    INTO v_author_name
    FROM public.profiles
    WHERE id = NEW.author_id;

    v_author_name := COALESCE(NULLIF(TRIM(v_author_name), ''), 'Property Owner');

    FOR r IN
      SELECT DISTINCT user_id
      FROM public.user_roles
      WHERE role = 'tenant' AND user_id != NEW.author_id
    LOOP
      PERFORM public.create_notification(
        r.user_id,
        'New announcement',
        v_author_name || ' posted: ' || NEW.title,
        'announcement',
        '/announcements'
      );
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- Safe fallback: never block the original insert
    RAISE WARNING 'handle_announcement_created failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_announcement_created();
