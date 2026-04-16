# RentScape — 4-Day Sprint Guide

## Table of Contents

- [Who This Document Is For](#who-this-document-is-for)
- [The Honest Reality of a 4-Day Coding Sprint](#the-honest-reality-of-a-4-day-coding-sprint)
- [Collaboration Rules — Non-Negotiable](#collaboration-rules--non-negotiable)
   - [Rule 1: Nobody works on main or dev directly](#rule-1-nobody-works-on-main-or-dev-directly)
   - [Rule 2: Morning sync — 15 minutes, every day](#rule-2-morning-sync--15-minutes-every-day)
   - [Rule 3: The schema is frozen after Day 1](#rule-3-the-schema-is-frozen-after-day-1)
   - [Rule 4: Define the API contract before splitting off](#rule-4-define-the-api-contract-before-splitting-off)
   - [Rule 5: Commit every 2 hours minimum](#rule-5-commit-every-2-hours-minimum)
   - [Rule 6: Blocked for more than 30 minutes? Shout.](#rule-6-blocked-for-more-than-30-minutes-shout)
   - [Rule 7: branch manager owns integration](#rule-7-branch-manager-owns-integration)
- [Day-by-Day Plan](#day-by-day-plan)
   - [Day 1 — Foundation (the most critical day)](#day-1--foundation-the-most-critical-day)
   - [Day 2 — Core property flow](#day-2--core-property-flow)
   - [Day 3 — Leases, DB depth, and payments](#day-3--leases-db-depth-and-payments)
   - [Day 4 — Dashboard, ratings, police verification UI, and deployment](#day-4--dashboard-ratings-police-verification-ui-and-deployment)
- [The API Contract (agree on this before Day 2)](#the-api-contract-agree-on-this-before-day-2)
- [Why Each Technical Choice Was Made](#why-each-technical-choice-was-made)
   - [Why Next.js App Router and not Pages Router](#why-nextjs-app-router-and-not-pages-router)
   - [Why PostgreSQL and not MongoDB](#why-postgresql-and-not-mongodb)
   - [Why Prisma and not raw SQL for everything](#why-prisma-and-not-raw-sql-for-everything)
   - [Why Supabase and not a local PostgreSQL instance](#why-supabase-and-not-a-local-postgresql-instance)
   - [Why Tailwind and not plain CSS or a component library like MUI](#why-tailwind-and-not-plain-css-or-a-component-library-like-mui)
   - [Why Leaflet and not Google Maps or Mapbox](#why-leaflet-and-not-google-maps-or-mapbox)
- [Common Mistakes in 4-Day Sprints](#common-mistakes-in-4-day-sprints)
- [End-of-Sprint Checklist](#end-of-sprint-checklist)
- [Resource Summary](#resource-summary)
   - [YT resources](#yt-resources)

This document is your team's operating manual for the next 4 days. It covers how to collaborate, what to build in what order, why each decision was made, and exactly what to learn before touching each piece. Read it fully before writing a single line of code.

---

## Who This Document Is For

## The Honest Reality of a 4-Day Coding Sprint

Before you start, understand what you are actually doing. You are not building a polished product in 4 days. You are building a working skeleton with real data flowing through it. The difference matters.

**Working skeleton means:**
- Every screen exists and connects to real data
- Every core flow works end to end (sign up → list property → find it on map → create lease)
- It looks acceptable but not perfect
- Edge cases are handled minimally or not at all

**What gets cut:**
- Pixel-perfect design
- Every error state handled gracefully
- Performance optimization
- Advanced features beyond the MVP list

This is not failure. This is correct prioritization. Polish in days 5–7.

---

## Collaboration Rules — Non-Negotiable

### Rule 1: Nobody works on main or dev directly

Every person works on a feature branch. Always. No exceptions. Even for a one-line fix.

```
main    ← only gets code from dev via PR at end of each day
dev     ← integration branch, everyone merges here
feature/your-name-feature ← where actual work happens
```

### Rule 2: Morning sync — 15 minutes, every day

Before anyone writes code, the three of you meet (in person or on a call) and answer:
- What did I finish yesterday?
- What am I building today?
- Is anything blocked?

This 15 minutes prevents 3 hours of wasted work going in the wrong direction.

### Rule 3: The schema is frozen after Day 1

Once the DB person finalizes and runs the schema, it does not change without a team conversation. A schema change midway through breaks everyone's work simultaneously. If you find a hole — and you will — add it to a list, discuss at morning sync, and decide together whether it's worth the disruption.

### Rule 4: Define the API contract before splitting off

You  and the DB person must agree on what each API route returns before you split off to build separately. Write it down. Example:

```
GET /api/properties
returns: [{ id, title, city, monthly_rent, location: { lat, lng }, is_available }]
```

The member building the UI card needs to know this shape too. Otherwise everyone builds to a different assumption and integration day is a disaster.

### Rule 5: Commit every 2 hours minimum

Don't sit on uncommitted work. Small frequent commits mean:
- If you break something, you can roll back cheaply
- Your teammates can see progress without asking
- The git history tells the story of what was built

Good commit message: `feat: add lease creation API route with unit availability check`
Bad commit message: `update` / `fix` / `wip`

### Rule 6: Blocked for more than 30 minutes? Shout.

In a 4-day sprint there is no time to sit stuck. If you are blocked, immediately message the branch manager. The branch manager's job is to unblock people faster than they can get stuck.

### Rule 7: branch manager owns integration

At the end of each day, only the branch manager merges branches into dev and tests that the combined system still works. This is non-negotiable — when two people merge simultaneously without checking, things break in ways that take hours to diagnose.

---

## Day-by-Day Plan

---

### Day 1 — Foundation (the most critical day)

**Goal:** App runs. Database exists. Auth works. Roles work. Everyone can see the same data.

**Why Day 1 is the most critical:**
Nothing else can be built without a working foundation. A broken schema discovered on Day 3 costs more time than the entire Day 1 investment. Do not rush this day. A slow Day 1 saves a fast Day 2, 3, and 4.

---

#### branch manager tasks

**Morning (before splitting off):**

Sit with the DB person for 2 hours and finalize the schema together. Use the ERD from this repo as the starting point. Do not skip this meeting — the schema must be agreed before either of you writes code.

Questions to answer in that meeting:
- Is every table in the ERD correct?
- Is every column named and typed?
- What are the foreign key constraints and what cascades on delete?
- What enums do we need?

**Rest of Day 1:**

1. Confirm Next.js project runs (`npm run dev` → localhost:3000 works)
2. Set up NextAuth with credentials provider
3. Implement the two roles: tenant and landlord
4. Implement route middleware — tenants cannot access `/landlord/*`, landlords cannot access `/tenant/*`
5. Build a minimal navbar that shows the logged-in user's name and role
6. Test: sign up as tenant, sign up as landlord, confirm redirect works correctly

**What NOT to build today:**
The signup form UI. The third member owns that. You build the API route. They build the form. Keep those separate.

**Resource for NextAuth:**
> https://next-auth.js.org/getting-started/example

Why this resource and not others: The official docs are the most accurate and up to date. NextAuth has breaking changes between versions — blog posts from 2022 often describe a different API. Always use the official docs for auth.

What you could use instead: Clerk (much simpler, fully managed auth). We chose NextAuth because it gives us full control over the user object so we can attach the role, CNIC, and verification fields directly. Clerk would hide that from us.

---

#### DB person tasks

**Morning (schema meeting with branch manager — 2 hours)**

After the meeting, your job for the rest of Day 1 is:

1. Open Supabase dashboard → SQL Editor
2. Enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Run `schema.sql` — all tables, constraints, enums
4. Run `triggers.sql` — audit log and updated_at triggers
5. Run `indexes.sql` — all performance and spatial indexes
6. Confirm every table exists in the Supabase table editor
7. Manually insert one test user row and confirm it appears

**What you are learning today:**
PostgreSQL data types, constraints, and how PostGIS stores geographic data differently from regular columns.

**Resource for PostgreSQL basics:**
> https://www.postgresqltutorial.com

Why this and not W3Schools SQL: PostgreSQL has specific types (UUID, JSONB, GEOGRAPHY, enums) that W3Schools doesn't cover. This tutorial is PostgreSQL-specific and covers everything you'll need.

**Resource for PostGIS:**
> https://postgis.net/workshops/postgis-intro/

Why this: It's the official workshop written by the PostGIS maintainers. Chapter 14 (Spatial Relationships) and Chapter 15 (Spatial Joins) are the two you need most.

What you could use instead: YouTube tutorials. The problem is most PostGIS YouTube content is outdated or covers GIS theory you don't need. The official workshop is focused and practical.

**Do not touch today:**
Stored procedures. Those come Day 2 once the schema is stable.

---

#### UI person tasks

1. Build the login page UI — email input, password input, submit button, error message display
2. Build the signup page UI — same fields plus role selector (tenant / landlord)
3. Build the dashboard shell for both roles — just the layout, sidebar, and navbar. No real data yet.
4. Use Tailwind for all styling

**What you are learning today:**
Next.js App Router page structure and how Tailwind utility classes work.

**Resource for Next.js App Router basics:**
> https://nextjs.org/docs/app/building-your-application/routing

Why this: The official docs have visual diagrams of how the App Router works. This is not something you can learn from a quick blog post — the mental model of layouts, pages, and route groups needs the full picture.

**Resource for Tailwind:**
> https://tailwindcss.com/docs/utility-first

Why this and not a YouTube tutorial: Tailwind is best learned by reading the docs and using the search. The search bar on the Tailwind docs is the actual workflow — you think "I need padding" and search "padding", not memorize class names. A YouTube tutorial will show you a few classes but won't teach you the workflow.

**Do not build today:**
Any page that requires real data. Keep everything static for now — the forms can be built without knowing what the API returns.

---

### Day 2 — Core property flow

**Goal:** A landlord can list a property. A tenant can see it. The map shows pins.

**Why this order:**
The property is the central object of the entire application. Every other feature — leases, payments, maintenance — hangs off a property. If property creation and display don't work, nothing else can be properly tested.

---

#### branch manager tasks

1. `POST /api/properties` — create a property. The location field needs special handling:
   ```sql
   -- Do not use Prisma for this. Use raw SQL:
   INSERT INTO properties (..., location)
   VALUES (..., ST_MakePoint($lng, $lat)::geography)
   ```
   This is because Prisma does not understand PostGIS geography types. For all location operations, use `prisma.$queryRaw`.

2. `GET /api/properties` — list properties with filters (city, price range, type). Return lat/lng extracted from the PostGIS point:
   ```sql
   SELECT *, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
   FROM properties WHERE status = 'active'
   ```

3. `GET /api/properties/nearby` — radius search using PostGIS:
   ```sql
   SELECT *, ST_Distance(location, ST_MakePoint($lng, $lat)::geography) as distance_m
   FROM properties
   WHERE ST_DWithin(location, ST_MakePoint($lng, $lat)::geography, $radius)
   ORDER BY distance_m ASC
   ```

4. `GET /api/properties/[id]` — single property detail

5. Wire the Leaflet map to the `GET /api/properties` endpoint

**Resource for raw SQL with Prisma:**
> https://www.prisma.io/docs/orm/prisma-client/queries/raw-database-access

Why this: Prisma's `$queryRaw` is not obvious from general Prisma tutorials. You need to understand how to pass typed parameters safely (preventing SQL injection) even in raw queries.

**Resource for Leaflet with Next.js:**
> https://react-leaflet.js.org/docs/start-installation/

Why this and not Google Maps: No API key, no billing account, no quota. For a semester project deployed publicly this matters — Google Maps will stop working the moment the free tier runs out. Leaflet never does.

**Critical Leaflet gotcha for Next.js:**
Leaflet uses `window` which doesn't exist on the server. You must import it with dynamic loading:
```ts
const PropertyMap = dynamic(() => import('@/components/map/PropertyMap'), { ssr: false })
```
This is the most common error when using Leaflet with Next.js. Every beginner hits it.

---

#### DB person tasks

1. Write the seed script — 30 to 50 realistic property listings across Islamabad and Lahore with real coordinates. This is critical for making the map demo look real.

   Real Islamabad coordinates to use:
   - F-7 Markaz: 33.7295° N, 73.0551° E
   - G-11 Markaz: 33.6844° N, 73.0479° E
   - Bahria Town Phase 4: 33.5247° N, 73.1901° E
   - DHA Phase 2: 33.5651° N, 73.1124° E
   - Blue Area: 33.7294° N, 73.0931° E

2. Write `stored_procedures.sql` — start with `generate_monthly_invoices()`. This is the procedure that creates payment rows for every active lease at the start of each month.

   Guide yourself with this question: what does a payment row need? It needs a `lease_id`, an `amount` (the monthly rent from the lease), a `due_date`, and a `status` of pending. The procedure loops over all active leases, checks if a payment for this month already exists, and inserts one if not.

   Do not write the full procedure yet. Write the SELECT that finds active leases without a payment this month first. Confirm it returns correct results. Then wrap it in the procedure.

**Resource for PostgreSQL stored procedures:**
> https://www.postgresqltutorial.com/postgresql-plpgsql/

Why this: PL/pgSQL (the language stored procedures are written in) is different from regular SQL. This tutorial covers variables, loops, conditionals, and RETURN — everything you need. The official PostgreSQL docs are comprehensive but dense for a beginner.

**Resource for generating seed data:**
> https://www.mockaroo.com

Why this: Mockaroo lets you generate realistic fake data in CSV or SQL format. Set up fields for name, address, price, city, and export as INSERT statements. Saves hours of writing fake data manually.

---

#### UI member tasks

1. Build the property card component — shows title, city, price, type, and availability badge
2. Build the landlord property listing page — shows all properties the landlord owns, with an add button
3. Build the property creation form — title, description, address, city, type, price, bedrooms, bathrooms. The map pin placement (coordinates) can be a lat/lng input for now — a draggable map pin is a Day 3 improvement.
4. Build the property detail page layout — full description, all fields, image placeholder

**Resource for React Hook Form:**
> https://react-hook-form.com/get-started

Why this and not controlled inputs: Writing `onChange` handlers for every input is verbose and causes unnecessary re-renders. React Hook Form gives you validation, error messages, and form submission with almost no boilerplate. The getting started guide takes 20 minutes and covers 90% of what you need.

**Resource for Zod validation:**
> https://zod.dev/?id=basic-usage

Why Zod alongside React Hook Form: React Hook Form handles the form state. Zod handles what the data is allowed to be. Together they give you client-side validation that matches your server-side validation schema — one source of truth. Without Zod you end up writing the same validation rules twice.

---

### Day 3 — Leases, DB depth, and payments

**Goal:** A landlord can assign a tenant to a unit. Invoices generate. Audit log fires. Stored procedures work.

**Why this is Day 3 and not Day 2:**
Leases depend on properties and units existing. You cannot test lease creation without real property data. The ordering is forced by data dependencies.

---

#### branch manager tasks

1. `POST /api/leases` — create a lease. This route must:
   - Verify the unit is available (`is_available = true`)
   - Set `is_available = false` on the unit (your trigger should handle this — verify it does)
   - Calculate `advance_amount` from `unit.monthly_rent × unit.advance_months` if `advance_required`
   - Accept the `is_family` flag and `occupant_count`

2. `GET /api/leases` — list leases for the logged-in landlord (across all their properties)

3. `GET /api/leases/[id]` — lease detail with payment history

4. `PUT /api/payments/[id]` — mark a payment as paid. Simple status update, but confirm the audit trigger fires on this.

5. `GET /api/payments?leaseId=` — payment history for a lease

**The thing most people get wrong with leases:**
They query properties directly. You query units. A lease is always on a unit, not a property. When displaying lease information, you join unit → property to get the property details.

---

#### DB person tasks

This is your showcase day. Everything you write today is what the DB course evaluates.

1. Finish and test `generate_monthly_invoices()` — run it manually, confirm payment rows appear

2. Write `mark_overdue_payments()` — update all pending payments where `due_date < today` to overdue status

3. Write `expire_ended_leases()` — move leases past their `end_date` to expired, flip unit `is_available` back to true

4. Write `get_landlord_income_summary(landlord_id, months_back)` — returns monthly income breakdown. This powers the dashboard chart.

5. Run `EXPLAIN ANALYZE` on the PostGIS radius search query. Save the output to `/sql/benchmarks.md`. This demonstrates you understand query performance — it's what makes the DB submission stand out.

```sql
EXPLAIN ANALYZE
SELECT id, title, ST_Distance(location, ST_MakePoint(73.0551, 33.7295)::geography) as dist
FROM properties
WHERE ST_DWithin(location, ST_MakePoint(73.0551, 33.7295)::geography, 5000)
ORDER BY dist;
```

Run this once WITHOUT the GiST index, save the output. Run it WITH the index (after `indexes.sql`), save that output. The comparison proves why spatial indexing matters.

**Resource for EXPLAIN ANALYZE:**
> https://www.postgresql.org/docs/current/sql-explain.html

Why read the official docs for this: EXPLAIN output has specific terminology (Seq Scan, Index Scan, cost, actual time) that you need to understand to write the benchmarks correctly. A YouTube video won't give you the vocabulary. Read this, then run the queries.

**Resource for PL/pgSQL loops:**
> https://www.postgresqltutorial.com/postgresql-plpgsql/plpgsql-for-loop/

Why this specifically: The invoice generation procedure uses a FOR loop over a query result. This is the exact pattern you need. Read this page before writing the procedure.

---

#### UI person tasks

1. Build the lease creation form — tenant selector, unit selector, date pickers, is_family toggle, occupant count, notes
2. Build the lease detail page — shows lease info, payment history table, family members list
3. Build the payment history table component — due date, amount, status badge (green/red/amber), mark as paid button
4. Build the family members section — list of names, CNICs, relations

**Resource for date pickers in React:**
> https://react-day-picker.js.org

Why this over a native HTML date input: Native date inputs look different in every browser and cannot be styled with Tailwind. react-day-picker is lightweight, accessible, and composable with React Hook Form.

---

### Day 4 — Dashboard, ratings, police verification UI, and deployment

**Goal:** Live URL. Working end to end. Everything integrated.

**Why deploy on Day 4 and not Day 5:**
Deployment always reveals problems that only exist in production — environment variables, database connection strings, Next.js build errors that don't appear in dev mode. You need Day 5, 6, 7 to fix those. If you deploy on Day 7 you have no buffer.

---

#### branch manager tasks

**Morning — deployment first, features second:**

1. Create a Vercel account → import the GitHub repo → connect to Supabase production database
2. Set all environment variables in Vercel dashboard
3. Trigger a deploy — it will probably fail the first time. Fix the errors before building more features.
4. Once the live URL works with auth, the rest of the day is features:

5. `GET /api/dashboard/landlord` — income summary (calls `get_landlord_income_summary()`) and occupancy rate
6. `POST /api/ratings` and `GET /api/ratings?targetId=`
7. Wire Recharts income chart to the dashboard API

**Resource for Vercel deployment:**
> https://vercel.com/docs/deployments/overview

Why Vercel over alternatives (Railway, Render, Netlify): Vercel is made by the same team as Next.js. Deployment is literally connecting your GitHub repo and clicking deploy. No configuration files needed. Railway and Render both require more setup and are better suited for non-Next.js backends.

**Resource for Recharts:**
> https://recharts.org/en-US/examples/SimpleLineChart

Why this: The examples page shows working code for every chart type. Copy the SimpleLineChart example, replace the data with your API response, done. Recharts has excellent documentation but the examples are the fastest path.

---

#### DB person tasks

1. Run all SQL files against the Supabase **production** database (not just local testing)
2. Confirm all triggers fire on the production DB by making test inserts and checking `audit_log`
3. Confirm `generate_monthly_invoices()` works on production
4. Write `/sql/benchmarks.md` — document the EXPLAIN ANALYZE results with commentary explaining what the numbers mean

5. Write the final `/sql/schema.sql` cleanly — this is what gets submitted for the DB course. Make sure it is commented, readable, and runs cleanly from scratch.

**What good SQL documentation looks like:**
Every stored procedure should have a comment block explaining: what it does, when it should be called, what it returns, and any side effects. Example:

```sql
-- generate_monthly_invoices()
-- Creates one payment row per active lease for the current month.
-- Should be called once on the 1st of each month.
-- Returns: count of invoices created.
-- Side effects: inserts into payments table, fires audit trigger.
```

---

#### UI person tasks

1. Police verification UI — on the user profile page, show:
   - If `police_verification_url` is null: a yellow warning banner ("Upload your police verification document to increase your profile credibility") with an upload button
   - If uploaded but `police_verified` is false: a grey badge ("Verification pending review")
   - If `police_verified` is true: a green badge ("Verified")

2. Landlord dashboard UI — income chart (Recharts), occupancy stat card, recent payments list

3. Rating component — star input (1–5), comment textarea, submit button

4. Mobile responsiveness pass — open every page on a narrow screen (375px) and fix anything that overflows

**Resource for file uploads in Next.js:**
> https://supabase.com/docs/guides/storage/uploads/standard-uploads

Why Supabase Storage: We're already on Supabase for the database. Using Supabase Storage means one platform, one set of credentials, and the file URL can be stored directly in `police_verification_url`. An alternative would be Cloudinary or AWS S3 — both work but add another service to configure.

---

## The API Contract (agree on this before Day 2)

Before splitting off on Day 2, the three of you must agree on these response shapes. The branch manager builds these routes. Everyone else writes code assuming this is what they return.

```
GET /api/properties
→ { properties: [{ id, title, city, area, property_type, min_rent, available_units, lat, lng, status }] }

GET /api/properties/[id]
→ { property: { ...all fields }, units: [{ id, unit_number, bedrooms, monthly_rent, is_available }] }

GET /api/properties/nearby?lng=&lat=&radius=
→ { properties: [{ id, title, city, min_rent, distance_m, lat, lng }] }

POST /api/leases
body: { unit_id, tenant_id, start_date, end_date, is_family, occupant_count, notes }
→ { lease: { id, ...all fields } }

GET /api/dashboard/landlord
→ { income: [{ month, expected, collected, overdue }], occupancy_rate: number }
```

Write this down somewhere everyone can see it — a pinned message in your group chat is fine.

---

## Why Each Technical Choice Was Made

### Why Next.js App Router and not Pages Router

The App Router is the current direction of Next.js. Pages Router is the old system and will eventually be deprecated. Every new Next.js tutorial, library, and pattern targets App Router. Learning Pages Router now means learning something you will have to unlearn.

The cost: App Router has a steeper initial learning curve, especially around server vs client components. The benefit: once understood, it is cleaner and more powerful.

### Why PostgreSQL and not MongoDB

Your project has deeply relational data. A lease connects a unit, a tenant, a property, a landlord, and generates payments. Querying all of that with MongoDB requires manual joins in application code. PostgreSQL does it in a single query with proper constraints.

MongoDB is better when your data structure is unpredictable or document-shaped. Rental data is the opposite — highly structured, consistent, and relational.

### Why Prisma and not raw SQL for everything

Prisma gives you TypeScript types generated from your schema. This means your IDE tells you when you pass a wrong field name or a wrong type. In a 4-day sprint where everyone is moving fast, this prevents a category of bugs that are otherwise hard to track down.

The exception is PostGIS operations and stored procedures. Prisma does not understand GEOGRAPHY types. For anything spatial, use `prisma.$queryRaw`. For anything the course needs to evaluate as SQL, keep it in `/sql/`.

### Why Supabase and not a local PostgreSQL instance

In a team of 3 people, a local database means three different databases with three different states. The first time someone says "it works on my machine" you will lose 2 hours figuring out why the data is different. Supabase is one shared database. Everyone always works against the same data.

### Why Tailwind and not plain CSS or a component library like MUI

Component libraries like MUI look polished immediately but fight you when you try to customize them. Everything you do requires overriding their styles. Tailwind is lower level — you build what you want directly, no fighting the library.

Plain CSS is fine for small projects but creates naming conflicts and specificity issues as the codebase grows. Tailwind's utility classes eliminate both problems.

The cost: Tailwind has a learning curve for someone who knows CSS well. Classes like `flex items-center gap-4` take a day to feel natural. After that day, it is faster than writing CSS.

### Why Leaflet and not Google Maps or Mapbox

Google Maps: requires billing account, quota limits, API key management. For a publicly deployed project this is a real risk — one viral demo and your key hits the quota.

Mapbox: free tier is generous but requires account creation and has usage limits.

Leaflet: completely free, open source, no API key, no quota. For displaying property pins and running a radius search it does everything we need. The only thing it can't do is Google-style Street View or Directions — both irrelevant to this project.

---

## Common Mistakes in 4-Day Sprints

**Mistake 1: Building features before the foundation is stable**
Auth not working properly on Day 1 means everything you build on Day 2 needs to be redone with auth. Finish each layer before starting the next.

**Mistake 2: Not agreeing on the API contract before splitting off**
The frontend developer builds a component expecting `property.price`. The backend developer returns `property.monthly_rent`. Integration day is now spent renaming fields instead of building features.

**Mistake 3: Not committing frequently**
Someone works for 6 hours without committing. Their laptop dies. Their afternoon is gone. Commit every 2 hours, minimum.

**Mistake 4: Debugging alone for too long**
In a sprint, 30 minutes stuck is the maximum before asking for help. Debugging alone for 3 hours costs the team a feature.

**Mistake 5: Deploying for the first time on the last day**
Production always has surprises. Deploy early, deploy often, fix issues while there is still time.

**Mistake 6: The third member has nothing to do**
This happens when the branch manager hasn't defined the API contract yet, so the UI person can't wire anything up. Prevent this by giving the third member a list of purely visual components to build that don't require real data — loading skeletons, empty states, error messages, the navbar, the sidebar, the footer.

---

## End-of-Sprint Checklist

Before calling it done at the end of Day 4, verify every item on this list:

**Authentication**
- [ ] Tenant can sign up, log in, and access tenant pages
- [ ] Landlord can sign up, log in, and access landlord pages
- [ ] Neither can access each other's pages
- [ ] Sessions persist on page refresh

**Properties**
- [ ] Landlord can create a property with coordinates
- [ ] Map shows pins for all seeded properties
- [ ] Radius search returns nearby properties
- [ ] Property detail page shows all fields

**Leases and payments**
- [ ] Landlord can create a lease for a unit
- [ ] Unit becomes unavailable after lease is created
- [ ] Invoice generation stored procedure creates payment rows
- [ ] Landlord can mark a payment as paid

**Database**
- [ ] Audit log entries appear on every INSERT/UPDATE/DELETE
- [ ] Stored procedures run without errors on production DB
- [ ] Triggers fire on production DB
- [ ] EXPLAIN ANALYZE output saved and documented

**Deployment**
- [ ] Live URL accessible
- [ ] All environment variables set in Vercel
- [ ] No console errors on main flows
- [ ] Works on mobile width (375px)

---

## Resource Summary

| Topic | Best resource | Why |
|---|---|---|
| Next.js App Router | nextjs.org/docs/app | Official, accurate, has diagrams |
| NextAuth setup | next-auth.js.org/getting-started | Official, version-accurate |
| Prisma basics | prisma.io/docs/getting-started | Best ORM docs in the industry |
| Prisma raw SQL | prisma.io/docs/orm/prisma-client/queries/raw-database-access | Needed for PostGIS |
| PostgreSQL basics | postgresqltutorial.com | PostgreSQL-specific, practical |
| PL/pgSQL procedures | postgresqltutorial.com/postgresql-plpgsql | Covers loops and variables clearly |
| PostGIS | postgis.net/workshops/postgis-intro | Official workshop, practical chapters |
| EXPLAIN ANALYZE | postgresql.org/docs/current/sql-explain.html | Needed to understand output |
| Tailwind CSS | tailwindcss.com/docs/utility-first | Use the search bar as the workflow |
| React Hook Form | react-hook-form.com/get-started | 20-minute read covers 90% of usage |
| Zod validation | zod.dev | Clean API reference |
| Leaflet + React | react-leaflet.js.org/docs/start-installation | Official, covers Next.js gotchas |
| Recharts | recharts.org/en-US/examples | Examples are the fastest path |
| Supabase Storage | supabase.com/docs/guides/storage | For police verification uploads |
| Vercel deployment | vercel.com/docs/deployments/overview | Official, straightforward |
| Seed data generation | mockaroo.com | Fastest way to get realistic fake data |
| Git branching (visual) | learngitbranching.js.org | Interactive, builds intuition fast |

### YT resources
Here's the honest YouTube list — only channels and videos that are actually worth your time, with no fluff.

---

**Next.js — start here**

**Theo (t3.gg)** — the best Next.js explainer on YouTube. Opinionated, fast, industry-aware. Watch his App Router explanations specifically. He'll tell you what actually matters vs what is just documentation padding.

**Josh tried coding** — good for seeing complete small projects built with Next.js + Tailwind + Prisma. Closest to what you're actually building. His "build X in Y hours" videos are well-paced and realistic.

**Web Dev Simplified** — slower and more thorough. Better for your two teammates who are newer. His NextAuth tutorial specifically is the clearest explanation of how sessions and JWT work in plain terms.

---

**Database and PostgreSQL**

**Hussein Nasser** — the best database educator on YouTube by a significant margin. His PostgreSQL playlist covers indexing, transactions, and performance in a way that actually explains *why*, not just *how*. Your DB person needs to watch his indexing videos before writing the indexes.

For PostGIS specifically — YouTube is honestly weak here. The official PostGIS workshop linked in SPRINT.md is better than anything on YouTube for spatial queries. Don't waste time searching.

---

**Tailwind CSS**

**Tailwind Labs official channel** — short focused videos on specific utilities. Not a full course, but perfect for "how do I do X in Tailwind" questions. Your third member should have this bookmarked.

**Kevin Powell** — not Tailwind-specific but the best CSS educator on YouTube. If your third member is confused about flexbox or grid (which Tailwind still uses under the hood), Kevin Powell first, then Tailwind docs.

---

**Git and collaboration**

**The Coding Train — Git and GitHub for Poets** — don't let the name fool you. It's the clearest explanation of branching, merging, and pull requests for someone who has only ever used git as `git add . && git commit && git push`. Your two teammates should watch the branching episode specifically before Day 1.

---

**General system design awareness (optional but good for your profile)**

**ByteByteGo** — system design concepts explained visually. Not directly useful for the sprint but relevant to your broader roadmap. Watching their video on database indexing will make Hussein Nasser's content click faster.

---

**What to avoid**

Avoid tutorial channels that build the exact same to-do app or blog in every video — freeCodeCamp full courses, most "complete Next.js course in X hours" videos. They're fine for absolute beginners but they won't teach your team to think, only to copy. Given your timeline you need people who can reason about problems, not reproduce tutorials.

Also avoid anything NextAuth-related that's older than mid-2023 — the library had major breaking changes with version 5 and most older videos describe a completely different API.