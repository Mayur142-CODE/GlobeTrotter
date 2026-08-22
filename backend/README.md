# GlobeTrotter Backend

Backend infrastructure and Supabase configuration for the **GlobeTrotter** project.

---

## 📁 Directory Structure

```text
backend/
├── supabase/
│   ├── config.toml         # Supabase CLI local configuration
│   ├── migrations/         # Database migrations (Phase 2)
│   ├── functions/          # Supabase Edge Functions (Phase 5)
│   └── seed.sql            # Seed data (Phase 4)
├── docs/
│   └── api.md              # API documentation & architecture overview
├── .env                    # Local environment secrets (Git-ignored)
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules for backend
├── test-connection.js      # Zero-dependency Node.js connection test script
├── test-connection.ps1     # Native Windows PowerShell connection test script
└── README.md               # Backend documentation and setup guide
```

---

## 🚀 Quick Setup Guide

### Step 1: Install Supabase CLI (Windows)

Choose one of the following methods to install the Supabase CLI on Windows:

#### Option A: Via Scoop (Recommended)
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Option B: Via Winget
```powershell
winget install --id Supabase.SupabaseCLI
```

#### Option C: Via NPM (Global)
```powershell
npm install -g supabase
```

---

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `backend/.env` and replace placeholder values:
   ```ini
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-public-key-here
   ```
   > ⚠️ **Security Note:** Never commit `.env` to Git or expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

---

### Step 3: Verify the Supabase Connection

Test that your Supabase project is active and credentials are correct:

**Using Node.js:**
```bash
node test-connection.js
```

**Using PowerShell (Native Windows):**
```powershell
powershell -ExecutionPolicy Bypass -File .\test-connection.ps1
```

---

### Step 4: Link Local Project to Remote Supabase (Supabase CLI)

1. Authenticate the CLI with your Supabase account:
   ```bash
   supabase login
   ```
2. Link to your existing Supabase project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   *(Your project ref can be found in the Supabase Dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`)*

---

## 🔒 Security Best Practices

- **Anon Key (`SUPABASE_ANON_KEY`):** Public-safe, restricted by Postgres Row Level Security (RLS). Used by React/Lovable frontend.
- **Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`):** Super-admin privileges, bypasses RLS. Kept strictly on secure backend environments.
- Keep `.env` listed in `.gitignore` at all times.
