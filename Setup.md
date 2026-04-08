# RentScape — Setup & Codebase Guide (Windows)

Everything you need to get the project running on Windows, understand the folder structure, and know why each library exists. Read this once properly before touching any code.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup](#4-database-setup)
5. [Running the Project](#5-running-the-project)
6. [Project Structure](#6-project-structure)
7. [Libraries — What They Are and Why We Use Them](#7-libraries)
8. [How the App Works — Quick Mental Model](#8-how-the-app-works)
9. [Git Workflow](#9-git-workflow)
10. [Common Windows Issues](#10-common-windows-issues)

---

## 1. Prerequisites

Install these tools first. If you already have them, verify the versions.

### Node.js
Download the **LTS version** from https://nodejs.org

Node.js is the JavaScript runtime that powers the backend. npm (Node Package Manager) comes bundled with it and is what installs all project libraries.

```bash
node -v     # should print v18 or higher
npm -v      # should print 9 or higher
```

### Git
Download from https://git-scm.com/download/win

During installation, when asked about line endings, select **"Checkout Windows-style, commit Unix-style"**. This prevents line ending issues when collaborating across Windows and Mac/Linux.

```bash
git --version     # should print any version
```

### VS Code
Download from https://code.visualstudio.com

Recommended extensions to install inside VS Code:
- **Prisma** — syntax highlighting for `.prisma` files
- **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes
- **ESLint** — catches code errors as you type
- **GitLens** — makes Git history visible inside VS Code

### Configure Git with your identity

Run these once after installing Git. Replace with your actual name and the email you used for GitHub:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global core.autocrlf true
```

The last line fixes Windows line ending issues automatically.

---

## 2. Installation

### Clone the repository

```bash
git clone https://github.com/your-username/rentscape.git
cd rentscape
```

### Install all dependencies

```bash
npm install
```

This reads `package.json` and downloads every library the project needs into a `node_modules/` folder. This folder is large (~200MB) and is git-ignored — you never commit it. Anyone cloning the repo runs `npm install` to get it back.

---

## 3. Environment Variables

Environment variables are configuration values that change between environments (your laptop, your teammate's laptop, production). They hold secrets like database passwords that must never be committed to GitHub.

### Create your local env file

```bash
copy .env.example .env.local
```

`.env.local` is git-ignored. It only exists on your machine. Never share it publicly or commit it.

### Fill in the values

Open `.env.local` in VS Code and fill in:

```env
# -----------------------------------------------
# Database — PostgreSQL connection string
# Get this from your Supabase project settings
# -----------------------------------------------
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# -----------------------------------------------
# NextAuth — handles login sessions
# NEXTAUTH_SECRET can be any random string locally
# -----------------------------------------------
NEXTAUTH_SECRET=any-long-random-string-here
NEXTAUTH_URL=http://localhost:3000

# -----------------------------------------------
# Supabase — cloud database provider
# Get these from Supabase dashboard → Project Settings → API
# -----------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> Ask the project lead for the actual Supabase credentials. Do not use your own Supabase project — the whole team shares one database.

### Why NEXT_PUBLIC_ prefix?

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Variables without it only exist on the server. Never put secrets (passwords, service role keys) in `NEXT_PUBLIC_` variables.

---

## 4. Database Setup

We use **Supabase** as our hosted PostgreSQL database with PostGIS enabled. You do not need to install PostgreSQL locally — you connect to the shared Supabase instance.

### Generate Prisma client

This reads `prisma/schema.prisma` and generates TypeScript types for your database:

```bash
npx prisma generate
```

Run this every time the schema changes.

### Run migrations

This syncs your database schema with what's defined in `prisma/schema.prisma`:

```bash
npx prisma migrate dev
```

If it asks for a migration name, type something descriptive like `init` or `add-ratings-table`.

### View your database visually (optional but useful)

```bash
npx prisma studio
```

Opens a browser UI at `localhost:5555` where you can see and edit your database tables directly. Very useful for debugging.

### Run raw SQL files

Some database features (stored procedures, triggers, spatial indexes) are written in raw SQL and live in `/sql/`. After the initial migration, run these once:

```bash
# You need the psql CLI or just run these in Supabase's SQL editor
# Go to Supabase dashboard → SQL Editor → paste the contents of each file
sql/stored_procedures.sql
sql/triggers.sql
sql/indexes.sql
```

---

## 5. Running the Project

### Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

The dev server has hot reload — any file you save automatically updates in the browser without refreshing.

### Other useful commands

```bash
npm run build       # builds the production version — run before deploying
npm run lint        # checks code for errors using ESLint
npx prisma studio   # opens visual DB browser
npx prisma generate # regenerates Prisma client after schema changes
npx prisma migrate dev # applies new migrations to the DB
```

---

## 6. Project Structure

```
rentscape/
│
├── app/                          # All pages and API routes (Next.js App Router)
│   │
│   ├── (auth)/                   # Route group — auth pages
│   │   ├── login/
│   │   │   └── page.tsx          # Login page UI
│   │   └── signup/
│   │       └── page.tsx          # Signup page UI
│   │
│   ├── (tenant)/                 # Route group — tenant-only pages
│   │   ├── search/
│   │   │   └── page.tsx          # Map search page
│   │   ├── property/[id]/
│   │   │   └── page.tsx          # Property detail page
│   │   ├── maintenance/
│   │   │   └── page.tsx          # File/track maintenance complaints
│   │   └── dashboard/
│   │       └── page.tsx          # Tenant dashboard
│   │
│   ├── (landlord)/               # Route group — landlord-only pages
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Analytics + to-do dashboard
│   │   ├── listings/
│   │   │   └── page.tsx          # Manage property listings
│   │   ├── leases/
│   │   │   └── page.tsx          # Manage leases
│   │   ├── payments/
│   │   │   └── page.tsx          # Track rent payments
│   │   └── maintenance/
│   │       └── page.tsx          # Resolve maintenance requests
│   │
│   └── api/                      # Backend API routes
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts      # NextAuth handler — handles all /api/auth/* requests
│       ├── properties/
│       │   └── route.ts          # GET (list), POST (create)
│       ├── properties/[id]/
│       │   └── route.ts          # GET, PUT, DELETE for a single property
│       ├── leases/
│       │   └── route.ts          # GET, POST leases
│       ├── payments/
│       │   └── route.ts          # GET, PUT payments
│       ├── maintenance/
│       │   └── route.ts          # GET, POST, PUT maintenance requests
│       └── ratings/
│           └── route.ts          # GET, POST ratings
│
├── components/                   # Reusable UI pieces used across pages
│   ├── map/
│   │   └── PropertyMap.tsx       # Leaflet map with property pins
│   ├── charts/
│   │   └── IncomeChart.tsx       # Recharts income graph
│   ├── ratings/
│   │   └── StarRating.tsx        # Star input + display component
│   └── ui/
│       ├── Button.tsx            # Shared button component
│       ├── Input.tsx             # Shared input component
│       └── Card.tsx              # Shared card wrapper
│
├── lib/                          # Shared utilities and configuration
│   ├── db.ts                     # Prisma client singleton — import this to query DB
│   ├── auth.ts                   # NextAuth config — providers, session strategy
│   └── validations/
│       ├── property.ts           # Zod schema for property forms
│       ├── lease.ts              # Zod schema for lease forms
│       └── auth.ts               # Zod schema for login/signup forms
│
├── prisma/
│   ├── schema.prisma             # Database schema — source of truth for DB structure
│   ├── seed.ts                   # Seeds DB with sample properties and users
│   └── migrations/               # Auto-generated migration history, never edit manually
│
├── sql/                          # Raw SQL — for Advanced DB course submission
│   ├── schema.sql                # Full schema with PostGIS types
│   ├── stored_procedures.sql     # generate_monthly_invoices() and others
│   ├── triggers.sql              # Audit log triggers on all critical tables
│   └── indexes.sql               # GiST spatial index + performance indexes
│
├── public/                       # Static files served as-is
│   └── images/                   # Property images, icons
│
├── .env.example                  # Template for environment variables — safe to commit
├── .env.local                    # Your actual secrets — NEVER commit this
├── .gitignore                    # Files Git ignores
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── prisma/schema.prisma          # Database schema
└── package.json                  # Project dependencies and scripts
```

### What are route groups?

Folders wrapped in parentheses like `(auth)`, `(tenant)`, `(landlord)` are **route groups** in Next.js. They group related pages together without affecting the URL. So `(tenant)/search/page.tsx` is accessible at `/search`, not `/tenant/search`. We use them to apply different layouts and middleware to each role.

### What is `page.tsx`?

In Next.js App Router, every folder that has a `page.tsx` becomes a route. So `app/(tenant)/search/page.tsx` maps to the URL `/search`.

### What is `route.ts`?

A `route.ts` file inside an `api/` folder is a backend API endpoint. It exports functions like `GET`, `POST`, `PUT`, `DELETE` that handle HTTP requests.

---

## 7. Libraries

### Next.js 14
**What it is:** The core framework. Handles routing, server-side rendering, API routes, and deployment.

**Why we use it:** Lets us build the frontend and backend in one project. The App Router (used here) is the modern way to build Next.js apps with layouts, loading states, and server components built in.

---

### Tailwind CSS
**What it is:** A utility-first CSS framework. Instead of writing separate CSS files, you apply small utility classes directly in your HTML/JSX.

**Why we use it:** Fast to write, consistent styling, no CSS file management. Example:
```jsx
<button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
  Submit
</button>
```

---

### NextAuth.js
**What it is:** A complete authentication library for Next.js.

**Why we use it:** Handles login sessions, JWT tokens, and OAuth providers. We use the credentials provider (email + password) and extend it to store user roles (tenant / landlord).

**Key files:** `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`

---

### Prisma
**What it is:** A type-safe database ORM (Object Relational Mapper) for TypeScript.

**Why we use it:** Instead of writing raw SQL for every query, Prisma lets you write TypeScript and generates the SQL for you. It also generates TypeScript types from your schema so you get autocomplete on all DB queries.

**Example:**
```ts
// Instead of: SELECT * FROM properties WHERE city = 'Islamabad'
const properties = await prisma.property.findMany({
  where: { city: 'Islamabad' }
})
```

**Key files:** `prisma/schema.prisma`, `lib/db.ts`

**Important:** We use raw SQL (not Prisma) for stored procedures, triggers, and PostGIS queries because those need to be visible SQL for the DB course.

---

### React Hook Form
**What it is:** A library for managing form state and validation in React.

**Why we use it:** Forms in React are verbose without it. React Hook Form handles input registration, error messages, and submission with minimal re-renders.

---

### Zod
**What it is:** A TypeScript-first schema validation library.

**Why we use it:** We define the shape of our data once (e.g. a property must have a title, price must be a positive number) and Zod validates it on both the frontend form and the backend API. One schema, used in two places.

**Example:**
```ts
const PropertySchema = z.object({
  title: z.string().min(5),
  price: z.number().positive(),
  city: z.string()
})
```

---

### Leaflet.js + react-leaflet
**What it is:** An open-source map library. react-leaflet is the React wrapper around it.

**Why we use it:** Free, no API key required, works perfectly for displaying property pins and handling radius search visualization. Google Maps requires billing setup — unnecessary for this project.

**Key component:** `components/map/PropertyMap.tsx`

---

### Recharts
**What it is:** A charting library built on top of React and D3.

**Why we use it:** Clean, React-native chart components. Used for the income graph and occupancy charts on the landlord dashboard.

---

### PostGIS (PostgreSQL extension)
**What it is:** A spatial extension for PostgreSQL that adds geographic data types and functions.

**Why we use it:** Lets us store property locations as proper geographic coordinates (`GEOGRAPHY(POINT)`) and run queries like "find all properties within 5km of this location" efficiently using spatial indexes.

**Key function we use:**
```sql
SELECT * FROM properties
WHERE ST_DWithin(
  location,
  ST_MakePoint(73.0479, 33.6844)::geography,
  5000  -- 5km in meters
);
```

---

### Supabase
**What it is:** A hosted PostgreSQL provider with a dashboard, PostGIS pre-enabled, and a free tier.

**Why we use it:** Removes the need to install and configure PostgreSQL locally. The whole team connects to the same database. Also provides file storage if we add image uploads later.

---

## 8. How the App Works

### Request flow

```
Browser
  → Next.js page (app/...page.tsx)
    → calls fetch('/api/properties')
      → API route (app/api/properties/route.ts)
        → queries DB via Prisma (lib/db.ts)
          → returns JSON
        → page renders the data
```

### Authentication flow

```
User submits login form
  → POST /api/auth/signin (NextAuth)
    → checks credentials against DB
      → if valid: creates JWT session with { id, email, role }
        → JWT stored in browser cookie
          → middleware reads cookie on every request
            → redirects tenants away from landlord pages and vice versa
```

### Role separation

Middleware in `middleware.ts` (root of project) reads the session role on every request and protects routes. Tenants cannot access `/landlord/*` routes. Landlords cannot access `/tenant/*` routes. Both need to be logged in to access anything beyond the homepage.

---

## 9. Git Workflow

### Daily workflow

```bash
# Start of day — get latest changes
git checkout dev
git pull origin dev

# Switch to your feature branch
git checkout feature/your-feature-name

# Merge any new dev changes into your branch
git merge dev

# Work on your feature, then commit
git add .
git commit -m "feat: add property search filter"

# Push your branch
git push origin feature/your-feature-name
```

### Commit message format

```
feat: add something new
fix: fix a bug
chore: setup or config change
docs: update documentation
style: formatting only, no logic change
```

### Opening a Pull Request

1. Push your branch to GitHub
2. Go to the repo on GitHub
3. Click **Compare & pull request**
4. Set base branch to `dev` (not main)
5. Write a short description of what you built
6. Assign a reviewer
7. Click **Create pull request**

### What NOT to do

- Never push directly to `main`
- Never push directly to `dev`
- Never commit `.env.local`
- Never commit `node_modules/`

---

## 10. Common Windows Issues

**`npx` or `npm` not recognized**
Node wasn't added to PATH. Uninstall Node, reinstall it, and during installation make sure "Add to PATH" is checked. Restart your terminal after.

**`prisma migrate dev` throws a connection error**
Your `DATABASE_URL` in `.env.local` is wrong or missing. Copy it exactly from Supabase → Project Settings → Database → Connection string → URI mode.

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```
Or find and kill the process using port 3000 in Task Manager.

**Leaflet map shows broken tiles or grey screen**
This is a known Next.js + Leaflet issue with SSR. The map component must be loaded with `dynamic` import and `ssr: false`:
```ts
import dynamic from 'next/dynamic'
const PropertyMap = dynamic(() => import('@/components/map/PropertyMap'), { ssr: false })
```

**Git shows hundreds of changed files after cloning**
Line ending issue. Run:
```bash
git config --global core.autocrlf true
git rm -rf --cached .
git reset --hard HEAD
```

**`npm install` fails with permission errors**
Run your terminal as Administrator. Right-click Command Prompt or PowerShell → Run as administrator.

**Changes not reflecting in browser**
Hard refresh: `Ctrl + Shift + R`. If still not updating, stop the server (`Ctrl + C`) and run `npm run dev` again.

---

## Questions

Comment on the setup issue on GitHub or message the project lead directly. Don't spend more than 15 minutes stuck on a setup problem — just ask.