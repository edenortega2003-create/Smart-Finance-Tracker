'use client';

import { useEffect, useRef } from 'react';
import { useUser } from './useUser';
import { useStore } from '../store/useStore';
import { fetchTransactions, upsertTransaction } from '@/lib/sync/transactions';
import { fetchCustomHabits, upsertCustomHabit } from '@/lib/sync/customHabits';
import { fetchUserSettings, upsertUserSettings } from '@/lib/sync/settings';

/**
 * Fetches all cloud data for the signed-in user and merges it with localStorage.
 *
 * Merge rules:
 * - Cloud record exists locally   → cloud wins (authoritative source)
 * - Local record not in cloud     → upload to cloud, keep locally
 * - Legacy `category` field       → preserved from local if cloud version lacks it
 * - Settings                      → cloud wins; if no cloud record yet, upload local
 *
 * Called automatically on login and manually via syncNow().
 * Uses useStore.getState() / useStore.setState() so it works outside React
 * without triggering the per-action fireSync calls (no double-sync).
 */
async function hydrateFromCloud(): Promise<void> {
  useStore.getState().setSyncMeta({ isSyncing: true, syncError: null });

  try {
    const [txResult, habitResult, settingsResult] = await Promise.all([
      fetchTransactions(),
      fetchCustomHabits(),
      fetchUserSettings(),
    ]);

    // ── Transactions ──────────────────────────────────────────────────────────
    if (txResult.data && !txResult.error) {
      // Re-read state after awaits to capture any optimistic writes made during fetch
      const { transactions } = useStore.getState();
      const cloudIds = new Set(txResult.data.map(t => t.id));
      const localOnly = transactions.filter(t => !cloudIds.has(t.id));

      if (localOnly.length > 0) {
        await Promise.allSettled(localOnly.map(t => upsertTransaction(t)));
      }

      // Preserve legacy `category` field from local (not stored in cloud)
      const localMap = new Map(transactions.map(t => [t.id, t]));
      const mergedCloud = txResult.data.map(ct => {
        const local = localMap.get(ct.id);
        return local?.category ? { ...ct, category: local.category } : ct;
      });

      useStore.setState({ transactions: [...mergedCloud, ...localOnly] });
    }

    // ── Custom Habits ─────────────────────────────────────────────────────────
    if (habitResult.data && !habitResult.error) {
      const { customHabits } = useStore.getState();
      const cloudIds = new Set(habitResult.data.map(h => h.id));
      const localOnly = customHabits.filter(h => !cloudIds.has(h.id));

      if (localOnly.length > 0) {
        await Promise.allSettled(localOnly.map(h => upsertCustomHabit(h)));
      }

      useStore.setState({ customHabits: [...habitResult.data, ...localOnly] });
    }

    // ── Settings ──────────────────────────────────────────────────────────────
    if (settingsResult.data && !settingsResult.error) {
      useStore.setState({ settings: settingsResult.data });
    } else if (!settingsResult.error && !settingsResult.data) {
      // No cloud record yet → push local settings up
      upsertUserSettings(useStore.getState().settings).catch(() => {});
    }

    useStore.getState().setSyncMeta({
      isSyncing:  false,
      lastSyncAt: new Date().toISOString(),
      syncError:  null,
    });
  } catch {
    useStore.getState().setSyncMeta({
      isSyncing: false,
      syncError:  'Error de sincronización. Modo offline activo.',
    });
  }
}

/**
 * Activates cloud sync for the current session.
 *
 * - Automatically hydrates from Supabase when a user logs in
 * - Detects user switches and clears the previous user's local data first
 * - Exposes syncNow() for manual re-sync and reactive sync status fields
 *
 * Mount this hook once, high in the tree (AppLayout is the right place).
 */
export function useCloudSync() {
  const user = useUser();
  const hydratingRef = useRef(false);

  const isSyncing  = useStore(s => s.isSyncing);
  const lastSyncAt = useStore(s => s.lastSyncAt);
  const syncError  = useStore(s => s.syncError);

  useEffect(() => {
    if (!user?.id) {
      // Logged out — allow next login to re-hydrate
      hydratingRef.current = false;
      return;
    }

    const storedUserId = useStore.getState().currentUserId;

    // Different user logged in on this device → wipe the previous user's local data
    if (storedUserId && storedUserId !== user.id) {
      useStore.setState({ transactions: [], customHabits: [] });
    }

    // Persist the current user id (survives page refresh via Zustand persist)
    useStore.getState().setCurrentUserId(user.id);

    // Hydrate once per login event (guard against StrictMode double-invoke)
    if (!hydratingRef.current) {
      hydratingRef.current = true;
      hydrateFromCloud().finally(() => {
        hydratingRef.current = false;
      });
    }
  }, [user?.id]); // re-runs only when the signed-in user changes

  /** Force a full re-sync with Supabase right now. No-op if already syncing. */
  const syncNow = () => {
    if (!user?.id || hydratingRef.current) return;
    hydratingRef.current = true;
    hydrateFromCloud().finally(() => {
      hydratingRef.current = false;
    });
  };

  return { isSyncing, lastSyncAt, syncError, syncNow };
}
