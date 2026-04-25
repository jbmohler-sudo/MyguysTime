import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export function getSupabaseAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY before using Supabase Auth.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
