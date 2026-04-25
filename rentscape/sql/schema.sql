-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.amenities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT amenities_pkey PRIMARY KEY (id)
  
);
CREATE TABLE public.audit_log (
  id bigint NOT NULL DEFAULT nextval('audit_log_id_seq'::regclass),
  table_name text NOT NULL,
  operation USER-DEFINED NOT NULL,
  record_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.family_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lease_id uuid NOT NULL,
  full_name text NOT NULL,
  cnic text,
  relation USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT family_members_pkey PRIMARY KEY (id),
  CONSTRAINT family_members_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id)
);
CREATE TABLE public.leases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  monthly_rent numeric NOT NULL CHECK (monthly_rent >= 0::numeric),
  advance_amount numeric NOT NULL DEFAULT 0 CHECK (advance_amount >= 0::numeric),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_family boolean NOT NULL DEFAULT false,
  occupant_count integer NOT NULL DEFAULT 1 CHECK (occupant_count > 0),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::lease_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leases_pkey PRIMARY KEY (id),
  CONSTRAINT leases_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT leases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.maintenance_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  request_id uuid NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_images_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_images_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id)
);
CREATE TABLE public.maintenance_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority USER-DEFINED NOT NULL DEFAULT 'medium'::maint_priority,
  status USER-DEFINED NOT NULL DEFAULT 'open'::maint_status,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_requests_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT maintenance_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lease_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  due_date date NOT NULL,
  paid_date date,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  cnic text UNIQUE,
  address text,
  role USER-DEFINED NOT NULL DEFAULT 'tenant'::user_role,
  emergency_contact_name text,
  emergency_contact_phone text,
  police_verification_url text,
  police_verified boolean NOT NULL DEFAULT false,
  criminal_record_flag boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  landlord_id uuid NOT NULL,
  title text NOT NULL,
  city text NOT NULL,
  area text,
  property_type USER-DEFINED NOT NULL,
  total_units integer NOT NULL DEFAULT 1 CHECK (total_units > 0),
  max_occupants_per_unit integer NOT NULL DEFAULT 1 CHECK (max_occupants_per_unit > 0),
  location USER-DEFINED,
  status USER-DEFINED NOT NULL DEFAULT 'active'::property_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.property_amenities (
  property_id uuid NOT NULL,
  amenity_id uuid NOT NULL,
  CONSTRAINT property_amenities_pkey PRIMARY KEY (property_id, amenity_id),
  CONSTRAINT property_amenities_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT property_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id)
);
CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lease_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  target_id uuid NOT NULL,
  target_type USER-DEFINED NOT NULL,
  score smallint NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id),
  CONSTRAINT ratings_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT ratings_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.units (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL,
  unit_number text NOT NULL,
  floor integer,
  bedrooms integer NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
  bathrooms integer NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
  monthly_rent numeric NOT NULL CHECK (monthly_rent >= 0::numeric),
  is_available boolean NOT NULL DEFAULT true,
  advance_required boolean NOT NULL DEFAULT false,
  advance_months integer CHECK (advance_months IS NULL OR advance_months > 0),
  max_occupants integer NOT NULL DEFAULT 1 CHECK (max_occupants > 0),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);