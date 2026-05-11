
-- 1. generate_monthly_invoices()

CREATE OR REPLACE FUNCTION generate_monthly_invoices()
RETURNS INTEGER AS $$
DECLARE
  lease_record RECORD;
  invoice_count INTEGER := 0;
  current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  FOR lease_record IN
    SELECT l.id, l.monthly_rent
    FROM leases l
    WHERE l.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.lease_id = l.id
      AND date_trunc('month', p.due_date)::DATE = current_month  -- explicit cast
    )
  LOOP
    INSERT INTO payments (lease_id, amount, due_date, status)
    VALUES (
      lease_record.id,
      lease_record.monthly_rent,
      current_month,          -- due on the 1st, not the 5th
      'pending'
    );
    invoice_count := invoice_count + 1;
  END LOOP;
  RETURN invoice_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;



-- 2. mark_overdue_payments()  — 9-day grace period (late after 10th)

CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE payments
  SET status = 'overdue'
  WHERE status = 'pending'
  AND due_date + INTERVAL '9 days' < CURRENT_DATE;  -- grace period

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;



-- 3. expire_ended_leases()  — set-based, not a loop

CREATE OR REPLACE FUNCTION expire_ended_leases()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE leases
    SET status = 'expired'
    WHERE status = 'active'
      AND end_date < CURRENT_DATE
    RETURNING id, unit_id
  )
  UPDATE units
  SET is_available = TRUE
  WHERE id IN (SELECT unit_id FROM expired);

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;



-- 4. get_landlord_income_summary()  — fixed expected calculation

CREATE OR REPLACE FUNCTION get_landlord_income_summary(
  p_landlord_id UUID,
  p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
  month DATE,
  expected NUMERIC,
  collected NUMERIC,
  overdue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('month', p.due_date)::DATE AS month,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status != 'waived'), 0) AS expected,  -- all billed
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0)    AS collected,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'overdue'), 0) AS overdue
  FROM payments p
  JOIN leases l ON p.lease_id = l.id
  JOIN units u ON l.unit_id = u.id
  JOIN properties pr ON u.property_id = pr.id
  WHERE pr.landlord_id = p_landlord_id
  AND p.due_date >= CURRENT_DATE - (p_months_back * INTERVAL '1 month')  -- safer interval
  GROUP BY date_trunc('month', p.due_date)
  ORDER BY month;
END;
$$ LANGUAGE plpgsql;



-- 5. enforce_payment_due_date trigger — add OR UPDATE

DROP TRIGGER IF EXISTS enforce_payment_due_date ON payments;

CREATE OR REPLACE FUNCTION check_payment_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM leases
    WHERE id = NEW.lease_id
    AND NEW.due_date BETWEEN start_date AND end_date
  ) THEN
    RAISE EXCEPTION 'Payment due date % is outside lease period', NEW.due_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_payment_due_date
BEFORE INSERT OR UPDATE ON payments          -- was INSERT only
FOR EACH ROW EXECUTE FUNCTION check_payment_due_date();



-- pg_cron schedule (run once you have pg_cron enabled) to automate running these procedures

SELECT cron.schedule('generate-invoices', '0 0 1 * *',  'SELECT generate_monthly_invoices()');
SELECT cron.schedule('mark-overdue',      '0 1 * * *',   'SELECT mark_overdue_payments()');
SELECT cron.schedule('expire-leases',     '0 2 * * *',   'SELECT expire_ended_leases()');

-- tests
-- Should return number of invoices created
SELECT generate_monthly_invoices();

-- Should return number of payments marked overdue
SELECT mark_overdue_payments();

-- Should return number of leases expired
SELECT expire_ended_leases();

SELECT id, tenant_id, end_date, status 
FROM leases 
where tenant_id='8f7fcd3d-88ae-4e48-a2ee-c0fd8304b3a6'
ORDER BY end_date;


-- Should return monthly income breakdown
SELECT * FROM get_landlord_income_summary('e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c', 6);
-- inserting to test
INSERT INTO leases (unit_id, tenant_id, monthly_rent, advance_amount,
                    start_date, end_date, is_family, occupant_count, status)
VALUES (
  'cc000000-0000-0000-0000-000000000003',  -- A-201 (available)
  '4146c99b-0ff7-4b20-9bfd-dff95343a02c', -- Hassan Raza
  35000.00, 0.00,
  '2026-01-01', '2027-01-01',
  FALSE, 1, 'active'
);

SELECT generate_monthly_invoices();

--test
DROP INDEX IF EXISTS idx_properties_location;
EXPLAIN ANALYZE
SELECT id, title,
  ST_Distance(location, ST_MakePoint(73.0551, 33.7295)::geography) as dist
FROM properties
WHERE ST_DWithin(location, ST_MakePoint(73.0551, 33.7295)::geography, 5000)
ORDER BY dist;

CREATE INDEX idx_properties_location
ON properties
USING GIST (location);

--more constraints and triggers for them
--a landlord cant lease their own property to themselves
CREATE OR REPLACE FUNCTION check_tenant_not_landlord()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.id = NEW.unit_id
        AND p.landlord_id = NEW.tenant_id
    ) THEN
        RAISE EXCEPTION 'Landlord cannot be a tenant on their own property';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_tenant_not_landlord
BEFORE INSERT OR UPDATE ON leases
FOR EACH ROW EXECUTE FUNCTION check_tenant_not_landlord();

--Occupant count can't exceed unit max
CREATE OR REPLACE FUNCTION check_occupant_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.occupant_count > (SELECT max_occupants FROM units WHERE id = NEW.unit_id) THEN
        RAISE EXCEPTION 'Occupant count exceeds unit maximum';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_occupant_limit
BEFORE INSERT OR UPDATE ON leases
FOR EACH ROW EXECUTE FUNCTION check_occupant_limit();

-- Payment due dates should fall within lease period
CREATE OR REPLACE FUNCTION check_payment_due_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM leases
        WHERE id = NEW.lease_id
        AND NEW.due_date BETWEEN start_date AND end_date
    ) THEN
        RAISE EXCEPTION 'Payment due date is outside lease period';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_payment_due_date
BEFORE INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION check_payment_due_date();


--Rating only after lease is active/expired
CREATE OR REPLACE FUNCTION check_rating_lease_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM leases
        WHERE id = NEW.lease_id
        AND status IN ('expired', 'terminated')
    ) THEN
        RAISE EXCEPTION 'Can only rate expired or terminated leases';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_rating_lease_status
BEFORE INSERT ON ratings
FOR EACH ROW EXECUTE FUNCTION check_rating_lease_status();

ALTER TABLE ratings DROP CONSTRAINT ratings_target_id_fkey;

-- BEFORE trigger: just sets app_metadata
CREATE OR REPLACE FUNCTION public.set_user_app_metadata()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  IF user_role IS NULL OR user_role NOT IN ('tenant', 'landlord', 'admin') THEN
    user_role := 'tenant';
  END IF;

  NEW.raw_app_meta_data :=
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', user_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_before_created ON auth.users;

CREATE TRIGGER on_auth_user_before_created
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.set_user_app_metadata();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

SELECT * FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 5;
-- Check if the user was created in auth.users
SELECT id, email, raw_user_meta_data, raw_app_meta_data, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;
select * from profiles where id='a8e23f46-87a1-4435-bd10-95c9655cc346';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_app_meta_data->>'role', 'tenant');

  INSERT INTO public.profiles (
    id, role, full_name, phone, cnic,
    address, emergency_contact_name, emergency_contact_phone
  )
  VALUES (
    NEW.id,
    user_role::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'cnic',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'emergency_contact_name',
    NEW.raw_user_meta_data->>'emergency_contact_phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    role      = EXCLUDED.role,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user failed for %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;