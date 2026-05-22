import { createClient } from '@/lib/supabase/client';
import type { AppSettings } from '@/app/types';

interface UserSettingsRow {
  user_id: string;
  currency: string;
  user_name: string;
  language: string;
  updated_at: string;
}

function toRow(
  s: AppSettings,
  userId: string,
): Omit<UserSettingsRow, 'updated_at'> {
  return {
    user_id:   userId,
    currency:  s.currency,
    user_name: s.userName,
    language:  s.language,
  };
}

function fromRow(row: UserSettingsRow): AppSettings {
  return {
    currency: row.currency as AppSettings['currency'],
    userName: row.user_name,
    language: row.language as AppSettings['language'],
  };
}

/** Insert or update the user's settings in Supabase. */
export async function upsertUserSettings(settings: AppSettings) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return { error: authError };

  return supabase
    .from('user_settings')
    .upsert(toRow(settings, user.id), { onConflict: 'user_id' });
}

/** Fetch settings for the signed-in user. Returns null if none saved yet. */
export async function fetchUserSettings(): Promise<{
  data: AppSettings | null;
  error: unknown;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .maybeSingle();

  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };
  return { data: fromRow(data as UserSettingsRow), error: null };
}
