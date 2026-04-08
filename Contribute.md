# RentScape — Development Plan & Contribution Guide

This document covers the full build plan, week-by-week breakdown, team responsibilities, branching strategy, and development conventions. Read this before writing any code.

---

## Team Responsibilities

| Member | Area | Owns |
|---|---|---|
| **[Your name]** | Full-stack | Next.js setup, API routes, auth, map integration, connecting DB to frontend, dashboard UI |
| **[DB person]** | Database | Schema design, PostGIS setup, stored procedures, triggers, spatial indexes, seed data |
| **[Third member]** | Frontend | Tailwind UI components, all forms, manual QA, test cases, README and docs |

### Hard rule on the DB boundary

[DB person] owns everything inside `/sql/` and the Prisma schema. [Your name] owns everything inside `/app/api/` and the frontend. The interface between them is agreed SQL queries and function signatures — discuss and write these down before either side starts building. If this boundary blurs, you'll be rewriting each other's work.

---

## Branch Strategy

```
main          ← stable only, what gets deployed to Vercel
dev           ← integration branch, merge all features here first
feature/*     ← individual feature branches
```

### Branch naming

```
feature/auth-setup
feature/property-crud
feature/map-search
feature/db-schema
feature/stored-procedures
feature/dashboard
feature/ratings
feature/maintenance
```

### Workflow

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# Work, commit frequently
git add .
git commit -m "feat: add property listing form"

# Push and open PR into dev
git push origin feature/your-feature-name
```

Never push directly to `main`. Open a PR from `dev` → `main` only when a milestone is complete and tested.

### Commit message format

```
feat: add radius search to map
fix: correct lease status update query
chore: add PostGIS indexes
docs: update setup instructions
```

---

## Phase Overview

| Phase | Weeks | Focus | Milestone |
|---|---|---|---|
| 1 — Foundation | Week 1 | Setup, schema, auth | Can sign up and log in with roles |
| 2 — Core flow | Week 2 | Properties, map, browsing | Tenant finds property on map |
| 3 — DB showcase | Week 3 | Leases, stored procs, triggers, spatial | All DB course requirements working |
| 4 — Payments + Dashboard | Week 4 | Payment tracking, analytics, ratings | Landlord dashboard shows real data |
| 5 — Deploy + polish | Week 5 | Validation, error handling, live deploy | Live URL, shareable |
| 6 — Buffer | Week 6 | Fixes, extras, portfolio prep | Submission-ready + portfolio-ready |

---

## Week-by-Week Breakdown

---

### Week 1 — Foundation

**Goal:** Everyone has the project running locally. Auth works. Roles work. Schema is locked.

**[Your name]**
- Initialize Next.js 14 project with Tailwind, ESLint, TypeScript
- Set up folder structure as per README
- Configure NextAuth.js with credentials provider
- Implement tenant and landlord role guards (middleware)
- Basic layout components — navbar, sidebar shells
- Connect Prisma to Supabase

**[DB person]**
- Set up Supabase project, enable PostGIS extension
- Write full schema — all tables, constraints, foreign keys
- Write `/sql/schema.sql` as the source of truth
- Set up Prisma schema to mirror it
- Create first migration

**[Third member]**
- Build login and signup page UI (forms, validation UI only)
- Build dashboard shell layouts — landlord and tenant (static, no data)
- Set up GitHub Issues for all features, assign to team members

**End of week checkpoint:**
- `npx prisma migrate dev` runs without errors
- Sign up as tenant and landlord both work
- Role-based redirect after login works

---

### Week 2 — Core Property Flow

**Goal:** A tenant can open the map, see properties, and view a listing. A landlord can create and manage listings.

**[Your name]**
- Property CRUD API routes (`/api/properties`)
- Integrate Leaflet map — display property pins from DB
- Property search API — filter by city, price range, type
- Property detail page
- Wire up search filters to API

**[DB person]**
- Seed script — 50+ realistic properties across Islamabad and Lahore with real coordinates
- PostGIS location column working — test `ST_DWithin` queries locally
- Property indexes — city, price, status

**[Third member]**
- Property listing card component
- Property detail page UI
- Landlord — create/edit listing form
- Search filter sidebar UI

**End of week checkpoint:**
- Landlord can create a listing with coordinates
- Map renders pins for all seeded properties
- Clicking a pin shows property detail

---

### Week 3 — Database Showcase

**Goal:** All Advanced DB course requirements are implemented and demonstrable.

**[Your name]**
- Lease creation API and UI — landlord assigns tenant to property
- Lease detail page
- Wire invoices to lease view
- Maintenance request submit API + tenant UI

**[DB person]**
- **Stored procedure** — `generate_monthly_invoices()` creates payment rows for all active leases
- **Triggers** — audit log fires on INSERT/UPDATE/DELETE for `properties`, `leases`, `payments`
- **PostGIS radius search** — `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
- **GiST spatial index** on `properties.location`
- Run `EXPLAIN ANALYZE` on the radius query, save output to `/sql/benchmarks.md`

**[Third member]**
- Lease management UI — landlord view
- Maintenance request form + status tracker UI
- Test all DB operations manually, document any issues

**End of week checkpoint:**
- Stored procedure runs and generates invoice rows
- Audit log table populates on every data change
- Radius search returns correct results
- All of this is demonstrable for the DB submission

---

### Week 4 — Payments, Dashboard, Ratings

**Goal:** Landlord dashboard shows real data. Payment tracking works. Ratings system live.

**[Your name]**
- Payment tracking API — mark payment as paid/pending/overdue
- Landlord analytics API — income per month, occupancy rate
- Dashboard charts with Recharts
- Ratings API (`/api/ratings`) — submit and retrieve
- To-do interface for maintenance tasks (landlord)

**[DB person]**
- Ratings table + constraints (one rating per tenant per lease)
- Aggregation queries for dashboard — monthly income, occupancy percentage
- Payment history queries optimized with indexes

**[Third member]**
- Dashboard charts UI — income graph, occupancy card
- Payment history table UI
- Rating component — star input + display
- Landlord to-do list UI

**End of week checkpoint:**
- Landlord dashboard shows income chart with real data from DB
- Tenant can submit a rating after lease
- Payments can be marked and tracked

---

### Week 5 — Polish and Deployment

**Goal:** Live URL. Everything works end to end. No broken flows.

**[Backend person]**
- Deploy to Vercel — connect Supabase production DB
- Set all environment variables in Vercel dashboard
- Fix any deployment-specific issues
- API error handling — proper status codes and messages everywhere
- Loading states and empty states on all pages

**[DB person]**
- Final review of all SQL files in `/sql/` — clean, commented, ready for submission
- Run all stored procedures and triggers against production DB
- Confirm PostGIS works on Supabase production

**[Design and other person]**
- Full Zod validation on all forms
- Mobile responsiveness pass on all pages
- Cross-browser check (Chrome, Firefox)
- Write final README updates

**End of week checkpoint:**
- Live URL working
- All roles, flows, and features working on production
- No console errors on main flows

---

### Week 6 — Buffer and Portfolio Prep

This week is intentionally loose. Use it to fix whatever broke, add stretch features if ahead of schedule, and prepare the project as a portfolio piece.

**Fixes and cleanup**
- Address anything that broke during deployment
- Performance pass — lazy loading images, optimize heavy queries
- Clean up any hardcoded values or console.logs

**Portfolio prep**
- Record a 2-3 minute demo video walking through both roles
- Take screenshots for portfolio: map view, dashboard, property detail
- Write a proper project description for LinkedIn and portfolio site
- Make sure the GitHub repo looks clean — good commit history, no junk files

**Stretch features (only if Week 5 is solid)**
- Tenant application flow — apply for a property, landlord approves or rejects
- Email notifications using Resend (free tier)
- PDF lease document upload

---

## API Route Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create user account |
| GET | `/api/properties` | Public | List + search properties |
| POST | `/api/properties` | Landlord | Create listing |
| PUT | `/api/properties/[id]` | Landlord (owner) | Update listing |
| DELETE | `/api/properties/[id]` | Landlord (owner) | Delete listing |
| GET | `/api/properties/nearby` | Public | PostGIS radius search |
| POST | `/api/leases` | Landlord | Create lease |
| GET | `/api/leases/[id]` | Auth | View lease |
| GET | `/api/payments?leaseId=` | Auth | List payments |
| PUT | `/api/payments/[id]` | Landlord | Update payment status |
| POST | `/api/maintenance` | Tenant | Submit request |
| PUT | `/api/maintenance/[id]` | Landlord | Update status |
| POST | `/api/ratings` | Tenant | Submit rating |
| GET | `/api/ratings?targetId=` | Public | Get ratings |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` locally, your Vercel URL in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (if Supabase) | Found in Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (if Supabase) | Found in Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (if Supabase) | Server-side only, never expose to client |

---

## Key Technical Decisions

**Why raw SQL for DB course features?**
Prisma abstracts the query layer — stored procedures, triggers, and spatial queries need to be written and visible in raw SQL so the professor can evaluate them directly. Keep all course-relevant SQL in `/sql/` as standalone files.

**Why Leaflet over Google Maps?**
No API key required, no billing, works completely free. More than sufficient for property pin display and radius search visualization.

**Why Supabase?**
Supabase ships with PostGIS already enabled and provides a managed PostgreSQL instance on the free tier. Avoids the complexity of self-hosting PostGIS.

**Payment tracking approach**
No real payment gateway is integrated. Landlords manually mark rent as paid. The system tracks status, generates invoices automatically via stored procedure, and flags overdue payments. This is honest, realistic for an MVP, and still demonstrates the ledger concept.

---

## Definition of Done

A feature is done when:
1. API route works and returns correct data
2. UI is connected to the API — not hardcoded
3. Form has validation (Zod schema)
4. Error states are handled — no blank screens on failure
5. It works on mobile layout
6. Code is pushed to `dev` branch via PR