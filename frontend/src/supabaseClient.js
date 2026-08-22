import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials have been configured
export const isConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('your_supabase') &&
  !supabasePublishableKey.includes('your_supabase')
);

// Initialize Supabase client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export { supabaseUrl, supabasePublishableKey };
