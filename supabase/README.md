# MentHabit — Supabase Setup

## 1. Run the schema

1. Go to your Supabase project → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

The script is idempotent (`create table if not exists`, `create or replace`). Safe to run again if needed.

---

## 2. Tables

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `transactions` | `uuid` (client-generated) | One row per transaction; scoped to `user_id` |
| `custom_habits` | `uuid` (client-generated) | Custom habit categories; scoped to `user_id` |
| `user_settings` | `user_id` (1:1 with auth.users) | Currency, name, language preferences |

### Column mapping (TypeScript → Postgres)

**Transaction**

| TS field | DB column |
|----------|-----------|
| `id` | `id` |
| `date` | `date` |
| `amount` | `amount` |
| `type` | `type` |
| `concept` | `concept` |
| `classification` | `classification` |
| `regularity` | `regularity` |
| `notes` | `notes` |
| `habitCategory` | `habit_category` |
| `category` | *(not synced — legacy localStorage only)* |

**CustomHabit**

| TS field | DB column |
|----------|-----------|
| `accentColor` | `accent_color` |
| `bgColor` | `bg_color` |
| `borderColor` | `border_color` |
| `createdAt` | `created_at` |
| everything else | same name |

**AppSettings**

| TS field | DB column |
|----------|-----------|
| `userName` | `user_name` |
| everything else | same name |

---

## 3. RLS policies

Every table has **Row Level Security enabled** with four policies:

- `SELECT` — `auth.uid() = user_id`
- `INSERT` — `auth.uid() = user_id`
- `UPDATE` — `auth.uid() = user_id`
- `DELETE` — `auth.uid() = user_id` (user_settings has no DELETE policy — use `auth.users` cascade)

Users can only read and write their own rows. The anon key is safe to expose in the browser.

---

## 4. Triggers

`update_updated_at_column()` fires `BEFORE UPDATE` on all three tables and sets `updated_at = now()`. You never need to pass `updated_at` in your payloads.

---

## 5. Sync helpers (`lib/sync/`)

| File | Exported functions |
|------|--------------------|
| `transactions.ts` | `upsertTransaction`, `deleteTransactionCloud`, `fetchTransactions` |
| `customHabits.ts` | `upsertCustomHabit`, `archiveCustomHabitCloud`, `deleteCustomHabitCloud`, `fetchCustomHabits` |
| `settings.ts` | `upsertUserSettings`, `fetchUserSettings` |

All functions use the **browser Supabase client** (`lib/supabase/client.ts`). They are called from client components and call `supabase.auth.getUser()` internally to get the current user id.

**Pattern:** write to Zustand/localStorage first (optimistic), then call the sync helper fire-and-forget. On error, optionally roll back the store or surface a toast.

---

## 6. Testing with two users

1. Create user A and user B via `/signup`
2. Log in as user A, add transactions → verify they appear in the Supabase dashboard under user A's `user_id`
3. Log in as user B → verify you cannot see user A's rows (RLS enforced)
4. Verify localStorage remains independent per browser profile

---

## 7. Phase C — next steps

- Wire sync helpers into the Zustand store actions (fire-and-forget after each `set()`)
- Add `fetchTransactions()` call on app mount to hydrate from cloud when online
- Add a sync status indicator (last synced time)
- Handle conflict resolution: last-write-wins by `updated_at` comparison
- Consider `lib/sync/syncQueue.ts` for offline queuing (retry on reconnect)
