import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables handling both Vite (import.meta.env) and Legacy/Process envs
// preventing crashes if objects are undefined.
const getEnvVar = (viteKey: string, reactKey: string, defaultValue: string) => {
  // 1. Try Vite (import.meta.env)
  // Cast import.meta to any to avoid TypeScript errors if vite/client types are missing
  const meta = import.meta as any;
  if (meta.env && meta.env[viteKey]) {
    return meta.env[viteKey];
  }

  // 2. Try Process (legacy/CRA support)
  // Check typeof process to avoid ReferenceErrors
  try {
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      const val = process.env[reactKey] || process.env[viteKey];
      if (val) return val;
    }
  } catch (e) {
    // ignore process error
  }

  return defaultValue;
};

const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL', 
  'REACT_APP_SUPABASE_URL', 
  'https://mnfjgbocnswityoagqzx.supabase.co'
);

const supabaseKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY', 
  'REACT_APP_SUPABASE_ANON_KEY', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZmpnYm9jbnN3aXR5b2FncXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTI1NzIsImV4cCI6MjA3OTI2ODU3Mn0.P_XmLQOe6JY0okDXqzr-45d75MPqmL_t5luaUPUayT4'
);

// Flag to check if we are using real credentials or the mock fallback
export const isSupabaseConfigured = supabaseUrl !== 'https://mock.supabase.co' && supabaseUrl.includes('supabase.co');

export const supabase = createClient(supabaseUrl, supabaseKey);

export const BUCKET_NAME = 'resumes';
export const TABLE_NAME = 'profiles';
export const PROFILE_ID = 'owner';