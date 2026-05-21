import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client — use inside 'use client' components and hooks.
 * Reads/writes session from browser cookies automatically.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL    ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}
