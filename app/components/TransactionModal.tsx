'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import {
  Transaction,
  TransactionType,
  ExpenseClassification,
  IncomeClassification,
  Regularity,
} from '../types';
import { useStore } from '../store/useStore';
import {
  suggestFromConcept,
  expenseClassificationLabels,
  incomeClassificationLabels,
  regularityLabels,
} from '../utils/classifySuggestion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModalTransactionState {
  id?: string;
  date: string;
  amount: string;
  type: TransactionType;
  concept: string;
  classification: ExpenseClassification | IncomeClassification;
  regularity: Regularity;
  notes?: string;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Omit<Transaction, 'id'> | Transaction | null;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialState(
  t: Omit<Transaction, 'id'> | Transaction | null,
): ModalTransactionState {
  if (t) {
    const existing = t as Transaction;
    const concept   = existing.concept ?? existing.category?.name ?? '';
    const suggested = suggestFromConcept(concept, existing.type);
    return {
      ...(existing.id ? { id: existing.id } : {}),
      date:           existing.date,
      amount:         String(existing.amount),
      type:           existing.type,
      concept,
      classification: existing.classification ?? suggested.classification,
      regularity:     existing.regularity     ?? suggested.regularity,
      notes:          existing.notes ?? '',
    };
  }
  return {
    date:           new Date().toISOString().split('T')[0],
    amount:         '',
    type:           'expense',
    concept:        '',
    classification: 'otro',
    regularity:     'no_regular',
    notes:          '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionModal({
  open,
  onClose,
  transaction: initialTransaction,
  showSnackbar,
}: TransactionModalProps) {
  const { addTransaction, updateTransaction } = useStore();
  const { t } = useTranslation();
  const conceptRef = useRef<HTMLInputElement>(null);

  const [transaction, setTransaction] = useState<ModalTransactionState>(
    () => buildInitialState(initialTransaction),
  );

  // Dedicated portal div — avoids Next.js React-root conflict with document.body
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-tx-panel', '');
    document.body.appendChild(el);
    setPortalEl(el);
    return () => { el.remove(); };
  }, []);

  // ─── Handlers (unchanged) ─────────────────────────────────────────────────

  const handleTypeSelect = (newType: TransactionType) => {
    const suggested = suggestFromConcept(transaction.concept, newType);
    setTransaction(prev => ({
      ...prev,
      type:           newType,
      classification: suggested.classification,
      regularity:     suggested.regularity,
    }));
  };

  const handleConceptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const concept = e.target.value;
    setTransaction(prev => {
      const suggested = suggestFromConcept(concept, prev.type);
      return { ...prev, concept, classification: suggested.classification, regularity: suggested.regularity };
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setTransaction(prev => ({ ...prev, amount: value }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTransaction(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransaction(prev => ({ ...prev, date: e.target.value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTransaction(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleSave = () => {
    if (!transaction.concept.trim()) {
      showSnackbar('El concepto es requerido', 'error');
      return;
    }
    const amountAsNumber = parseFloat(transaction.amount);
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      showSnackbar('Ingresa un monto válido', 'error');
      return;
    }

    const transactionToSave: Transaction = {
      id:             transaction.id ?? uuidv4(),
      date:           transaction.date,
      amount:         amountAsNumber,
      type:           transaction.type,
      concept:        transaction.concept.trim(),
      classification: transaction.classification,
      regularity:     transaction.regularity,
      notes:          transaction.notes,
      category: { id: 'legacy', name: transaction.concept.trim(), type: transaction.type },
    };

    if (transaction.id) {
      updateTransaction(transactionToSave);
      showSnackbar(t.transaction_updated_successfully, 'success');
    } else {
      addTransaction(transactionToSave);
      showSnackbar(t.transaction_added_successfully, 'success');
    }
    onClose();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!open || !portalEl) return null;

  const isExpense = transaction.type === 'expense';
  const classificationOptions =
    transaction.type === 'expense'
      ? Object.entries(expenseClassificationLabels)
      : Object.entries(incomeClassificationLabels);

  // Psychologically calm: rose (not alarm red) for expense, emerald for income
  const amountColor = isExpense ? '#F43F5E' : '#059669';

  return createPortal(
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
        style={{
          position:              'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex:                9998,
          backgroundColor:       'rgba(0,0,0,0.45)',
          backdropFilter:        'blur(4px)',
          WebkitBackdropFilter:  'blur(4px)',
          cursor:                'default',
        }}
      />

      {/* ── Full-screen layer (pointer-events:none) ─────────────────────── */}
      <div
        style={{
          position:      'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex:        9999,
          pointerEvents: 'none',
        }}
      >
        {/* ── Panel — anchored to right edge, full height ─────────────── */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-panel-title"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          style={{
            position:        'absolute',
            top: 0, right: 0, bottom: 0,
            width:           '100%',
            maxWidth:        '480px',
            pointerEvents:   'auto',
            // Visual
            display:         'flex',
            flexDirection:   'column',
            backgroundColor: '#ffffff',
            borderLeft:      '1px solid rgba(0,0,0,0.07)',
            boxShadow:       '-8px 0 40px rgba(0,0,0,0.10), -2px 0 8px rgba(0,0,0,0.05)',
            overflow:        'hidden',
          }}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div
            style={{
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              padding:        '20px 24px 18px',
              borderBottom:   '1px solid rgba(0,0,0,0.06)',
              flexShrink:     0,
              backgroundColor: '#ffffff',
            }}
          >
            <div>
              <h2
                id="tx-panel-title"
                style={{
                  margin:        0,
                  fontSize:      '17px',
                  fontWeight:    600,
                  color:         '#111827',
                  letterSpacing: '-0.01em',
                  lineHeight:    1.3,
                }}
              >
                {transaction.id ? t.edit_transaction : t.add_new_transaction}
              </h2>
              <p
                style={{
                  margin:     '4px 0 0',
                  fontSize:   '13px',
                  color:      '#9CA3AF',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {transaction.id
                  ? 'Actualiza los detalles del movimiento'
                  : 'Registra un nuevo movimiento financiero'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={cn(
                'flex-shrink-0 ml-4 mt-0.5 p-1.5 rounded-lg text-gray-400 transition-colors',
                'hover:text-gray-700 hover:bg-gray-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              )}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div
            style={{
              flex:           '1 1 0%',
              overflowY:      'auto',
              padding:        '24px',
              display:        'flex',
              flexDirection:  'column',
              gap:            '24px',
              minHeight:      0,
            }}
          >
            {/* Tipo */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2.5">Tipo</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={isExpense}
                  onClick={() => handleTypeSelect('expense')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl text-sm font-semibold',
                    'border-2 transition-all duration-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
                  )}
                  style={{
                    height:          '44px',
                    // Soft rose palette — no alarm red
                    backgroundColor: isExpense ? '#FFF1F2' : '#ffffff',
                    color:           isExpense ? '#E11D48' : '#A1A1AA',
                    borderColor:     isExpense ? '#F43F5E' : '#F4F4F5',
                  }}
                >
                  <TrendingDown size={15} aria-hidden="true" />
                  Gasto
                </button>
                <button
                  type="button"
                  aria-pressed={!isExpense}
                  onClick={() => handleTypeSelect('income')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl text-sm font-semibold',
                    'border-2 transition-all duration-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400',
                  )}
                  style={{
                    height:          '44px',
                    backgroundColor: !isExpense ? '#F0FDF4' : '#ffffff',
                    color:           !isExpense ? '#16A34A' : '#9CA3AF',
                    borderColor:     !isExpense ? '#22C55E' : '#F3F4F6',
                  }}
                >
                  <TrendingUp size={15} aria-hidden="true" />
                  Ingreso
                </button>
              </div>
            </div>

            {/* Monto — hero field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tx-amount"
                className="text-sm font-medium text-gray-700"
              >
                {t.amount}
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position:      'absolute',
                    top: 0, left: '14px', bottom: 0,
                    display:       'flex',
                    alignItems:    'center',
                    fontSize:      '20px',
                    fontWeight:    600,
                    color:         amountColor,
                    pointerEvents: 'none',
                    lineHeight:    1,
                  }}
                >
                  $
                </span>
                <input
                  id="tx-amount"
                  inputMode="decimal"
                  type="text"
                  placeholder="0.00"
                  value={transaction.amount}
                  onChange={handleAmountChange}
                  style={{
                    width:        '100%',
                    height:       '56px',
                    paddingLeft:  '36px',
                    paddingRight: '16px',
                    fontSize:     '28px',
                    fontWeight:   600,
                    fontVariantNumeric: 'tabular-nums',
                    color:        amountColor,
                    border:       '1.5px solid rgba(0,0,0,0.10)',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    outline:      'none',
                    transition:   'border-color 100ms, box-shadow 100ms',
                    boxSizing:    'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(0,0,0,0.10)';
                    e.target.style.boxShadow   = 'none';
                  }}
                />
              </div>
            </div>

            {/* Concepto */}
            <Input
              ref={conceptRef}
              label="Concepto"
              placeholder="café, renta, gasolina..."
              value={transaction.concept}
              onChange={handleConceptChange}
            />

            {/* Clasificación */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tx-classification"
                className="text-sm font-medium text-gray-700"
              >
                Clasificación
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="tx-classification"
                  name="classification"
                  value={transaction.classification}
                  onChange={handleSelectChange}
                  style={{
                    width:           '100%',
                    height:          '44px',
                    padding:         '0 36px 0 14px',
                    fontSize:        '14px',
                    color:           '#111827',
                    border:          '1.5px solid rgba(0,0,0,0.10)',
                    borderRadius:    '10px',
                    backgroundColor: '#ffffff',
                    appearance:      'none',
                    WebkitAppearance:'none',
                    cursor:          'pointer',
                    outline:         'none',
                    transition:      'border-color 100ms, box-shadow 100ms',
                    boxSizing:       'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(0,0,0,0.10)';
                    e.target.style.boxShadow   = 'none';
                  }}
                >
                  {classificationOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>

            {/* Regularidad */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tx-regularity"
                className="text-sm font-medium text-gray-700"
              >
                Regularidad
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="tx-regularity"
                  name="regularity"
                  value={transaction.regularity}
                  onChange={handleSelectChange}
                  style={{
                    width:           '100%',
                    height:          '44px',
                    padding:         '0 36px 0 14px',
                    fontSize:        '14px',
                    color:           '#111827',
                    border:          '1.5px solid rgba(0,0,0,0.10)',
                    borderRadius:    '10px',
                    backgroundColor: '#ffffff',
                    appearance:      'none',
                    WebkitAppearance:'none',
                    cursor:          'pointer',
                    outline:         'none',
                    transition:      'border-color 100ms, box-shadow 100ms',
                    boxSizing:       'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(0,0,0,0.10)';
                    e.target.style.boxShadow   = 'none';
                  }}
                >
                  {Object.entries(regularityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>

            {/* Fecha */}
            <Input
              label={t.date}
              type="date"
              value={transaction.date}
              onChange={handleDateChange}
            />

            {/* Notas */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tx-notes" className="text-sm font-medium text-gray-700">
                {t.notes}{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="tx-notes"
                rows={3}
                placeholder="Detalles adicionales..."
                value={transaction.notes || ''}
                onChange={handleNotesChange}
                className="resize-none"
                style={{
                  width:           '100%',
                  padding:         '10px 14px',
                  fontSize:        '14px',
                  color:           '#111827',
                  border:          '1.5px solid rgba(0,0,0,0.10)',
                  borderRadius:    '10px',
                  backgroundColor: '#ffffff',
                  outline:         'none',
                  transition:      'border-color 100ms, box-shadow 100ms',
                  fontFamily:      'inherit',
                  lineHeight:      1.5,
                  boxSizing:       'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366F1';
                  e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(0,0,0,0.10)';
                  e.target.style.boxShadow   = 'none';
                }}
              />
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div
            style={{
              display:         'flex',
              gap:             '12px',
              padding:         '16px 24px',
              borderTop:       '1px solid rgba(0,0,0,0.06)',
              backgroundColor: '#ffffff',
              flexShrink:      0,
            }}
          >
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              className="flex-1"
            >
              {transaction.id ? t.update_transaction : t.add_transaction}
            </Button>
          </div>
        </motion.div>
      </div>
    </>,
    portalEl,
  );
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function ChevronIcon() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:      'absolute',
        top: 0, right: '12px', bottom: 0,
        display:       'flex',
        alignItems:    'center',
        pointerEvents: 'none',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l3 3 3-3" />
      </svg>
    </div>
  );
}
