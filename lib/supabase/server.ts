import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server client — use in Server Components, Route Handlers, and middleware.
 * Reads session from request cookies; sets refreshed cookies in response.
 *
 * Phase B entry point: import this in lib/sync/ helpers to make
 * authenticated Supabase calls from server-side sync actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL    ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll()          { return cookieStore.getAll(); },
        setAll(list)      {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot mutate cookies — only middleware/route handlers can.
          }
        },
      },
    },
  );
}
