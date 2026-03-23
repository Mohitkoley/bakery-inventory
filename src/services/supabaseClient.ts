import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

const SUPABASE_URL = process.env.SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "your-anon-key";

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || SUPABASE_URL === "https://your-project.supabase.co") {
    console.log("Supabase not configured. Running in offline-only mode.");
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL !== "https://your-project.supabase.co" && 
         SUPABASE_ANON_KEY !== "your-anon-key" &&
         process.env.SUPABASE_URL !== undefined;
}
