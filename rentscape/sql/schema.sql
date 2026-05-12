-- Rental Management System — PostgreSQL / Supabase Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ENUMS

CREATE TYPE user_role        AS ENUM ('tenant', 'landlord', 'admin');
CREATE TYPE property_status  AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE property_type    AS ENUM ('apartment', 'house', 'room', 'commercial', 'other');
CREATE TYPE lease_status     AS ENUM ('pending', 'active', 'expired', 'terminated');
CREATE TYPE payment_status   AS ENUM ('pending', 'paid', 'overdue', 'waived');
CREATE TYPE maint_priority   AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE maint_status     AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE target_type      AS ENUM ('property', 'landlord', 'tenant');
CREATE TYPE audit_operation  AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE family_relation  AS ENUM ('spouse', 'child', 'parent', 'other');

-- USERS

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    cnic TEXT UNIQUE,          -- National ID
    address TEXT,
    role user_role NOT NULL DEFAULT 'tenant',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    police_verification_url TEXT,                 -- nullable
    police_verified BOOLEAN NOT NULL DEFAULT FALSE,
    criminal_record_flag BOOLEAN NOT NULL DEFAULT FALSE,  -- admin-set
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROPERTIES
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT,
    property_type property_type NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 1 CHECK (total_units > 0),
    max_occupants_per_unit INTEGER NOT NULL DEFAULT 1 CHECK (max_occupants_per_unit > 0),
    location GEOGRAPHY(POINT, 4326),        -- PostGIS POINT
    status property_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_landlord  ON properties(landlord_id);
CREATE INDEX idx_properties_location  ON properties USING GIST(location);
CREATE INDEX idx_properties_status    ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);

CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE property_amenities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,

    PRIMARY KEY (property_id, amenity_id)
);

CREATE INDEX idx_property_amenities_property
ON property_amenities(property_id);

CREATE INDEX idx_property_amenities_amenity
ON property_amenities(amenity_id);

-- UNITS
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    floor INTEGER,
    bedrooms INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms INTEGER NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
    monthly_rent NUMERIC(12, 2) NOT NULL CHECK (monthly_rent >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    advance_required BOOLEAN NOT NULL DEFAULT FALSE,
    advance_months INTEGER,  -- only if advance_required
    max_occupants INTEGER NOT NULL DEFAULT 1 CHECK (max_occupants > 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (property_id, unit_number),
     CONSTRAINT chk_advance_months_logic CHECK (
        (advance_required = FALSE AND advance_months IS NULL)
        OR
        (advance_required = TRUE AND advance_months IS NOT NULL)
    ),
    CONSTRAINT chk_advance_months_positive CHECK (advance_months IS NULL OR advance_months > 0)
);

CREATE INDEX idx_units_property    ON units(property_id);
CREATE INDEX idx_units_available   ON units(is_available);

-- LEASES
CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    monthly_rent NUMERIC(12, 2) NOT NULL CHECK (monthly_rent >= 0),
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_family BOOLEAN NOT NULL DEFAULT FALSE,
    occupant_count INTEGER NOT NULL DEFAULT 1 CHECK (occupant_count > 0),
    status lease_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date)
);

CREATE INDEX idx_leases_unit      ON leases(unit_id);
CREATE INDEX idx_leases_tenant    ON leases(tenant_id);
CREATE INDEX idx_leases_status    ON leases(status);

-- FAMILY MEMBERS
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    cnic TEXT,
    relation family_relation NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_lease ON family_members(lease_id);

-- PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_lease   ON payments(lease_id);
CREATE INDEX idx_payments_status  ON payments(status);
CREATE INDEX idx_payments_due     ON payments(due_date);
ALTER TABLE payments
ADD CONSTRAINT unique_lease_due UNIQUE (lease_id, due_date);
-- MAINTENANCE REQUESTS
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    priority maint_priority NOT NULL DEFAULT 'medium',
    status maint_status NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maint_unit    ON maintenance_requests(unit_id);
CREATE INDEX idx_maint_tenant  ON maintenance_requests(tenant_id);
CREATE INDEX idx_maint_status  ON maintenance_requests(status);

CREATE TABLE maintenance_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_images_request
ON maintenance_images(request_id);
-- RATINGS
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    target_type target_type NOT NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- One rating per reviewer per target per lease
    UNIQUE (lease_id, reviewer_id, target_id, target_type)
);

CREATE INDEX idx_ratings_lease     ON ratings(lease_id);
CREATE INDEX idx_ratings_reviewer  ON ratings(reviewer_id);
CREATE INDEX idx_ratings_target    ON ratings(target_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_units_rent ON units(monthly_rent);
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
--helper function
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- AUDIT LOG
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation audit_operation NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_one_active_lease_per_unit
ON leases(unit_id) WHERE status = 'active';
CREATE INDEX idx_audit_table     ON audit_log(table_name);
CREATE INDEX idx_audit_record    ON audit_log(record_id);
CREATE INDEX idx_audit_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC);

CREATE INDEX idx_leases_unit_tenant ON leases(unit_id, tenant_id);

CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_images_property ON property_images(property_id);
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view property images
CREATE POLICY "Public can view property images"
ON property_images FOR SELECT
USING (true);

-- Landlord can insert images for their own properties
CREATE POLICY "Landlord can insert property images"
ON property_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_images.property_id
    AND p.landlord_id = current_user_id()
  )
);

-- Landlord can delete their own property images
CREATE POLICY "Landlord can delete property images"
ON property_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = property_images.property_id
    AND p.landlord_id = current_user_id()
  )
);

-- Admin bypass
CREATE POLICY "Admin full access"
ON property_images FOR ALL
USING (is_admin()) WITH CHECK (is_admin());

-- Helper to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;

-- ROW LEVEL SECURITY (RLS) — Supabase-ready stubs
-- Enable RLS on all tables; add your own policies on top of these.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_properties
BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_units
BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_leases
BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_payments
BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_maintenance
BEFORE UPDATE ON maintenance_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view family members"
ON family_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM leases l
        WHERE l.id = family_members.lease_id
        AND l.tenant_id = current_user_id()
    )
);

-- Tenant can add family members to their own lease
CREATE POLICY "Tenant can insert family members"
ON family_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM leases l
        WHERE l.id = family_members.lease_id
        AND l.tenant_id = current_user_id()
    )
);

-- Landlord should be able to see family members on their properties
CREATE POLICY "Landlord can view family members"
ON family_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE l.id = family_members.lease_id
        AND p.landlord_id = current_user_id()
    )
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can view own payments"
ON payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM leases l
        WHERE l.id = payments.lease_id
        AND l.tenant_id = current_user_id()
    )
);

CREATE POLICY "Landlord can create payments"
ON payments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE l.id = payments.lease_id
        AND p.landlord_id = current_user_id()
    )
);

-- Landlord can't currently view payments on their properties
CREATE POLICY "Landlord can view payments"
ON payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE l.id = payments.lease_id
        AND p.landlord_id = current_user_id()
    )
);

CREATE POLICY "Landlord can update payments"
ON payments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE l.id = payments.lease_id
        AND p.landlord_id = current_user_id()
    )
)
with check(
    EXISTS (
        SELECT 1 FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE l.id = payments.lease_id
        AND p.landlord_id = current_user_id()
    )
);

ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only audit access"
ON audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = current_user_id()
        AND role = 'admin'
    )
);
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant can create request"
ON maintenance_requests FOR INSERT
WITH CHECK (tenant_id = current_user_id());

CREATE POLICY "Tenant can view own requests"
ON maintenance_requests FOR SELECT
USING (tenant_id = current_user_id());

CREATE POLICY "Landlord can view maintenance requests"
ON maintenance_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.id = maintenance_requests.unit_id
        AND p.landlord_id = current_user_id()
    )
);

-- Tenant can update their own requests (e.g. add details, close)
CREATE POLICY "Tenant can update own requests"
ON maintenance_requests FOR UPDATE
USING (tenant_id = current_user_id())
WITH CHECK (tenant_id = current_user_id());

-- Landlord can update requests on their properties (change status)
CREATE POLICY "Landlord can update maintenance requests"
ON maintenance_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.id = maintenance_requests.unit_id
        AND p.landlord_id = current_user_id()
    )
)
with check(
    EXISTS (
        SELECT 1 FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.id = maintenance_requests.unit_id
        AND p.landlord_id = current_user_id()
    )
);

ALTER TABLE ratings              ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can rate via lease"
ON ratings
FOR INSERT
WITH CHECK (
    reviewer_id = current_user_id()
    AND EXISTS (
        SELECT 1
        FROM leases l
        JOIN units u ON u.id = l.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE l.id = ratings.lease_id
        AND (
            (l.tenant_id = current_user_id() AND ratings.target_id = p.landlord_id)
            OR
            (p.landlord_id = current_user_id() AND ratings.target_id = l.tenant_id)
        )
    )
);

CREATE POLICY "Users can view ratings"
ON ratings FOR SELECT
USING (reviewer_id = current_user_id() OR target_id = current_user_id());

-- policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = current_user_id());

-- New users need to be able to create their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (id = current_user_id());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = current_user_id())

WITH CHECK (id = current_user_id()); ;

CREATE POLICY "Landlord can view tenant profiles"
   ON profiles FOR SELECT
   USING (
       id = current_user_id()
       OR EXISTS (
           SELECT 1 FROM leases l
           JOIN units u ON u.id = l.unit_id
           JOIN properties p ON p.id = u.property_id
           WHERE l.tenant_id = profiles.id
           AND p.landlord_id = current_user_id()
       )
   );
-- policies for properties


ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlord can insert property"
ON properties FOR INSERT
WITH CHECK (
    landlord_id = current_user_id()
);

CREATE POLICY "View properties"
ON properties FOR SELECT
USING (
    status = 'active'
    OR landlord_id = current_user_id()
);

CREATE POLICY "Landlord can delete own properties"
ON properties FOR DELETE
USING (landlord_id = current_user_id());

CREATE POLICY "Landlord can update own properties"
ON properties FOR UPDATE
USING (
    landlord_id = current_user_id()
)
WITH CHECK (landlord_id = current_user_id());
-- policies for units
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view available units"
ON units FOR SELECT
USING (
    is_available = true
    OR EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = units.property_id
        AND p.landlord_id = current_user_id()
    )
);

CREATE POLICY "Landlord can insert units"
ON units FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = units.property_id
        AND p.landlord_id = current_user_id()
    )
);

CREATE POLICY "Landlord can update units"
ON units FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = units.property_id
        AND p.landlord_id = current_user_id()
    )
)
with check(
    EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = units.property_id
        AND p.landlord_id = current_user_id()
    )
);

CREATE POLICY "Landlord can delete units"
ON units FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = units.property_id
        AND p.landlord_id = current_user_id()
    )
);
-- policies for leases
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlord can manage leases"
ON leases FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.id = leases.unit_id
        AND p.landlord_id = current_user_id()
    )
)
with check (
    EXISTS (
        SELECT 1
        FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.id = leases.unit_id
        AND p.landlord_id = current_user_id()
    )
);
CREATE POLICY "Tenant can view own leases"
ON leases FOR SELECT
USING (tenant_id = current_user_id());


-- RLS FOR AMENITIES


ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- Anyone can view amenities (they're just a reference list)
CREATE POLICY "Public can view amenities"
ON amenities FOR SELECT
USING (true);

-- Only admins can manage amenities
CREATE POLICY "Admin full access"
ON amenities FOR ALL
USING (is_admin()) WITH CHECK (is_admin());


-- RLS FOR PROPERTY AMENITIES


ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;

-- Anyone can view property amenities (needed to see what a property offers)
CREATE POLICY "Public can view property amenities"
ON property_amenities FOR SELECT
USING (true);

-- Landlord can manage amenities on their own properties
CREATE POLICY "Landlord can insert property amenities"
ON property_amenities FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = property_amenities.property_id
        AND p.landlord_id = current_user_id()
    )
);

CREATE POLICY "Landlord can delete property amenities"
ON property_amenities FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM properties p
        WHERE p.id = property_amenities.property_id
        AND p.landlord_id = current_user_id()
    )
);

-- Admin bypass
CREATE POLICY "Admin full access"
ON property_amenities FOR ALL
USING (is_admin()) WITH CHECK (is_admin());

-- Admin bypass policies
CREATE POLICY "Admin full access" ON profiles       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON properties     FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON units          FOR ALL USING (is_admin())  WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON leases         FOR ALL USING (is_admin())  WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON payments       FOR ALL USING (is_admin())  WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON maintenance_requests FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON ratings        FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin full access" ON family_members FOR ALL USING (is_admin()) WITH CHECK (is_admin());



ALTER TABLE maintenance_images ENABLE ROW LEVEL SECURITY;

-- Tenant can insert images for their own requests
CREATE POLICY "Tenant can insert maintenance images"
ON maintenance_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM maintenance_requests mr
        WHERE mr.id = maintenance_images.request_id
        AND mr.tenant_id = current_user_id()
    )
);

-- Tenant can view images on their own requests
CREATE POLICY "Tenant can view maintenance images"
ON maintenance_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM maintenance_requests mr
        WHERE mr.id = maintenance_images.request_id
        AND mr.tenant_id = current_user_id()
    )
);

-- Landlord can view images on their properties
CREATE POLICY "Landlord can view maintenance images"
ON maintenance_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM maintenance_requests mr
        JOIN units u ON u.id = mr.unit_id
        JOIN properties p ON p.id = u.property_id
        WHERE mr.id = maintenance_images.request_id
        AND p.landlord_id = current_user_id()
    )
);

-- Admin bypass
CREATE POLICY "Admin full access"
ON maintenance_images FOR ALL
USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        operation,
        record_id,
        old_data,
        new_data,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        CASE TG_OP
          WHEN 'INSERT' THEN 'INSERT'
          WHEN 'UPDATE' THEN 'UPDATE'
          WHEN 'DELETE' THEN 'DELETE'
        END::audit_operation,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        to_jsonb(OLD),
        to_jsonb(NEW),
        current_user_id()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_audit
AFTER INSERT OR UPDATE OR DELETE ON properties
FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER leases_audit
AFTER INSERT OR UPDATE OR DELETE ON leases
FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER maintenance_audit
AFTER INSERT OR UPDATE OR DELETE ON maintenance_requests
FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER ratings_audit
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER payments_audit
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION audit_changes();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT INSERT ON TABLE public.profiles TO supabase_auth_admin;

ALTER TABLE profiles
ALTER COLUMN cnic SET NOT NULL;

-- new handle user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Extract and validate role
  user_role := NEW.raw_user_meta_data->>'role';
  IF user_role IS NULL OR user_role NOT IN ('tenant', 'landlord', 'admin') THEN
    user_role := 'tenant';
  END IF;

  -- Modify the row in-flight (safe + correct in BEFORE INSERT)
  NEW.raw_app_meta_data :=
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', user_role);

  -- Upsert profile
  INSERT INTO public.profiles (
    id, email, role, full_name, phone, cnic,
    address, emergency_contact_name, emergency_contact_phone
  )
  VALUES (
    NEW.id,
    NEW.email,
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
    email     = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone     = COALESCE(EXCLUDED.phone,     profiles.phone),
    cnic      = COALESCE(EXCLUDED.cnic,      profiles.cnic),
    address   = COALESCE(EXCLUDED.address,   profiles.address),
    emergency_contact_name  = COALESCE(EXCLUDED.emergency_contact_name,  profiles.emergency_contact_name),
    emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, profiles.emergency_contact_phone),
    updated_at = NOW();

  RETURN NEW;

EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user failed for %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();