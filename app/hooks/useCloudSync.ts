'use client';

import { useEffect, useRef } from 'react';
import { useUser } from './useUser';
import { useStore } from '../store/useStore';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Fetches all cloud data for the signed-in user and merges it with localStorage.
 *
 * Merge rules:
 * - Cloud record exists locally   → cloud wins (authoritative source)
 * - Local record not in cloud     → upload to cloud, keep locally
 * - Legacy `category` field       → preserved from local if cloud version lacks it
 * - Settings                      → cloud wins; if no cloud record yet, upload local
 *
 * Called automatically on login, on manual syncNow(), and when the device
 * comes back online after being offline.
 */
async function hydrateFromCloud(): Promise<void> {
  useStore.getState().setSyncMeta({ isSyncing: true, syncError: null });

  try {
    const [syncTx, syncHabits, syncSettings] = await Promise.all([
      import('@/lib/sync/transactions'),
      import('@/lib/sync/customHabits'),
      import('@/lib/sync/settings'),
    ]);

    const [txResult, habitResult, settingsResult] = await Promise.all([
      syncTx.fetchTransactions(),
      syncHabits.fetchCustomHabits(),
      syncSettings.fetchUserSettings(),
    ]);

    // ── Transactions ──────────────────────────────────────────────────────────
    if (txResult.data && !txResult.error) {
      const { transactions } = useStore.getState();
      const cloudIds = new Set(txResult.data.map(t => t.id));
      const localOnly = transactions.filter(t => !cloudIds.has(t.id));

      if (localOnly.length > 0) {
        await Promise.allSettled(localOnly.map(t => syncTx.upsertTransaction(t)));
      }

      // Re-read AFTER upload to capture any writes that happened during the await
      const afterUploadState = useStore.getState();
      const currentLocalOnly = afterUploadState.transactions.filter(t => !cloudIds.has(t.id));

      // Preserve legacy `category` field from local (not stored in cloud)
      const localMap = new Map(afterUploadState.transactions.map(t => [t.id, t]));
      const mergedCloud = txResult.data.map(ct => {
        const local = localMap.get(ct.id);
        return local?.category ? { ...ct, category: local.category } : ct;
      });

      useStore.setState({ transactions: [...mergedCloud, ...currentLocalOnly] });
    }

    // ── Custom Habits ─────────────────────────────────────────────────────────
    if (habitResult.data && !habitResult.error) {
      const { customHabits } = useStore.getState();
      const cloudIds = new Set(habitResult.data.map(h => h.id));
      const localOnly = customHabits.filter(h => !cloudIds.has(h.id));

      if (localOnly.length > 0) {
        await Promise.allSettled(localOnly.map(h => syncHabits.upsertCustomHabit(h)));
      }

      const afterUploadHabits = useStore.getState().customHabits.filter(h => !cloudIds.has(h.id));
      useStore.setState({ customHabits: [...habitResult.data, ...afterUploadHabits] });
    }

    // ── Settings ──────────────────────────────────────────────────────────────
    if (settingsResult.data && !settingsResult.error) {
      useStore.setState({ settings: settingsResult.data });
    } else if (!settingsResult.error && !settingsResult.data) {
      // No cloud record yet → push local settings up
      syncSettings.upsertUserSettings(useStore.getState().settings).catch(() => {});
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
 * - Auto-retries sync when the device comes back online
 * - Exposes syncNow() for manual re-sync and reactive sync status fields
 *
 * Mount this hook once, high in the tree (AppLayout is the right place).
 */
export function useCloudSync() {
  const user         = useUser();
  const isOnline     = useOnlineStatus();
  const hydratingRef = useRef(false);
  const wasOfflineRef = useRef(false);

  const isSyncing  = useStore(s => s.isSyncing);
  const lastSyncAt = useStore(s => s.lastSyncAt);
  const syncError  = useStore(s => s.syncError);

  // Hydrate once when a user logs in
  useEffect(() => {
    if (!user?.id) {
      hydratingRef.current = false;
      return;
    }

    const storedUserId = useStore.getState().currentUserId;

    // Different user logged in on this device → wipe the previous user's local data
    if (storedUserId && storedUserId !== user.id) {
      useStore.setState({ transactions: [], customHabits: [] });
    }

    useStore.getState().setCurrentUserId(user.id);

    if (!hydratingRef.current) {
      hydratingRef.current = true;
      hydrateFromCloud().finally(() => {
        hydratingRef.current = false;
      });
    }
  }, [user?.id]);

  // Auto-retry sync when the device comes back online
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (wasOfflineRef.current && user?.id && !hydratingRef.current) {
      wasOfflineRef.current = false;
      hydratingRef.current  = true;
      hydrateFromCloud().finally(() => {
        hydratingRef.current = false;
      });
    }
  }, [isOnline, user?.id]);

  /** Force a full re-sync with Supabase right now. No-op if already syncing. */
  const syncNow = () => {
    if (!user?.id || hydratingRef.current) return;
    hydratingRef.current = true;
    hydrateFromCloud().finally(() => {
      hydratingRef.current = false;
    });
  };

  return { isSyncing, lastSyncAt, syncError, syncNow, isOnline };
}
