# GlobeTrotter Backend - API Documentation Overview

This document outlines the API structure and backend connectivity for the **GlobeTrotter** project.

---

## 1. Overview & Architecture

GlobeTrotter utilizes **Supabase** (PostgreSQL) as the serverless backend.

- **Data Access:** PostgREST API generated automatically from PostgreSQL schema.
- **Authentication:** Supabase Auth (GoTrue) handling email/password, magic links, or OAuth.
- **Business Logic:** Supabase Edge Functions (Deno/TypeScript) for custom logic and third-party integrations.
- **Storage:** Supabase Storage for user uploads (e.g., travel photos, avatars).

---

## 2. Environment & Access Keys

| Environment Variable | Access Level | Description |
|---|---|---|
| `SUPABASE_URL` | Public / Client | Base URL for your Supabase project instance |
| `SUPABASE_ANON_KEY` | Public / Client | Anon key with Row Level Security (RLS) enforcement |
| `SUPABASE_SERVICE_ROLE_KEY` | **Private / Admin Only** | Admin key bypassing RLS. **Never expose to frontend!** |

---

## 3. Frontend Integration (React / Lovable)

When configuring the Lovable / React frontend:
1. Provide only `VITE_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `VITE_SUPABASE_ANON_KEY`.
2. Ensure Row Level Security (RLS) policies are configured before publishing tables.
3. The frontend should never receive or use the `service_role` secret key.

---

## 4. Testing Backend Reachability

Run the test connection script from the `backend/` directory:
```bash
# Node.js:
node test-connection.js

# Or PowerShell (Windows):
powershell -ExecutionPolicy Bypass -File .\test-connection.ps1
```

---

## 5. Upcoming Implementation Phases

- [ ] **Phase 2:** Database Schema & Entity Relationship Design (`supabase/migrations/`)
- [ ] **Phase 3:** Row-Level Security (RLS) Policies & Auth Rules
- [ ] **Phase 4:** Seed Data Preparation (`supabase/seed.sql`)
- [ ] **Phase 5:** Edge Functions (`supabase/functions/`)
