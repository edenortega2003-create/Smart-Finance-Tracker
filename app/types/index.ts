export type TransactionType = 'income' | 'expense';

export type ExpenseClassification =
  | 'hormiga'
  | 'fijo'
  | 'variable'
  | 'esporadico'
  | 'inversion'
  | 'deuda'
  | 'ahorro'
  | 'otro';

export type IncomeClassification =
  | 'sueldo'
  | 'venta'
  | 'regalo'
  | 'inversion'
  | 'reembolso'
  | 'otro';

export type Regularity =
  | 'regular'
  | 'no_regular'
  | 'recurrente'
  | 'eventual';

export interface Category {
  id: string;
  name: string;
  description?: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  concept: string;
  classification: ExpenseClassification | IncomeClassification;
  regularity: Regularity;
  notes?: string;
  category?: Category; // legacy: kept for compat with data already in localStorage
}

export enum Currency {
  BDT = 'BDT ৳',
  USD = 'USD $',
  EUR = 'EUR €',
  GBP = 'GBP £',
  JPY = 'JPY ¥',
}

export enum Language {
  EN = 'English',
  BN = 'Bangla',
  NL = 'Dutch',
  ES = 'Spanish',
  PT = 'Portuguese',
  AR = 'Arabic',
}

export interface AppSettings {
  currency: Currency;
  userName: string;
  language: Language;
}
