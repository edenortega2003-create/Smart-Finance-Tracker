import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import { Transaction, Category, CustomHabit, AppSettings, Currency, Language } from '../types';
import { v4 as uuidv4 } from 'uuid';

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
  {
    id: uuidv4(),
    name: 'Rent',
    description: 'Monthly rent payment',
    type: 'expense',
  },
  {
    id: uuidv4(),
    name: 'Electric Bill',
    description: 'Monthly electricity bill',
    type: 'expense',
  },
  {
    id: uuidv4(),
    name: 'Internet Bill',
    description: 'Monthly internet bill',
    type: 'expense',
  },
  {
    id: uuidv4(),
    name: 'Groceries',
    description: 'Daily food and household items',
    type: 'expense',
  },
  {
    id: uuidv4(),
    name: 'Salary',
    description: 'Monthly income from job',
    type: 'income',
  }
];

// ─── Cloud sync points (for future Supabase integration) ─────────────────────
//
// Each action below maps directly to a Supabase operation.
// The sync pattern will be: write to Zustand/localStorage first (optimistic),
// then call the corresponding async sync helper from lib/sync/.
//
// Action                → Supabase table / operation
// ─────────────────────────────────────────────────────────────────────────────
// addTransaction        → INSERT public.transactions        (upsert by UUID id)
// updateTransaction     → UPDATE public.transactions        (match by id)
// deleteTransaction     → DELETE public.transactions        (match by id)
// addCustomHabit        → INSERT public.custom_habits       (upsert by UUID id)
// updateCustomHabit     → UPDATE public.custom_habits       (match by id)
// archiveCustomHabit    → UPDATE public.custom_habits       (set archived=true)
// deleteCustomHabit     → DELETE public.custom_habits       (match by id)
// updateSettings        → UPSERT public.user_settings       (match by user_id)
//
// All UUIDs are already assigned client-side (uuidv4), making every write
// idempotent — safe to retry on reconnect without duplicates.
//
// Future entry point: wrap each set() call with a queueSync(action, payload)
// call inside lib/sync/syncQueue.ts. No action signatures need to change.
// ─────────────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      transactions: [],
      categories: defaultCategories,
      customHabits: [],
      settings: {
        currency: Currency.MXN,
        userName: 'Usuario',
        language: Language.ES,
      },
      loading: {
        isLoading: false,
      },
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [...state.transactions, transaction],
        })),
      updateTransaction: (updatedTransaction) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === updatedTransaction.id ? updatedTransaction : transaction
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter(
            (transaction) => transaction.id !== id
          ),
        })),
      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),
      updateCategory: (updatedCategory) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === updatedCategory.id ? updatedCategory : category
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        })),
      addCustomHabit: (habit) =>
        set((state) => ({
          customHabits: [...state.customHabits, habit],
        })),
      updateCustomHabit: (updated) =>
        set((state) => ({
          customHabits: state.customHabits.map((h) =>
            h.id === updated.id ? updated : h
          ),
        })),
      archiveCustomHabit: (id) =>
        set((state) => ({
          customHabits: state.customHabits.map((h) =>
            h.id === id ? { ...h, archived: true } : h
          ),
        })),
      deleteCustomHabit: (id) =>
        set((state) => ({
          customHabits: state.customHabits.filter((h) => h.id !== id),
        })),
      updateSettings: (settings) => set({ settings }),
      importData: (data) => set({ transactions: data.transactions, categories: data.categories, settings: data.settings }),
      clearAllData: () => set({ transactions: [], categories: [] }),
      setLoading: (loading) => 
        set((state) => ({
          loading: { ...state.loading, isLoading: true, ...loading },
        })),
      hideLoading: () => 
        set((state) => ({
          loading: { ...state.loading, isLoading: false },
        })),
    }),
    {
      name: 'expense-tracker-storage', // unique name for localStorage key
      storage: customStorage, // specify customStorage as the storage medium
    }
  )
);
