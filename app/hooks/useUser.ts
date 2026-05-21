'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * Returns the currently authenticated user (null while loading or signed out).
 * Subscribes to Supabase auth state changes so the value updates on
 * sign-in / sign-out without a page reload.
 */
export function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    /* Initial fetch */
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    /* Live subscription */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null),
    );

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
