import { createClient } from '@/lib/supabase/client';
import type { Transaction } from '@/app/types';

interface TransactionRow {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  type: string;
  concept: string;
  classification: string;
  regularity: string;
  notes: string | null;
  habit_category: string | null;
  created_at: string;
  updated_at: string;
}

function toRow(
  t: Transaction,
  userId: string,
): Omit<TransactionRow, 'created_at' | 'updated_at'> {
  return {
    id:             t.id,
    user_id:        userId,
    date:           t.date,
    amount:         t.amount,
    type:           t.type,
    concept:        t.concept,
    classification: t.classification,
    regularity:     t.regularity,
    notes:          t.notes ?? null,
    habit_category: t.habitCategory ?? null,
  };
}

function fromRow(row: TransactionRow): Transaction {
  return {
    id:             row.id,
    date:           row.date,
    amount:         Number(row.amount),
    type:           row.type as Transaction['type'],
    concept:        row.concept,
    classification: row.classification as Transaction['classification'],
    regularity:     row.regularity as Transaction['regularity'],
    notes:          row.notes ?? undefined,
    habitCategory:  row.habit_category ?? undefined,
  };
}

/** Insert or update a single transaction in Supabase. */
export async function upsertTransaction(transaction: Transaction) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) return { error: authError };

  const result = await supabase
    .from('transactions')
    .upsert(toRow(transaction, user.id), { onConflict: 'id' });
  if (result.error) console.error('[sync] upsertTransaction error:', result.error);
  return result;
}

/** Hard-delete a transaction by id from Supabase. */
export async function deleteTransactionCloud(id: string) {
  const supabase = createClient();
  return supabase.from('transactions').delete().eq('id', id);
}

/** Fetch all transactions for the signed-in user, newest date first. */
export async function fetchTransactions(): Promise<{
  data: Transaction[] | null;
  error: unknown;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) return { data: null, error };
  return { data: (data as TransactionRow[]).map(fromRow), error: null };
}
