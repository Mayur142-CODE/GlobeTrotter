/**
 * GlobeTrotter Backend - Supabase Connection Verifier
 * Zero-dependency connection test script (uses Node.js built-in fs and fetch).
 *
 * Usage:
 *   node test-connection.js
 */

const fs = require('fs');
const path = require('path');

// Simple .env parser to avoid requiring external packages like dotenv
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex !== -1) {
        const key = trimmed.slice(0, equalIndex).trim();
        let value = trimmed.slice(equalIndex + 1).trim();
        // Strip wrapping quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('====================================================');
console.log('🌍 GlobeTrotter Backend - Supabase Connection Test');
console.log('====================================================\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing credentials:');
  console.error('   Please ensure backend/.env contains SUPABASE_URL and SUPABASE_ANON_KEY.');
  console.error('   Copy backend/.env.example to backend/.env and add your Supabase credentials.\n');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-supabase-anon-public-key')) {
  console.warn('⚠️  Placeholder credentials detected:');
  console.warn('   Please edit backend/.env with your actual Supabase Project URL and Anon Key.\n');
  console.warn(`   Current URL: ${supabaseUrl}`);
  process.exit(1);
}

const cleanedUrl = supabaseUrl.replace(/\/+$/, '');
const authHealthEndpoint = `${cleanedUrl}/auth/v1/health`;
const authSettingsEndpoint = `${cleanedUrl}/auth/v1/settings`;

async function verifyConnection() {
  console.log(`📡 Testing connection to: ${cleanedUrl} ...\n`);

  try {
    // 1. Test Auth health endpoint
    const healthResponse = await fetch(authHealthEndpoint, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    if (healthResponse.ok) {
      console.log('✅ Supabase Auth Service: REACHABLE (Status 200 OK)');
    } else {
      console.warn(`⚠️  Supabase Auth Service returned status: ${healthResponse.status} ${healthResponse.statusText}`);
    }

    // 2. Test Auth Settings with Anon Key (validates that the anon key is authentic)
    const settingsResponse = await fetch(authSettingsEndpoint, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    if (settingsResponse.ok) {
      console.log('✅ Supabase API Credentials: VALIDATED (Anon key verified)');
      console.log('\n🎉 SUCCESS: Local backend successfully connected to your Supabase project!');
    } else if (settingsResponse.status === 401) {
      console.error('❌ Supabase Auth API: 401 Unauthorized. Check that SUPABASE_ANON_KEY is valid.');
      process.exit(1);
    } else {
      console.log(`ℹ️  Supabase API responded with status ${settingsResponse.status}`);
      console.log('\n🎉 SUCCESS: Connection established to Supabase project!');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Supabase project:');
    console.error(`   Error details: ${error.message}`);
    console.error('   Please verify that your SUPABASE_URL is correct and you have an active internet connection.');
    process.exit(1);
  }
}

verifyConnection();
