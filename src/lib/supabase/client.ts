import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import type { SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';

export type SupabaseClient = BaseSupabaseClient<Database>;

let clientInstance: SupabaseClient | null = null;

/**
 * Create a Supabase client for use in the browser (Client Components)
 * This client respects Row Level Security policies
 * Returns a singleton instance to avoid creating multiple clients
 */
export function createClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}
