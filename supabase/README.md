# MentHabit — Supabase Setup

## 1. Run the schema

1. Go to your Supabase project → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

The script is idempotent (`create table if not exists`, `create or replace`). Safe to run again.

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

Every table has **Row Level Security enabled** with policies scoped to `auth.uid() = user_id`. Users can only read and write their own rows. The anon key is safe to expose in the browser.

---

## 4. Triggers

`update_updated_at_column()` fires `BEFORE UPDATE` on all three tables and sets `updated_at = now()`. Never pass `updated_at` in write payloads.

---

## 5. Sync helpers (`lib/sync/`)

| File | Exported functions |
|------|--------------------|
| `transactions.ts` | `upsertTransaction`, `deleteTransactionCloud`, `fetchTransactions` |
| `customHabits.ts` | `upsertCustomHabit`, `archiveCustomHabitCloud`, `deleteCustomHabitCloud`, `fetchCustomHabits` |
| `settings.ts` | `upsertUserSettings`, `fetchUserSettings` |

All use the browser Supabase client (`lib/supabase/client.ts`) and call `supabase.auth.getUser()` internally.

---

## 6. Phase C — Hybrid sync (implemented)

### Architecture

```
User action
    │
    ▼
Store action (addTransaction, etc.)
    │
    ├─► Set Zustand state (synchronous, immediate)
    │       └─► Persist middleware saves to localStorage
    │
    └─► fireSync() — fire-and-forget async
            └─► Supabase upsert/delete (silently fails if offline)
```

### Offline-first guarantee

- The UI always reads from Zustand (in-memory + localStorage).
- Supabase sync is strictly additive — it never blocks the UI.
- If offline: store actions work normally, Supabase calls fail silently.
- On reconnect: next `syncNow()` or next login re-hydrates from cloud.

### Hydration on login (`useCloudSync.ts`)

When a user logs in, `useCloudSync` (mounted in AppLayout) runs `hydrateFromCloud()`:

```
fetchTransactions() ──┐
fetchCustomHabits() ──┤── Promise.all
fetchUserSettings() ──┘
         │
         ▼
  For transactions:
    cloud records → cloud wins for shared ids (legacy `category` preserved from local)
    local-only    → upload to Supabase, keep in store
         │
  For custom_habits:
    same merge strategy
         │
  For settings:
    cloud exists  → cloud wins, overwrite local
    cloud empty   → upload local to cloud
         │
         ▼
  useStore.setState({ ... }) — updates Zustand + localStorage
```

### User switch detection

`currentUserId` is persisted in `'expense-tracker-storage'` (localStorage). On login:
- If `currentUserId !== newUser.id` → wipe `transactions` and `customHabits` before hydrating
- Ensures different users on the same device don't see each other's data

### Sync status

The store exposes three reactive fields:

| Field | Type | Description |
|-------|------|-------------|
| `isSyncing` | `boolean` | True during active cloud hydration |
| `lastSyncAt` | `string \| null` | ISO timestamp of last successful sync |
| `syncError` | `string \| null` | Last error message, null if clean |

Access via `useStore(s => s.isSyncing)` etc. or via `useCloudSync()` hook.

### `useCloudSync` hook

Mount once in `AppLayout`. Returns:

```typescript
const { isSyncing, lastSyncAt, syncError, syncNow } = useCloudSync();
```

- `isSyncing` — show a loading indicator while hydrating
- `lastSyncAt` — display "last synced" timestamp in Settings
- `syncError` — surface offline warning if needed
- `syncNow()` — force re-sync (e.g., pull-to-refresh)

### Conflict resolution

Current strategy: **cloud wins** for any record that exists in both stores.

Rationale: Supabase is the authoritative source. Local writes are eventually consistent — they go to Supabase via `fireSync` within milliseconds. The only case where local wins is if the record has never been uploaded (local-only), in which case it's uploaded during hydration.

Phase D will add `updated_at` comparison for true last-write-wins.

### What is NOT synced

- `categories` — legacy/local-only, no cloud table
- `loading` state — runtime only
- Default UUIDs for built-in categories — regenerated each module load

---

## 7. Testing with two users

1. Create user A and user B via `/signup`
2. Log in as user A, add transactions → they appear in Supabase and localStorage
3. Log out → log in as user B → previous data is cleared, user B's cloud data loads
4. Verify in Supabase: each user's rows have `user_id = their own UUID`
5. Test offline: disable network → add transaction → re-enable → call `syncNow()`

---

## 8. Phase D — next steps

- Add `updated_at` to TypeScript types for per-record conflict resolution
- Implement `lib/sync/syncQueue.ts` — queue failed syncs, retry on reconnect
- Add Supabase Realtime subscription for multi-device sync
- Show `lastSyncAt` in Settings UI
- Pull-to-refresh gesture on mobile triggers `syncNow()`
- Vercel deployment with production environment variables
