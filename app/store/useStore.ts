'use client';

import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import { Transaction, Category, CustomHabit, AppSettings, Currency, Language } from '../types';
import { v4 as uuidv4 } from 'uuid';
/**
 * Fire-and-forget cloud sync.
 * Uses dynamic import so the Supabase browser client is never in the server bundle.
 * Returns early on SSR (typeof window === 'undefined'), so no server-side execution.
 */
function fireSync(fn: () => Promise<unknown>): void {
  if (typeof window === 'undefined') return;
  fn()
    .then((result) => {
      const r = result as { error?: unknown } | null | undefined;
      if (r?.error) console.error('[sync] fireSync error:', r.error);
    })
    .catch((err) => {
      console.error('[sync] fireSync rejected:', err);
    });
}

interface LoadingState {
  isLoading: boolean;
  message?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'overlay' | 'inline';
}

interface StoreState {
  transactions: Transaction[];
  categories: Category[];
  customHabits: CustomHabit[];
  settings: AppSettings;
  loading: LoadingState;
  /* Cloud sync status */
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
  currentUserId: string | null;
  /* Actions */
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addCustomHabit: (habit: CustomHabit) => void;
  updateCustomHabit: (habit: CustomHabit) => void;
  archiveCustomHabit: (id: string) => void;
  deleteCustomHabit: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  importData: (data: { transactions: Transaction[], categories: Category[], settings: AppSettings }) => void;
  clearAllData: () => void;
  setLoading: (loading: Partial<LoadingState>) => void;
  hideLoading: () => void;
  setSyncMeta: (meta: { isSyncing?: boolean; lastSyncAt?: string | null; syncError?: string | null }) => void;
  setCurrentUserId: (id: string | null) => void;
}

const customStorage: PersistStorage<StoreState> = {
  getItem: (name) => {
    const item = typeof window !== 'undefined' ? localStorage.getItem(name) : null;
    return item ? JSON.parse(item) : null;
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);
    }
  },
};

const defaultCategories: Category[] = [
  { id: uuidv4(), name: 'Rent',           description: 'Monthly rent payment',             type: 'expense' },
  { id: uuidv4(), name: 'Electric Bill',  description: 'Monthly electricity bill',          type: 'expense' },
  { id: uuidv4(), name: 'Internet Bill',  description: 'Monthly internet bill',             type: 'expense' },
  { id: uuidv4(), name: 'Groceries',      description: 'Daily food and household items',    type: 'expense' },
  { id: uuidv4(), name: 'Salary',         description: 'Monthly income from job',           type: 'income'  },
];

// ─── Cloud sync points ────────────────────────────────────────────────────────
//
// Each store action writes to Zustand/localStorage first (optimistic), then calls
// the corresponding Supabase helper via fireSync (fire-and-forget).
//
// Action               → lib/sync helper
// ─────────────────────────────────────────────────────────────────────────────
// addTransaction       → upsertTransaction
// updateTransaction    → upsertTransaction
// deleteTransaction    → deleteTransactionCloud
// addCustomHabit       → upsertCustomHabit
// updateCustomHabit    → upsertCustomHabit
// archiveCustomHabit   → archiveCustomHabitCloud
// deleteCustomHabit    → deleteCustomHabitCloud
// updateSettings       → upsertUserSettings
//
// categories are NOT synced (no cloud table — legacy field, local-only).
// hydration is handled by hooks/useCloudSync.ts on login.
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      transactions:  [],
      categories:    defaultCategories,
      customHabits:  [],
      settings: {
        currency:  Currency.MXN,
        userName:  'Usuario',
        language:  Language.ES,
      },
      loading:       { isLoading: false },
      isSyncing:     false,
      lastSyncAt:    null,
      syncError:     null,
      currentUserId: null,

      addTransaction: (transaction) => {
        set((state) => ({ transactions: [...state.transactions, transaction] }));
        fireSync(() =>
          import('@/lib/sync/transactions').then(m => m.upsertTransaction(transaction))
        );
      },
      updateTransaction: (updatedTransaction) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === updatedTransaction.id ? updatedTransaction : t
          ),
        }));
        fireSync(() =>
          import('@/lib/sync/transactions').then(m => m.upsertTransaction(updatedTransaction))
        );
      },
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        fireSync(() =>
          import('@/lib/sync/transactions').then(m => m.deleteTransactionCloud(id))
        );
      },

      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (updatedCategory) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === updatedCategory.id ? updatedCategory : c
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addCustomHabit: (habit) => {
        set((state) => ({ customHabits: [...state.customHabits, habit] }));
        fireSync(() =>
          import('@/lib/sync/customHabits').then(m => m.upsertCustomHabit(habit))
        );
      },
      updateCustomHabit: (updated) => {
        set((state) => ({
          customHabits: state.customHabits.map((h) =>
            h.id === updated.id ? updated : h
          ),
        }));
        fireSync(() =>
          import('@/lib/sync/customHabits').then(m => m.upsertCustomHabit(updated))
        );
      },
      archiveCustomHabit: (id) => {
        set((state) => ({
          customHabits: state.customHabits.map((h) =>
            h.id === id ? { ...h, archived: true } : h
          ),
        }));
        fireSync(() =>
          import('@/lib/sync/customHabits').then(m => m.archiveCustomHabitCloud(id))
        );
      },
      deleteCustomHabit: (id) => {
        set((state) => ({ customHabits: state.customHabits.filter((h) => h.id !== id) }));
        fireSync(() =>
          import('@/lib/sync/customHabits').then(m => m.deleteCustomHabitCloud(id))
        );
      },

      updateSettings: (settings) => {
        set({ settings });
        fireSync(() =>
          import('@/lib/sync/settings').then(m => m.upsertUserSettings(settings))
        );
      },

      importData: (data) =>
        set({ transactions: data.transactions, categories: data.categories, settings: data.settings }),
      clearAllData: () => set({ transactions: [], categories: [] }),

      setLoading: (loading) =>
        set((state) => ({
          loading: { ...state.loading, isLoading: true, ...loading },
        })),
      hideLoading: () =>
        set((state) => ({
          loading: { ...state.loading, isLoading: false },
        })),

      setSyncMeta: (meta) =>
        set((state) => ({
          isSyncing:  meta.isSyncing  !== undefined ? meta.isSyncing  : state.isSyncing,
          lastSyncAt: 'lastSyncAt' in meta           ? meta.lastSyncAt : state.lastSyncAt,
          syncError:  'syncError'  in meta           ? meta.syncError  : state.syncError,
        })),

      setCurrentUserId: (id) => set({ currentUserId: id }),
    }),
    {
      name:    'expense-tracker-storage',
      storage: customStorage,
    }
  )
);
