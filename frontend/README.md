# GlobeTrotter Frontend - API Test

Minimal React + Vite frontend to verify Supabase project connectivity.

---

## 🚀 Running the Frontend Test Page

### 1. Install Dependencies
From the `frontend/` folder:
```bash
npm install
```

### 2. Configure Environment Variables
Ensure `frontend/.env.local` contains your Supabase credentials:
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:5173` and click **"Test Supabase Connection"**.
