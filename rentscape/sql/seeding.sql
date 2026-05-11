

--  SAFE SEED — works on a DB that already has some data
--  - auth.users: inserts only if UID doesn't exist yet
--  - profiles:   upserts (updates existing, inserts new)
--  - everything else: INSERT ... ON CONFLICT DO NOTHING



-- AUTH USERS — skips rows whose UID already exists


INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  role, aud, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
VALUES
  -- Admins
  (
    '57e1eb47-fc61-455e-8eb1-6be0ce38c234',
    '00000000-0000-0000-0000-000000000000',
    'admin1@rentscape.com',
    crypt('Admin@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Super Admin","role":"admin"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '8a3195fe-4409-4c68-b1c1-9bac5f162c49',
    '00000000-0000-0000-0000-000000000000',
    'admin2@rentscape.com',
    crypt('Admin@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"System Admin","role":"admin"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  -- Landlords
  (
    'e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c',
    '00000000-0000-0000-0000-000000000000',
    'landlord1@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Ahmed Khan","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'f4d5c169-9df0-47f6-8405-995bbd7a553b',
    '00000000-0000-0000-0000-000000000000',
    'landlord2@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Fatima Malik","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '02cab039-e455-417e-9581-ba7ed06a449f',
    '00000000-0000-0000-0000-000000000000',
    'landlord3@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Usman Siddiqui","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'landlord4@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Zainab Hussain","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'landlord5@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Kamran Sheikh","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'landlord6@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Saima Baig","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'landlord7@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Tariq Butt","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'a1b2c3d4-0001-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'landlord8@rentscape.com',
    crypt('Landlord@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Nadia Qureshi","role":"landlord"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  -- Tenants
  (
    '8f7fcd3d-88ae-4e48-a2ee-c0fd8304b3a6',
    '00000000-0000-0000-0000-000000000000',
    'tenant1@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Bilal Ahmed","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '17f1329d-2bb0-48a8-91e2-6f85716a7432',
    '00000000-0000-0000-0000-000000000000',
    'tenant2@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Sana Iqbal","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '8708c6ad-8195-4e63-81d6-d8ef8d1ef202',
    '00000000-0000-0000-0000-000000000000',
    'tenant3@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Tariq Mehmood","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '8c052e4a-62ac-4a69-ad4c-d043f58d0c91',
    '00000000-0000-0000-0000-000000000000',
    'tenant4@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Rabia Noor","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    '4146c99b-0ff7-4b20-9bfd-dff95343a02c',
    '00000000-0000-0000-0000-000000000000',
    'tenant5@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Hassan Raza","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'tenant6@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Ayesha Farooq","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'tenant7@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Umar Farhan","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'tenant8@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Maryam Tahir","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'tenant9@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Faisal Latif","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'tenant10@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Hira Saleem","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000000',
    'tenant11@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Zahid Nawaz","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000000',
    'tenant12@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Amna Riaz","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000000',
    'tenant13@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Shoaib Malik","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000000',
    'tenant14@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Nida Cheema","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  ),
  (
    'b1c2d3e4-0002-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000000',
    'tenant15@rentscape.com',
    crypt('Tenant@1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"full_name":"Arslan Ghani","role":"tenant"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated', 'authenticated', '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;  -- skip if UID already exists


-- PROFILES — upsert: update existing, insert new
--    The handle_new_user trigger creates a bare profile on
--    auth.users insert, so we upsert to fill all fields.


INSERT INTO profiles (
  id, full_name, phone, cnic, address, role,
  emergency_contact_name, emergency_contact_phone,
  police_verified, criminal_record_flag, is_active
)
VALUES
  -- Admins
  ('57e1eb47-fc61-455e-8eb1-6be0ce38c234', 'Super Admin',     '+923001234567', '35201-1234567-1', 'Admin HQ, Islamabad',     'admin',    'Admin Contact',   '+923001234568', TRUE,  FALSE, TRUE),
  ('8a3195fe-4409-4c68-b1c1-9bac5f162c49', 'System Admin',    '+923001234569', '35201-1234567-2', 'Admin HQ, Lahore',        'admin',    'Admin Contact 2', '+923001234570', TRUE,  FALSE, TRUE),
  -- Landlords
  ('e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c', 'Ahmed Khan',      '+923011111111', '35202-1111111-1', 'Garden Town, Lahore',     'landlord', 'Ali Khan',        '+923011111112', TRUE,  FALSE, TRUE),
  ('f4d5c169-9df0-47f6-8405-995bbd7a553b', 'Fatima Malik',    '+923022222222', '35202-2222222-2', 'F-7, Islamabad',          'landlord', 'Hina Malik',      '+923022222223', TRUE,  FALSE, TRUE),
  ('02cab039-e455-417e-9581-ba7ed06a449f', 'Usman Siddiqui',  '+923033333333', '35202-3333333-3', 'Clifton, Karachi',        'landlord', 'Zara Siddiqui',   '+923033333334', FALSE, FALSE, TRUE),
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Zainab Hussain',  '+923041234567', '35202-4444444-4', 'DHA Phase 2, Islamabad',  'landlord', 'Kashif Hussain',  '+923041234568', TRUE,  FALSE, TRUE),
  ('a1b2c3d4-0001-0000-0000-000000000002', 'Kamran Sheikh',   '+923051234567', '35202-5555555-5', 'Gulberg III, Lahore',     'landlord', 'Nadia Sheikh',    '+923051234568', TRUE,  FALSE, TRUE),
  ('a1b2c3d4-0001-0000-0000-000000000003', 'Saima Baig',      '+923061234567', '35202-6666666-6', 'Model Town, Lahore',      'landlord', 'Imran Baig',      '+923061234568', TRUE,  FALSE, TRUE),
  ('a1b2c3d4-0001-0000-0000-000000000004', 'Tariq Butt',      '+923071234567', '35202-7777777-7', 'G-11, Islamabad',         'landlord', 'Rania Butt',      '+923071234568', FALSE, FALSE, TRUE),
  ('a1b2c3d4-0001-0000-0000-000000000005', 'Nadia Qureshi',   '+923081234567', '35202-8888888-8', 'Johar Town, Lahore',      'landlord', 'Adnan Qureshi',   '+923081234568', TRUE,  FALSE, TRUE),
  -- Tenants
  ('8f7fcd3d-88ae-4e48-a2ee-c0fd8304b3a6', 'Bilal Ahmed',     '+923044444444', '35203-4444444-4', 'Johar Town, Lahore',      'tenant',   'Sara Ahmed',      '+923044444445', TRUE,  FALSE, TRUE),
  ('17f1329d-2bb0-48a8-91e2-6f85716a7432', 'Sana Iqbal',      '+923055555555', '35203-5555555-5', 'G-10, Islamabad',         'tenant',   'Amir Iqbal',      '+923055555556', TRUE,  FALSE, TRUE),
  ('8708c6ad-8195-4e63-81d6-d8ef8d1ef202', 'Tariq Mehmood',   '+923066666666', '35203-6666666-6', 'DHA Phase 2, Karachi',    'tenant',   'Asma Mehmood',    '+923066666667', FALSE, FALSE, TRUE),
  ('8c052e4a-62ac-4a69-ad4c-d043f58d0c91', 'Rabia Noor',      '+923077777777', '35203-7777777-7', 'Bahria Town, Lahore',     'tenant',   'Nadia Noor',      '+923077777778', TRUE,  FALSE, TRUE),
  ('4146c99b-0ff7-4b20-9bfd-dff95343a02c', 'Hassan Raza',     '+923088888888', '35203-8888888-8', 'Gulshan-e-Iqbal, Karachi','tenant',   'Imran Raza',      '+923088888889', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000001', 'Ayesha Farooq',   '+923091234567', '35203-9999999-1', 'F-8, Islamabad',          'tenant',   'Farooq Ahmed',    '+923091234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000002', 'Umar Farhan',     '+923101234567', '35203-1010101-2', 'Gulberg, Lahore',         'tenant',   'Hina Farhan',     '+923101234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000003', 'Maryam Tahir',    '+923111234567', '35203-1111111-3', 'DHA, Lahore',             'tenant',   'Tahir Khan',      '+923111234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000004', 'Faisal Latif',    '+923121234567', '35203-1212121-4', 'Blue Area, Islamabad',    'tenant',   'Latif Hussain',   '+923121234568', FALSE, FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000005', 'Hira Saleem',     '+923131234567', '35203-1313131-5', 'Model Town, Lahore',      'tenant',   'Saleem Akhtar',   '+923131234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000006', 'Zahid Nawaz',     '+923141234567', '35203-1414141-6', 'G-11, Islamabad',         'tenant',   'Nawaz Ahmed',     '+923141234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000007', 'Amna Riaz',       '+923151234567', '35203-1515151-7', 'Johar Town, Lahore',      'tenant',   'Riaz Ahmed',      '+923151234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000008', 'Shoaib Malik',    '+923161234567', '35203-1616161-8', 'Bahria Town, Islamabad',  'tenant',   'Malik Iqbal',     '+923161234568', FALSE, FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000009', 'Nida Cheema',     '+923171234567', '35203-1717171-9', 'DHA Phase 5, Lahore',     'tenant',   'Cheema Saab',     '+923171234568', TRUE,  FALSE, TRUE),
  ('b1c2d3e4-0002-0000-0000-000000000010', 'Arslan Ghani',    '+923181234567', '35203-1818181-0', 'F-7, Islamabad',          'tenant',   'Ghani Sahib',     '+923181234568', TRUE,  FALSE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  full_name                 = EXCLUDED.full_name,
  phone                     = EXCLUDED.phone,
  cnic                      = EXCLUDED.cnic,
  address                   = EXCLUDED.address,
  role                      = EXCLUDED.role,
  emergency_contact_name    = EXCLUDED.emergency_contact_name,
  emergency_contact_phone   = EXCLUDED.emergency_contact_phone,
  police_verified           = EXCLUDED.police_verified,
  criminal_record_flag      = EXCLUDED.criminal_record_flag,
  is_active                 = EXCLUDED.is_active,
  updated_at                = NOW();


-- AMENITIES


INSERT INTO amenities (id, name) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'WiFi'),
  ('aa000000-0000-0000-0000-000000000002', 'Parking'),
  ('aa000000-0000-0000-0000-000000000003', 'Generator Backup'),
  ('aa000000-0000-0000-0000-000000000004', 'CCTV'),
  ('aa000000-0000-0000-0000-000000000005', 'Water Tank'),
  ('aa000000-0000-0000-0000-000000000006', 'Elevator'),
  ('aa000000-0000-0000-0000-000000000007', 'Air Conditioning'),
  ('aa000000-0000-0000-0000-000000000008', 'Security Guard'),
  ('aa000000-0000-0000-0000-000000000009', 'Gym'),
  ('aa000000-0000-0000-0000-000000000010', 'Laundry')
ON CONFLICT (id) DO NOTHING;


-- DISABLE AUDIT TRIGGERS FOR SEEDING


ALTER TABLE properties           DISABLE TRIGGER properties_audit;
ALTER TABLE leases               DISABLE TRIGGER leases_audit;
ALTER TABLE payments             DISABLE TRIGGER payments_audit;
ALTER TABLE maintenance_requests DISABLE TRIGGER maintenance_audit;
ALTER TABLE ratings              DISABLE TRIGGER ratings_audit;


-- PROPERTIES


INSERT INTO properties (id, landlord_id, title, city, area,
                        property_type, total_units, max_occupants_per_unit,
                        location, status)
VALUES
  ('bb000000-0000-0000-0000-000000000101', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'F-7 Executive Suites',        'Islamabad', 'F-7 Markaz',         'apartment',  8, 2,  ST_SetSRID(ST_MakePoint(73.0551, 33.7295), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000102', 'a1b2c3d4-0001-0000-0000-000000000004', 'Luxury Flat in F-7',          'Islamabad', 'F-7 Markaz',         'apartment',  4, 3,  ST_SetSRID(ST_MakePoint(73.0563, 33.7301), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000103', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'F-7 Studio Rooms',            'Islamabad', 'F-7 Markaz',         'room',       6, 1,  ST_SetSRID(ST_MakePoint(73.0540, 33.7288), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000104', 'a1b2c3d4-0001-0000-0000-000000000004', 'G-11 Family Apartments',      'Islamabad', 'G-11 Markaz',        'apartment',  6, 5,  ST_SetSRID(ST_MakePoint(73.0479, 33.6844), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000105', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'Modern House G-11',           'Islamabad', 'G-11 Markaz',        'house',      1, 8,  ST_SetSRID(ST_MakePoint(73.0491, 33.6851), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000106', 'a1b2c3d4-0001-0000-0000-000000000004', 'G-11 Commercial Plaza',       'Islamabad', 'G-11 Markaz',        'commercial', 4, 10, ST_SetSRID(ST_MakePoint(73.0468, 33.6837), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000107', 'a1b2c3d4-0001-0000-0000-000000000001', 'Bahria Town Villa',           'Islamabad', 'Bahria Town Phase 4','house',      1, 10, ST_SetSRID(ST_MakePoint(73.1901, 33.5247), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000108', 'a1b2c3d4-0001-0000-0000-000000000001', 'Bahria Apartments Block C',   'Islamabad', 'Bahria Town Phase 4','apartment',  8, 4,  ST_SetSRID(ST_MakePoint(73.1915, 33.5259), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000109', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'Bahria Furnished Rooms',      'Islamabad', 'Bahria Town Phase 4','room',       5, 1,  ST_SetSRID(ST_MakePoint(73.1888, 33.5238), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000110', 'a1b2c3d4-0001-0000-0000-000000000001', 'Bahria Smart Homes',          'Islamabad', 'Bahria Town Phase 4','house',      3, 6,  ST_SetSRID(ST_MakePoint(73.1920, 33.5265), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000111', 'a1b2c3d4-0001-0000-0000-000000000001', 'DHA Phase 2 Bungalow',        'Islamabad', 'DHA Phase 2',        'house',      1, 8,  ST_SetSRID(ST_MakePoint(73.1124, 33.5651), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000112', 'a1b2c3d4-0001-0000-0000-000000000004', 'DHA Executive Apartments',    'Islamabad', 'DHA Phase 2',        'apartment',  6, 3,  ST_SetSRID(ST_MakePoint(73.1138, 33.5662), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000113', 'a1b2c3d4-0001-0000-0000-000000000001', 'DHA Commercial Hub',          'Islamabad', 'DHA Phase 2',        'commercial', 5, 15, ST_SetSRID(ST_MakePoint(73.1110, 33.5640), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000114', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'Spacious House DHA Phase 2',  'Islamabad', 'DHA Phase 2',        'house',      2, 8,  ST_SetSRID(ST_MakePoint(73.1150, 33.5670), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000115', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'Blue Area Commercial Center', 'Islamabad', 'Blue Area',          'commercial', 4, 10, ST_SetSRID(ST_MakePoint(73.0931, 33.7294), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000116', 'a1b2c3d4-0001-0000-0000-000000000004', 'Blue Area Office Suites',     'Islamabad', 'Blue Area',          'commercial', 6, 8,  ST_SetSRID(ST_MakePoint(73.0945, 33.7300), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000117', 'a1b2c3d4-0001-0000-0000-000000000001', '1-Bed Flat near Blue Area',   'Islamabad', 'Blue Area',          'apartment',  3, 2,  ST_SetSRID(ST_MakePoint(73.0920, 33.7280), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000201', 'e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c', 'Garden Residency Gulberg',    'Lahore',    'Gulberg III',        'apartment',  6, 4,  ST_SetSRID(ST_MakePoint(74.3587, 31.5204), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000202', 'a1b2c3d4-0001-0000-0000-000000000002', 'Gulberg Business Center',     'Lahore',    'Gulberg III',        'commercial', 5, 12, ST_SetSRID(ST_MakePoint(74.3601, 31.5215), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000203', 'a1b2c3d4-0001-0000-0000-000000000003', 'Gulberg III Furnished Rooms', 'Lahore',    'Gulberg III',        'room',       8, 1,  ST_SetSRID(ST_MakePoint(74.3572, 31.5195), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000204', 'a1b2c3d4-0001-0000-0000-000000000002', 'Gulberg Family House',        'Lahore',    'Gulberg III',        'house',      1, 10, ST_SetSRID(ST_MakePoint(74.3615, 31.5222), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000205', 'a1b2c3d4-0001-0000-0000-000000000003', '2-Bed Apartments Gulberg',    'Lahore',    'Gulberg III',        'apartment',  4, 3,  ST_SetSRID(ST_MakePoint(74.3558, 31.5188), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000206', 'e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c', 'Khan Villas DHA Phase 5',     'Lahore',    'DHA Phase 5',        'house',      3, 8,  ST_SetSRID(ST_MakePoint(74.4241, 31.4755), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000207', 'a1b2c3d4-0001-0000-0000-000000000005', 'DHA Phase 5 Luxury Flats',    'Lahore',    'DHA Phase 5',        'apartment',  6, 3,  ST_SetSRID(ST_MakePoint(74.4255, 31.4768), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000208', 'a1b2c3d4-0001-0000-0000-000000000002', 'DHA Phase 5 Bungalow',        'Lahore',    'DHA Phase 5',        'house',      1, 12, ST_SetSRID(ST_MakePoint(74.4228, 31.4742), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000209', 'a1b2c3d4-0001-0000-0000-000000000005', 'DHA Commercial Block Y',      'Lahore',    'DHA Phase 5',        'commercial', 4, 8,  ST_SetSRID(ST_MakePoint(74.4268, 31.4778), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000210', 'a1b2c3d4-0001-0000-0000-000000000005', 'Johar Town Apartments',       'Lahore',    'Johar Town',         'apartment',  5, 4,  ST_SetSRID(ST_MakePoint(74.2728, 31.4697), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000211', 'a1b2c3d4-0001-0000-0000-000000000003', 'Johar Town Family Homes',     'Lahore',    'Johar Town',         'house',      2, 8,  ST_SetSRID(ST_MakePoint(74.2741, 31.4710), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000212', 'a1b2c3d4-0001-0000-0000-000000000005', 'Johar Town Rooms for Rent',   'Lahore',    'Johar Town',         'room',       6, 1,  ST_SetSRID(ST_MakePoint(74.2715, 31.4684), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000213', 'a1b2c3d4-0001-0000-0000-000000000003', 'Johar Town Plaza',            'Lahore',    'Johar Town',         'commercial', 3, 10, ST_SetSRID(ST_MakePoint(74.2755, 31.4720), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000214', 'a1b2c3d4-0001-0000-0000-000000000002', 'Model Town Classic House',    'Lahore',    'Model Town',         'house',      1, 10, ST_SetSRID(ST_MakePoint(74.3244, 31.4847), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000215', 'a1b2c3d4-0001-0000-0000-000000000003', 'Model Town 3-Bed Flats',      'Lahore',    'Model Town',         'apartment',  4, 5,  ST_SetSRID(ST_MakePoint(74.3258, 31.4860), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000216', 'a1b2c3d4-0001-0000-0000-000000000002', 'Model Town Office Space',     'Lahore',    'Model Town',         'commercial', 3, 8,  ST_SetSRID(ST_MakePoint(74.3230, 31.4835), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000217', 'a1b2c3d4-0001-0000-0000-000000000003', 'Model Town Single Rooms',     'Lahore',    'Model Town',         'room',       5, 1,  ST_SetSRID(ST_MakePoint(74.3268, 31.4870), 4326)::GEOGRAPHY, 'active'),
  ('bb000000-0000-0000-0000-000000000218', 'a1b2c3d4-0001-0000-0000-000000000005', 'Old Johar Town Flats',        'Lahore',    'Johar Town',         'apartment',  3, 3,  ST_SetSRID(ST_MakePoint(74.2700, 31.4670), 4326)::GEOGRAPHY, 'inactive'),
  ('bb000000-0000-0000-0000-000000000219', 'a1b2c3d4-0001-0000-0000-000000000004', 'Suspended G-11 Property',     'Islamabad', 'G-11 Markaz',        'apartment',  2, 2,  ST_SetSRID(ST_MakePoint(73.0500, 33.6860), 4326)::GEOGRAPHY, 'suspended')
ON CONFLICT (id) DO NOTHING;


-- PROPERTY AMENITIES


INSERT INTO property_amenities (property_id, amenity_id) VALUES
  ('bb000000-0000-0000-0000-000000000101', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000101', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000101', 'aa000000-0000-0000-0000-000000000006'),
  ('bb000000-0000-0000-0000-000000000101', 'aa000000-0000-0000-0000-000000000007'),
  ('bb000000-0000-0000-0000-000000000101', 'aa000000-0000-0000-0000-000000000009'),
  ('bb000000-0000-0000-0000-000000000102', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000102', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000102', 'aa000000-0000-0000-0000-000000000003'),
  ('bb000000-0000-0000-0000-000000000102', 'aa000000-0000-0000-0000-000000000004'),
  ('bb000000-0000-0000-0000-000000000102', 'aa000000-0000-0000-0000-000000000007'),
  ('bb000000-0000-0000-0000-000000000104', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000104', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000104', 'aa000000-0000-0000-0000-000000000005'),
  ('bb000000-0000-0000-0000-000000000104', 'aa000000-0000-0000-0000-000000000008'),
  ('bb000000-0000-0000-0000-000000000107', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000107', 'aa000000-0000-0000-0000-000000000003'),
  ('bb000000-0000-0000-0000-000000000107', 'aa000000-0000-0000-0000-000000000004'),
  ('bb000000-0000-0000-0000-000000000107', 'aa000000-0000-0000-0000-000000000008'),
  ('bb000000-0000-0000-0000-000000000107', 'aa000000-0000-0000-0000-000000000009'),
  ('bb000000-0000-0000-0000-000000000107', 'aa000000-0000-0000-0000-000000000010'),
  ('bb000000-0000-0000-0000-000000000108', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000108', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000108', 'aa000000-0000-0000-0000-000000000003'),
  ('bb000000-0000-0000-0000-000000000108', 'aa000000-0000-0000-0000-000000000006'),
  ('bb000000-0000-0000-0000-000000000111', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000111', 'aa000000-0000-0000-0000-000000000004'),
  ('bb000000-0000-0000-0000-000000000111', 'aa000000-0000-0000-0000-000000000008'),
  ('bb000000-0000-0000-0000-000000000115', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000115', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000115', 'aa000000-0000-0000-0000-000000000004'),
  ('bb000000-0000-0000-0000-000000000115', 'aa000000-0000-0000-0000-000000000008'),
  ('bb000000-0000-0000-0000-000000000201', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000201', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000201', 'aa000000-0000-0000-0000-000000000003'),
  ('bb000000-0000-0000-0000-000000000201', 'aa000000-0000-0000-0000-000000000005'),
  ('bb000000-0000-0000-0000-000000000206', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000206', 'aa000000-0000-0000-0000-000000000005'),
  ('bb000000-0000-0000-0000-000000000206', 'aa000000-0000-0000-0000-000000000008'),
  ('bb000000-0000-0000-0000-000000000207', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000207', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000207', 'aa000000-0000-0000-0000-000000000006'),
  ('bb000000-0000-0000-0000-000000000207', 'aa000000-0000-0000-0000-000000000007'),
  ('bb000000-0000-0000-0000-000000000207', 'aa000000-0000-0000-0000-000000000009'),
  ('bb000000-0000-0000-0000-000000000210', 'aa000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000210', 'aa000000-0000-0000-0000-000000000003'),
  ('bb000000-0000-0000-0000-000000000210', 'aa000000-0000-0000-0000-000000000005'),
  ('bb000000-0000-0000-0000-000000000214', 'aa000000-0000-0000-0000-000000000002'),
  ('bb000000-0000-0000-0000-000000000214', 'aa000000-0000-0000-0000-000000000004'),
  ('bb000000-0000-0000-0000-000000000214', 'aa000000-0000-0000-0000-000000000008'),
  ('bb000000-0000-0000-0000-000000000214', 'aa000000-0000-0000-0000-000000000010')
ON CONFLICT (property_id, amenity_id) DO NOTHING;


-- UNITS


INSERT INTO units (id, property_id, unit_number, floor,
                   bedrooms, bathrooms, monthly_rent, is_available,
                   advance_required, advance_months, max_occupants, description)
VALUES
  ('cc100000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000101', 'A-1',   1, 1, 1, 45000.00,  FALSE, TRUE,  2,    2,  'Executive 1-bed in F-7'),
  ('cc100000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000101', 'A-2',   1, 1, 1, 45000.00,  TRUE,  TRUE,  2,    2,  'Executive 1-bed in F-7'),
  ('cc100000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000101', 'B-1',   2, 2, 2, 65000.00,  TRUE,  TRUE,  2,    3,  '2-bed with modern fittings'),
  ('cc100000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000101', 'B-2',   2, 2, 2, 65000.00,  TRUE,  FALSE, NULL, 3,  '2-bed corner unit'),
  ('cc100000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000101', 'C-1',   3, 3, 2, 85000.00,  TRUE,  TRUE,  3,    2,  'Penthouse 3-bed F-7'),
  ('cc100000-0000-0000-0000-000000000010', 'bb000000-0000-0000-0000-000000000102', '101',   1, 2, 2, 70000.00,  FALSE, TRUE,  2,    4,  '2-bed luxury flat F-7'),
  ('cc100000-0000-0000-0000-000000000011', 'bb000000-0000-0000-0000-000000000102', '201',   2, 3, 2, 90000.00,  TRUE,  TRUE,  2,    4,  '3-bed penthouse F-7'),
  ('cc100000-0000-0000-0000-000000000012', 'bb000000-0000-0000-0000-000000000102', '301',   3, 4, 3, 120000.00, TRUE,  TRUE,  3,    4,  '4-bed top floor F-7'),
  ('cc100000-0000-0000-0000-000000000020', 'bb000000-0000-0000-0000-000000000103', 'R-1',   0, 1, 1, 18000.00,  TRUE,  FALSE, NULL, 1,  'Single furnished room F-7'),
  ('cc100000-0000-0000-0000-000000000021', 'bb000000-0000-0000-0000-000000000103', 'R-2',   0, 1, 1, 18000.00,  TRUE,  FALSE, NULL, 1,  'Single furnished room F-7'),
  ('cc100000-0000-0000-0000-000000000022', 'bb000000-0000-0000-0000-000000000103', 'R-3',   1, 1, 1, 20000.00,  TRUE,  TRUE,  1,    1,  'First floor room F-7'),
  ('cc100000-0000-0000-0000-000000000030', 'bb000000-0000-0000-0000-000000000104', 'G1-A',  1, 3, 2, 40000.00,  FALSE, TRUE,  2,    5,  '3-bed family apt G-11'),
  ('cc100000-0000-0000-0000-000000000031', 'bb000000-0000-0000-0000-000000000104', 'G1-B',  1, 3, 2, 40000.00,  TRUE,  TRUE,  2,    5,  '3-bed family apt G-11'),
  ('cc100000-0000-0000-0000-000000000032', 'bb000000-0000-0000-0000-000000000104', 'G2-A',  2, 2, 1, 28000.00,  TRUE,  FALSE, NULL, 3,  '2-bed G-11'),
  ('cc100000-0000-0000-0000-000000000033', 'bb000000-0000-0000-0000-000000000104', 'G2-B',  2, 2, 1, 28000.00,  TRUE,  FALSE, NULL, 3,  '2-bed G-11'),
  ('cc100000-0000-0000-0000-000000000040', 'bb000000-0000-0000-0000-000000000105', 'MAIN',  0, 5, 4, 95000.00,  TRUE,  TRUE,  2,    8,  'Full 5-bed house G-11'),
  ('cc100000-0000-0000-0000-000000000050', 'bb000000-0000-0000-0000-000000000106', 'SH-1',  0, 0, 1, 80000.00,  TRUE,  TRUE,  2,    10, 'Ground floor shop G-11'),
  ('cc100000-0000-0000-0000-000000000051', 'bb000000-0000-0000-0000-000000000106', 'SH-2',  0, 0, 1, 80000.00,  TRUE,  TRUE,  2,    10, 'Ground floor shop G-11'),
  ('cc100000-0000-0000-0000-000000000052', 'bb000000-0000-0000-0000-000000000106', 'OF-1',  1, 0, 2, 60000.00,  TRUE,  FALSE, NULL, 8,  'First floor office G-11'),
  ('cc100000-0000-0000-0000-000000000060', 'bb000000-0000-0000-0000-000000000107', 'VILLA', 0, 5, 5, 150000.00, FALSE, TRUE,  3,    10, 'Luxury villa Bahria Town'),
  ('cc100000-0000-0000-0000-000000000070', 'bb000000-0000-0000-0000-000000000108', 'C-101', 1, 2, 1, 35000.00,  FALSE, TRUE,  2,    4,  '2-bed Bahria Phase 4'),
  ('cc100000-0000-0000-0000-000000000071', 'bb000000-0000-0000-0000-000000000108', 'C-102', 1, 2, 1, 35000.00,  TRUE,  FALSE, NULL, 4,  '2-bed Bahria Phase 4'),
  ('cc100000-0000-0000-0000-000000000072', 'bb000000-0000-0000-0000-000000000108', 'C-201', 2, 3, 2, 50000.00,  TRUE,  TRUE,  2,    4,  '3-bed Bahria Phase 4'),
  ('cc100000-0000-0000-0000-000000000073', 'bb000000-0000-0000-0000-000000000108', 'C-202', 2, 3, 2, 50000.00,  TRUE,  TRUE,  2,    4,  '3-bed Bahria Phase 4'),
  ('cc100000-0000-0000-0000-000000000080', 'bb000000-0000-0000-0000-000000000111', 'BUNG',  0, 4, 3, 110000.00, FALSE, TRUE,  3,    8,  '4-bed bungalow DHA Phase 2'),
  ('cc100000-0000-0000-0000-000000000090', 'bb000000-0000-0000-0000-000000000112', 'E-1',   1, 2, 2, 55000.00,  FALSE, TRUE,  2,    3,  '2-bed exec apt DHA'),
  ('cc100000-0000-0000-0000-000000000091', 'bb000000-0000-0000-0000-000000000112', 'E-2',   1, 2, 2, 55000.00,  TRUE,  FALSE, NULL, 3,  '2-bed exec apt DHA'),
  ('cc100000-0000-0000-0000-000000000092', 'bb000000-0000-0000-0000-000000000112', 'E-3',   2, 3, 2, 70000.00,  TRUE,  TRUE,  2,    3,  '3-bed exec apt DHA'),
  ('cc100000-0000-0000-0000-000000000100', 'bb000000-0000-0000-0000-000000000115', 'BC-01', 0, 0, 2, 120000.00, FALSE, TRUE,  2,    10, 'Prime commercial Blue Area'),
  ('cc100000-0000-0000-0000-000000000101', 'bb000000-0000-0000-0000-000000000115', 'BC-02', 0, 0, 2, 120000.00, TRUE,  TRUE,  2,    10, 'Prime commercial Blue Area'),
  ('cc100000-0000-0000-0000-000000000102', 'bb000000-0000-0000-0000-000000000115', 'OF-11', 1, 0, 2, 90000.00,  TRUE,  FALSE, NULL, 8,  'Office space Blue Area'),
  ('cc200000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000201', 'A-101', 1, 2, 1, 30000.00,  FALSE, TRUE,  2,    4,  '2-bed Gulberg III'),
  ('cc200000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000201', 'A-102', 1, 2, 1, 30000.00,  TRUE,  FALSE, NULL, 4,  '2-bed Gulberg III'),
  ('cc200000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000201', 'B-101', 2, 3, 2, 45000.00,  TRUE,  TRUE,  2,    4,  '3-bed Gulberg III'),
  ('cc200000-0000-0000-0000-000000000010', 'bb000000-0000-0000-0000-000000000206', 'V-1',   0, 4, 3, 85000.00,  FALSE, TRUE,  3,    8,  '4-bed villa DHA Phase 5'),
  ('cc200000-0000-0000-0000-000000000011', 'bb000000-0000-0000-0000-000000000206', 'V-2',   0, 3, 2, 65000.00,  TRUE,  FALSE, NULL, 6,  '3-bed villa DHA Phase 5'),
  ('cc200000-0000-0000-0000-000000000020', 'bb000000-0000-0000-0000-000000000207', 'LF-1',  1, 2, 2, 55000.00,  FALSE, TRUE,  2,    3,  '2-bed luxury DHA Phase 5'),
  ('cc200000-0000-0000-0000-000000000021', 'bb000000-0000-0000-0000-000000000207', 'LF-2',  2, 3, 2, 75000.00,  TRUE,  TRUE,  2,    3,  '3-bed luxury DHA Phase 5'),
  ('cc200000-0000-0000-0000-000000000022', 'bb000000-0000-0000-0000-000000000207', 'LF-3',  3, 4, 3, 100000.00, TRUE,  TRUE,  2,    3,  '4-bed penthouse DHA Phase 5'),
  ('cc200000-0000-0000-0000-000000000030', 'bb000000-0000-0000-0000-000000000210', 'JT-1',  1, 2, 1, 25000.00,  FALSE, FALSE, NULL, 4,  '2-bed Johar Town'),
  ('cc200000-0000-0000-0000-000000000031', 'bb000000-0000-0000-0000-000000000210', 'JT-2',  1, 2, 1, 25000.00,  TRUE,  FALSE, NULL, 4,  '2-bed Johar Town'),
  ('cc200000-0000-0000-0000-000000000032', 'bb000000-0000-0000-0000-000000000210', 'JT-3',  2, 3, 2, 38000.00,  TRUE,  TRUE,  2,    4,  '3-bed Johar Town'),
  ('cc200000-0000-0000-0000-000000000040', 'bb000000-0000-0000-0000-000000000214', 'MT-MAIN',0,5, 4, 130000.00, FALSE, TRUE,  3,    10, 'Spacious house Model Town'),
  ('cc200000-0000-0000-0000-000000000050', 'bb000000-0000-0000-0000-000000000215', 'MT-A',  1, 3, 2, 50000.00,  FALSE, TRUE,  2,    5,  '3-bed Model Town'),
  ('cc200000-0000-0000-0000-000000000051', 'bb000000-0000-0000-0000-000000000215', 'MT-B',  2, 3, 2, 50000.00,  TRUE,  TRUE,  2,    5,  '3-bed Model Town'),
  ('cc200000-0000-0000-0000-000000000052', 'bb000000-0000-0000-0000-000000000215', 'MT-C',  3, 4, 3, 70000.00,  TRUE,  TRUE,  3,    5,  '4-bed top floor Model Town')
ON CONFLICT (id) DO NOTHING;


-- LEASES


INSERT INTO leases (id, unit_id, tenant_id, monthly_rent, advance_amount,
                    start_date, end_date, is_family, occupant_count, status, notes)
VALUES
  ('dd100000-0000-0000-0000-000000000001', 'cc100000-0000-0000-0000-000000000001', 'b1c2d3e4-0002-0000-0000-000000000001', 45000.00,  90000.00,  '2025-09-01', '2026-09-01', FALSE, 1, 'active',     'Single professional F-7'),
  ('dd100000-0000-0000-0000-000000000002', 'cc100000-0000-0000-0000-000000000010', 'b1c2d3e4-0002-0000-0000-000000000002', 70000.00,  140000.00, '2025-10-01', '2026-10-01', TRUE,  3, 'active',     'Family in F-7 luxury flat'),
  ('dd100000-0000-0000-0000-000000000003', 'cc100000-0000-0000-0000-000000000030', 'b1c2d3e4-0002-0000-0000-000000000003', 40000.00,  80000.00,  '2025-11-01', '2026-11-01', TRUE,  4, 'active',     'Family in G-11'),
  ('dd100000-0000-0000-0000-000000000004', 'cc100000-0000-0000-0000-000000000060', 'b1c2d3e4-0002-0000-0000-000000000004', 150000.00, 450000.00, '2026-01-01', '2027-01-01', TRUE,  6, 'active',     'Family in Bahria Villa; 3-month advance'),
  ('dd100000-0000-0000-0000-000000000005', 'cc100000-0000-0000-0000-000000000080', 'b1c2d3e4-0002-0000-0000-000000000005', 110000.00, 220000.00, '2026-02-01', '2027-02-01', TRUE,  5, 'active',     'Family in DHA bungalow'),
  ('dd100000-0000-0000-0000-000000000006', 'cc200000-0000-0000-0000-000000000001', 'b1c2d3e4-0002-0000-0000-000000000006', 30000.00,  60000.00,  '2025-12-01', '2026-12-01', FALSE, 2, 'active',     'Couple in Gulberg III'),
  ('dd100000-0000-0000-0000-000000000007', 'cc200000-0000-0000-0000-000000000010', 'b1c2d3e4-0002-0000-0000-000000000007', 85000.00,  255000.00, '2026-01-15', '2027-01-15', TRUE,  5, 'active',     'Family in DHA Phase 5 villa'),
  ('dd100000-0000-0000-0000-000000000008', 'cc200000-0000-0000-0000-000000000030', 'b1c2d3e4-0002-0000-0000-000000000008', 25000.00,  50000.00,  '2026-03-01', '2027-03-01', FALSE, 1, 'active',     'Single in Johar Town'),
  ('dd100000-0000-0000-0000-000000000009', 'cc200000-0000-0000-0000-000000000040', 'b1c2d3e4-0002-0000-0000-000000000009', 130000.00, 390000.00, '2025-08-01', '2026-08-01', TRUE,  7, 'active',     'Large family Model Town house'),
  ('dd100000-0000-0000-0000-000000000010', 'cc200000-0000-0000-0000-000000000050', 'b1c2d3e4-0002-0000-0000-000000000010', 50000.00,  100000.00, '2026-02-15', '2027-02-15', TRUE,  3, 'active',     'Family in Model Town flat'),
  ('dd100000-0000-0000-0000-000000000011', 'cc100000-0000-0000-0000-000000000002', 'b1c2d3e4-0002-0000-0000-000000000001', 45000.00,  90000.00,  '2024-01-01', '2025-01-01', FALSE, 1, 'expired',    'Expired F-7 lease'),
  ('dd100000-0000-0000-0000-000000000012', 'cc100000-0000-0000-0000-000000000031', 'b1c2d3e4-0002-0000-0000-000000000003', 40000.00,  80000.00,  '2024-06-01', '2025-06-01', TRUE,  3, 'expired',    'Expired G-11 lease'),
  ('dd100000-0000-0000-0000-000000000013', 'cc200000-0000-0000-0000-000000000002', 'b1c2d3e4-0002-0000-0000-000000000006', 30000.00,  30000.00,  '2024-03-01', '2025-03-01', FALSE, 1, 'expired',    'Expired Gulberg lease'),
  ('dd100000-0000-0000-0000-000000000014', 'cc100000-0000-0000-0000-000000000072', 'b1c2d3e4-0002-0000-0000-000000000004', 50000.00,  0.00,      '2026-05-01', '2027-05-01', TRUE,  3, 'pending',    'Pending Bahria Phase 4'),
  ('dd100000-0000-0000-0000-000000000015', 'cc200000-0000-0000-0000-000000000021', 'b1c2d3e4-0002-0000-0000-000000000008', 75000.00,  0.00,      '2026-05-15', '2027-05-15', FALSE, 1, 'pending',    'Pending DHA Phase 5 luxury'),
  ('dd100000-0000-0000-0000-000000000016', 'cc100000-0000-0000-0000-000000000020', 'b1c2d3e4-0002-0000-0000-000000000010', 18000.00,  18000.00,  '2024-01-01', '2024-06-01', FALSE, 1, 'terminated', 'Early termination F-7 room')
ON CONFLICT (id) DO NOTHING;


-- MARK OCCUPIED UNITS UNAVAILABLE


UPDATE units SET is_available = FALSE WHERE id IN (
  'cc100000-0000-0000-0000-000000000001',
  'cc100000-0000-0000-0000-000000000010',
  'cc100000-0000-0000-0000-000000000030',
  'cc100000-0000-0000-0000-000000000060',
  'cc100000-0000-0000-0000-000000000080',
  'cc200000-0000-0000-0000-000000000001',
  'cc200000-0000-0000-0000-000000000010',
  'cc200000-0000-0000-0000-000000000030',
  'cc200000-0000-0000-0000-000000000040',
  'cc200000-0000-0000-0000-000000000050'
);


-- FAMILY MEMBERS


INSERT INTO family_members (lease_id, full_name, cnic, relation)
SELECT v.lease_id::uuid, v.full_name, v.cnic, v.relation::family_relation
FROM (VALUES
  ('dd100000-0000-0000-0000-000000000002', 'Hina Farhan',   '35204-1111111-1', 'spouse'),
  ('dd100000-0000-0000-0000-000000000002', 'Zaid Farhan',   NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000003', 'Asif Tahir',    '35204-2222222-2', 'spouse'),
  ('dd100000-0000-0000-0000-000000000003', 'Alia Tahir',    NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000003', 'Hamza Tahir',   NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000004', 'Sobia Latif',   '35204-3333333-3', 'spouse'),
  ('dd100000-0000-0000-0000-000000000004', 'Omar Latif',    NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000004', 'Fatima Latif',  NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000004', 'Baba Jan',      '35201-9999999-9', 'parent'),
  ('dd100000-0000-0000-0000-000000000004', 'Ammi Latif',    '35201-8888888-8', 'parent'),
  ('dd100000-0000-0000-0000-000000000005', 'Saima Saleem',  '35204-4444444-4', 'spouse'),
  ('dd100000-0000-0000-0000-000000000005', 'Bilal Saleem',  NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000005', 'Zara Saleem',   NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000005', 'Dadi Amma',     '35201-7777777-7', 'parent'),
  ('dd100000-0000-0000-0000-000000000007', 'Bushra Nawaz',  '35204-5555555-5', 'spouse'),
  ('dd100000-0000-0000-0000-000000000007', 'Imran Nawaz',   NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000007', 'Sara Nawaz',    NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000007', 'Ali Nawaz',     NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000009', 'Mariam Cheema', '35204-6666666-6', 'spouse'),
  ('dd100000-0000-0000-0000-000000000009', 'Ahmed Cheema',  NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000009', 'Hassan Cheema', NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000009', 'Taha Cheema',   NULL,              'child'),
  ('dd100000-0000-0000-0000-000000000009', 'Dada Cheema',   '35201-6666666-6', 'parent'),
  ('dd100000-0000-0000-0000-000000000010', 'Komal Ghani',   '35204-7777777-7', 'spouse'),
  ('dd100000-0000-0000-0000-000000000010', 'Rayan Ghani',   NULL,              'child')
) AS v(lease_id, full_name, cnic, relation)
-- Only insert if this lease has no family members yet
WHERE NOT EXISTS (
  SELECT 1 FROM family_members fm WHERE fm.lease_id = v.lease_id::uuid
);

-- PAYMENTS

ALTER TABLE payments DISABLE TRIGGER enforce_payment_due_date;
INSERT INTO payments (lease_id, amount, due_date, paid_date, status, notes)
SELECT v.lease_id::uuid, v.amount, v.due_date, v.paid_date, v.status::payment_status, v.notes
FROM (VALUES
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2025-09-05'::date, '2025-09-04'::date, 'paid',    'Sep 2025'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2025-10-05'::date, '2025-10-06'::date, 'paid',    'Oct 2025'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2025-11-05'::date, '2025-11-05'::date, 'paid',    'Nov 2025'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2025-12-05'::date, '2025-12-08'::date, 'paid',    'Dec 2025'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2026-01-05'::date, NULL,                'overdue', 'Jan 2026 — unpaid'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2026-02-05'::date, NULL,                'overdue', 'Feb 2026 — unpaid'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2026-03-05'::date, NULL,                'overdue', 'Mar 2026 — unpaid'),
  ('dd100000-0000-0000-0000-000000000001', 45000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2025-10-05'::date, '2025-10-05'::date, 'paid',    'Oct 2025'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2025-11-05'::date, '2025-11-06'::date, 'paid',    'Nov 2025'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2025-12-05'::date, '2025-12-04'::date, 'paid',    'Dec 2025'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2026-01-05'::date, '2026-01-07'::date, 'paid',    'Jan 2026'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2026-02-05'::date, '2026-02-05'::date, 'paid',    'Feb 2026'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2026-03-05'::date, '2026-03-06'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000002', 70000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000003', 40000.00,  '2025-11-05'::date, '2025-11-05'::date, 'paid',    'Nov 2025'),
  ('dd100000-0000-0000-0000-000000000003', 40000.00,  '2025-12-05'::date, '2025-12-10'::date, 'paid',    'Dec 2025'),
  ('dd100000-0000-0000-0000-000000000003', 40000.00,  '2026-01-05'::date, NULL,                'overdue', 'Jan 2026 — late'),
  ('dd100000-0000-0000-0000-000000000003', 40000.00,  '2026-02-05'::date, '2026-02-08'::date, 'paid',    'Feb 2026'),
  ('dd100000-0000-0000-0000-000000000003', 40000.00,  '2026-03-05'::date, '2026-03-05'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000003', 40000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000004', 150000.00, '2026-01-05'::date, '2026-01-05'::date, 'paid',    'Jan 2026'),
  ('dd100000-0000-0000-0000-000000000004', 150000.00, '2026-02-05'::date, '2026-02-06'::date, 'paid',    'Feb 2026'),
  ('dd100000-0000-0000-0000-000000000004', 150000.00, '2026-03-05'::date, '2026-03-05'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000004', 150000.00, '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000005', 110000.00, '2026-02-05'::date, '2026-02-05'::date, 'paid',    'Feb 2026'),
  ('dd100000-0000-0000-0000-000000000005', 110000.00, '2026-03-05'::date, '2026-03-07'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000005', 110000.00, '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000006', 30000.00,  '2025-12-05'::date, '2025-12-05'::date, 'paid',    'Dec 2025'),
  ('dd100000-0000-0000-0000-000000000006', 30000.00,  '2026-01-05'::date, '2026-01-06'::date, 'paid',    'Jan 2026'),
  ('dd100000-0000-0000-0000-000000000006', 30000.00,  '2026-02-05'::date, NULL,                'overdue', 'Feb 2026 — unpaid'),
  ('dd100000-0000-0000-0000-000000000006', 30000.00,  '2026-03-05'::date, '2026-03-10'::date, 'paid',    'Mar 2026 — paid late'),
  ('dd100000-0000-0000-0000-000000000006', 30000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000007', 85000.00,  '2026-02-05'::date, '2026-02-05'::date, 'paid',    'Feb 2026'),
  ('dd100000-0000-0000-0000-000000000007', 85000.00,  '2026-03-05'::date, '2026-03-05'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000007', 85000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000008', 25000.00,  '2026-03-05'::date, '2026-03-05'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000008', 25000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2025-08-05'::date, '2025-08-05'::date, 'paid',    'Aug 2025'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2025-09-05'::date, '2025-09-06'::date, 'paid',    'Sep 2025'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2025-10-05'::date, '2025-10-05'::date, 'paid',    'Oct 2025'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2025-11-05'::date, '2025-11-07'::date, 'paid',    'Nov 2025'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2025-12-05'::date, '2025-12-05'::date, 'paid',    'Dec 2025'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2026-01-05'::date, '2026-01-06'::date, 'paid',    'Jan 2026'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2026-02-05'::date, '2026-02-05'::date, 'paid',    'Feb 2026'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2026-03-05'::date, '2026-03-06'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000009', 130000.00, '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000010', 50000.00,  '2026-03-05'::date, '2026-03-05'::date, 'paid',    'Mar 2026'),
  ('dd100000-0000-0000-0000-000000000010', 50000.00,  '2026-04-05'::date, NULL,                'pending', 'Apr 2026'),
  ('dd100000-0000-0000-0000-000000000011', 45000.00,  '2024-01-05'::date, '2024-01-05'::date, 'paid',    'Jan 2024'),
  ('dd100000-0000-0000-0000-000000000011', 45000.00,  '2024-06-05'::date, '2024-06-05'::date, 'paid',    'Jun 2024'),
  ('dd100000-0000-0000-0000-000000000011', 45000.00,  '2024-12-05'::date, '2024-12-06'::date, 'paid',    'Dec 2024'),
  ('dd100000-0000-0000-0000-000000000012', 40000.00,  '2024-06-05'::date, '2024-06-05'::date, 'paid',    'Jun 2024'),
  ('dd100000-0000-0000-0000-000000000012', 40000.00,  '2024-12-05'::date, NULL,                'overdue', 'Dec 2024 — never paid'),
  ('dd100000-0000-0000-0000-000000000013', 30000.00,  '2024-03-05'::date, '2024-03-05'::date, 'paid',    'Mar 2024'),
  ('dd100000-0000-0000-0000-000000000013', 30000.00,  '2024-09-05'::date, '2024-09-07'::date, 'paid',    'Sep 2024'),
  ('dd100000-0000-0000-0000-000000000013', 30000.00,  '2025-03-05'::date, '2025-03-05'::date, 'paid',    'Mar 2025 — final'),
  ('dd100000-0000-0000-0000-000000000016', 18000.00,  '2024-01-05'::date, '2024-01-05'::date, 'paid',    'Jan 2024'),
  ('dd100000-0000-0000-0000-000000000016', 18000.00,  '2024-06-01'::date, NULL,                'waived',  'Waived on early exit')
) AS v(lease_id, amount, due_date, paid_date, status, notes)
-- Only insert payments for leases that have none yet
WHERE NOT EXISTS (
  SELECT 1 FROM payments p WHERE p.lease_id = v.lease_id::uuid
);

-- MAINTENANCE REQUESTS


INSERT INTO maintenance_requests (unit_id, tenant_id, title, description, priority, status, resolved_at)
SELECT v.unit_id::uuid, v.tenant_id::uuid, v.title, v.description, v.priority::maint_priority, v.status::maint_status, v.resolved_at
FROM (VALUES
  ('cc100000-0000-0000-0000-000000000001', 'b1c2d3e4-0002-0000-0000-000000000001', 'Water heater not working',  'Geyser stopped heating water completely.',               'high',   'resolved',    NOW() - INTERVAL '15 days'),
  ('cc100000-0000-0000-0000-000000000001', 'b1c2d3e4-0002-0000-0000-000000000001', 'Broken window latch',       'Bedroom window latch is broken, cannot lock properly.',   'medium', 'open',        NULL::timestamptz),
  ('cc100000-0000-0000-0000-000000000010', 'b1c2d3e4-0002-0000-0000-000000000002', 'AC unit leaking water',     'Split AC dripping water on the floor.',                  'urgent', 'in_progress', NULL::timestamptz),
  ('cc100000-0000-0000-0000-000000000010', 'b1c2d3e4-0002-0000-0000-000000000002', 'Elevator out of service',   'Building elevator not working for 3 days.',              'high',   'open',        NULL::timestamptz),
  ('cc100000-0000-0000-0000-000000000030', 'b1c2d3e4-0002-0000-0000-000000000003', 'Sewage blockage',           'Kitchen drain completely blocked.',                      'urgent', 'resolved',    NOW() - INTERVAL '5 days'),
  ('cc100000-0000-0000-0000-000000000060', 'b1c2d3e4-0002-0000-0000-000000000004', 'Generator not starting',    'Backup generator fails to start during load shedding.',  'high',   'in_progress', NULL::timestamptz),
  ('cc100000-0000-0000-0000-000000000080', 'b1c2d3e4-0002-0000-0000-000000000005', 'Boundary wall crack',       'Large crack appeared in front boundary wall.',           'medium', 'open',        NULL::timestamptz),
  ('cc200000-0000-0000-0000-000000000001', 'b1c2d3e4-0002-0000-0000-000000000006', 'Paint peeling off walls',   'Bathroom walls paint peeling due to moisture.',          'low',    'open',        NULL::timestamptz),
  ('cc200000-0000-0000-0000-000000000010', 'b1c2d3e4-0002-0000-0000-000000000007', 'Gate remote not working',   'Car gate remote control stopped responding.',            'low',    'closed',      NOW() - INTERVAL '20 days'),
  ('cc200000-0000-0000-0000-000000000030', 'b1c2d3e4-0002-0000-0000-000000000008', 'Cockroach infestation',     'Cockroaches found in kitchen and bathroom.',             'medium', 'open',        NULL::timestamptz),
  ('cc200000-0000-0000-0000-000000000040', 'b1c2d3e4-0002-0000-0000-000000000009', 'Roof water seepage',        'Rain water seeping through roof into top floor bedroom.','urgent', 'in_progress', NULL::timestamptz),
  ('cc200000-0000-0000-0000-000000000050', 'b1c2d3e4-0002-0000-0000-000000000010', 'Gas pressure low',          'Gas pressure very low, stove barely lights.',            'medium', 'open',        NULL::timestamptz)
) AS v(unit_id, tenant_id, title, description, priority, status, resolved_at)
-- Only insert if this unit has no maintenance requests yet
WHERE NOT EXISTS (
  SELECT 1 FROM maintenance_requests mr WHERE mr.unit_id = v.unit_id::uuid
);


-- 12. RATINGS


INSERT INTO ratings (lease_id, reviewer_id, target_id, target_type, score, comment)
VALUES
  ('dd100000-0000-0000-0000-000000000011', 'b1c2d3e4-0002-0000-0000-000000000001', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'landlord', 5, 'Amazing landlord, very professional and responsive.'),
  ('dd100000-0000-0000-0000-000000000011', 'f4d5c169-9df0-47f6-8405-995bbd7a553b', 'b1c2d3e4-0002-0000-0000-000000000001', 'tenant',   5, 'Perfect tenant. Always paid on time, kept the place clean.'),
  ('dd100000-0000-0000-0000-000000000012', 'b1c2d3e4-0002-0000-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000004', 'landlord', 3, 'Average experience. Maintenance took too long.'),
  ('dd100000-0000-0000-0000-000000000012', 'a1b2c3d4-0001-0000-0000-000000000004', 'b1c2d3e4-0002-0000-0000-000000000003', 'tenant',   2, 'Tenant missed a payment and was unresponsive.'),
  ('dd100000-0000-0000-0000-000000000013', 'b1c2d3e4-0002-0000-0000-000000000006', 'e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c', 'landlord', 4, 'Good landlord overall. Fixed issues quickly most of the time.'),
  ('dd100000-0000-0000-0000-000000000013', 'e087d5bc-8e51-4fe4-9d8c-c9a90d9ff47c', 'b1c2d3e4-0002-0000-0000-000000000006', 'tenant',   4, 'Reliable tenant, no major issues during the lease.')
ON CONFLICT (lease_id, reviewer_id, target_id, target_type) DO NOTHING;


-- RE-ENABLE AUDIT TRIGGERS


ALTER TABLE properties           ENABLE TRIGGER properties_audit;
ALTER TABLE leases               ENABLE TRIGGER leases_audit;
ALTER TABLE payments             ENABLE TRIGGER payments_audit;
ALTER TABLE maintenance_requests ENABLE TRIGGER maintenance_audit;
ALTER TABLE ratings              ENABLE TRIGGER ratings_audit;
ALTER TABLE payments ENABLE TRIGGER enforce_payment_due_date;


-- Existing auth users are preserved as-is (ON CONFLICT DO NOTHING).
-- Their profiles have been upserted with full seed data.
