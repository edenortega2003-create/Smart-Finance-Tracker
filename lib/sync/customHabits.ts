import { createClient } from '@/lib/supabase/client';
import type { CustomHabit } from '@/app/types';

interface CustomHabitRow {
  id: string;
  user_id: string;
  label: string;
  emoji: string;
  accent_color: string;
  bg_color: string;
  border_color: string;
  type: string;
  description: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

function toRow(
  h: CustomHabit,
  userId: string,
): Omit<CustomHabitRow, 'updated_at'> {
  return {
    id:           h.id,
    user_id:      userId,
    label:        h.label,
    emoji:        h.emoji,
    accent_color: h.accentColor,
    bg_color:     h.bgColor,
    border_color: h.borderColor,
    type:         h.type,
    description:  h.description ?? null,
    archived:     h.archived,
    created_at:   h.createdAt,
  };
}

function fromRow(row: CustomHabitRow): CustomHabit {
  return {
    id:          row.id,
    label:       row.label,
    emoji:       row.emoji,
    accentColor: row.accent_color,
    bgColor:     row.bg_color,
    borderColor: row.border_color,
    type:        row.type as CustomHabit['type'],
    description: row.description ?? undefined,
    archived:    row.archived,
    createdAt:   row.created_at,
  };
}

/** Insert or update a custom habit in Supabase. */
export async function upsertCustomHabit(habit: CustomHabit) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return { error: authError };

  const result = await supabase
    .from('custom_habits')
    .upsert(toRow(habit, user.id), { onConflict: 'id' });
  if (result.error) console.error('[sync] upsertCustomHabit error:', result.error);
  return result;
}

/** Mark a custom habit as archived in Supabase (soft delete). */
export async function archiveCustomHabitCloud(id: string) {
  const supabase = createClient();
  return supabase
    .from('custom_habits')
    .update({ archived: true })
    .eq('id', id);
}

/** Hard-delete a custom habit by id from Supabase. */
export async function deleteCustomHabitCloud(id: string) {
  const supabase = createClient();
  return supabase.from('custom_habits').delete().eq('id', id);
}

/** Fetch all custom habits for the signed-in user, oldest first. */
export async function fetchCustomHabits(): Promise<{
  data: CustomHabit[] | null;
  error: unknown;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('custom_habits')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return { data: null, error };
  return { data: (data as CustomHabitRow[]).map(fromRow), error: null };
}
