'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

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
import { HABIT_GROUPS } from '../utils/habitGroups';

// ─── Classification chip colors ───────────────────────────────────────────────

const CLS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  hormiga:    { bg: '#FFF7ED', color: '#C2410C', border: 'rgba(194,65,12,0.25)' },
  fijo:       { bg: '#EFF6FF', color: '#1D4ED8', border: 'rgba(29,78,216,0.25)' },
  variable:   { bg: '#F0FDF4', color: '#15803D', border: 'rgba(21,128,61,0.25)' },
  esporadico: { bg: '#FAF5FF', color: '#7C3AED', border: 'rgba(124,58,237,0.25)' },
  inversion:  { bg: '#FFFBEB', color: '#B45309', border: 'rgba(180,83,9,0.25)' },
  deuda:      { bg: '#FFF1F2', color: '#BE123C', border: 'rgba(190,18,60,0.25)' },
  ahorro:     { bg: '#DCFCE7', color: '#166534', border: 'rgba(22,101,52,0.25)' },
  otro:       { bg: '#F1F5F9', color: '#475569', border: 'rgba(71,85,105,0.25)' },
  sueldo:     { bg: '#F0FDF4', color: '#15803D', border: 'rgba(21,128,61,0.25)' },
  venta:      { bg: '#EFF6FF', color: '#1D4ED8', border: 'rgba(29,78,216,0.25)' },
  regalo:     { bg: '#FFF7ED', color: '#C2410C', border: 'rgba(194,65,12,0.25)' },
  reembolso:  { bg: '#F5F3FF', color: '#6D28D9', border: 'rgba(109,40,217,0.25)' },
};

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
  habitCategory?: string;
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
      habitCategory:  existing.habitCategory,
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
    habitCategory:  undefined,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontSize: '11px', fontWeight: 700, color: '#9CA3AF',
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    }}>
      {children}
    </p>
  );
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

  const [transaction, setTransaction] = useState<ModalTransactionState>(
    () => buildInitialState(initialTransaction),
  );

  const [showNotes, setShowNotes] = useState(
    () => Boolean(initialTransaction && (initialTransaction as Transaction).notes),
  );

  const savingRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);

  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-tx-panel', '');
    document.body.appendChild(el);
    setPortalEl(el);
    return () => { el.remove(); };
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (open) {
      setTransaction(buildInitialState(initialTransaction));
      setShowNotes(Boolean(initialTransaction && (initialTransaction as Transaction).notes));
    }
  }, [open, initialTransaction]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransaction(prev => ({ ...prev, date: e.target.value }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTransaction(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleSave = () => {
    if (savingRef.current) return;

    if (!transaction.concept.trim()) {
      showSnackbar('El concepto es requerido', 'error');
      return;
    }
    const amountAsNumber = parseFloat(transaction.amount);
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      showSnackbar('Ingresa un monto válido', 'error');
      return;
    }
    if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      showSnackbar('Ingresa una fecha válida', 'error');
      return;
    }

    savingRef.current = true;

    const transactionToSave: Transaction = {
      id:             transaction.id ?? uuidv4(),
      date:           transaction.date,
      amount:         amountAsNumber,
      type:           transaction.type,
      concept:        transaction.concept.trim(),
      classification: transaction.classification,
      regularity:     transaction.regularity,
      notes:          transaction.notes,
      habitCategory:  transaction.habitCategory,
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
    setTimeout(() => { savingRef.current = false; }, 500);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!open || !portalEl) return null;

  const isExpense          = transaction.type === 'expense';
  const amountColor        = isExpense ? '#F43F5E' : '#059669';
  const heroTint           = isExpense ? 'rgba(244,63,94,0.06)'  : 'rgba(5,150,105,0.06)';
  const heroBorder         = isExpense ? 'rgba(244,63,94,0.18)'  : 'rgba(5,150,105,0.18)';
  const classificationOpts = isExpense
    ? Object.entries(expenseClassificationLabels)
    : Object.entries(incomeClassificationLabels);
  const meaningfulHabits   = HABIT_GROUPS.filter(g => g.id !== 'otro');

  const panelInitial = isMobile ? { y: '100%' } : { x: '100%' };
  const panelAnimate = isMobile ? { y: 0 }      : { x: 0 };
  const panelPositionStyle = isMobile
    ? {
        bottom: 0 as const, left: 0 as const, right: 0 as const,
        maxHeight: '92vh',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.10), 0 -2px 8px rgba(0,0,0,0.05)',
      }
    : {
        top: 0 as const, right: 0 as const, bottom: 0 as const,
        width: '100%',
        maxWidth: '480px',
        borderLeft: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.10), -2px 0 8px rgba(0,0,0,0.05)',
      };

  const bodyPad = isMobile ? '16px 20px' : '20px 24px';
  const headPad = isMobile ? '12px 20px' : '20px 24px 18px';

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
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          cursor: 'default',
        }}
      />

      {/* ── Full-screen pointer-events layer ──────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-panel-title"
          initial={panelInitial}
          animate={panelAnimate}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          style={{
            position: 'absolute',
            ...panelPositionStyle,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FAFAFA',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle (mobile) */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '2px', flexShrink: 0 }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: headPad,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            flexShrink: 0,
            backgroundColor: '#FAFAFA',
          }}>
            <h2
              id="tx-panel-title"
              style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827', letterSpacing: '-0.01em', lineHeight: 1.3 }}
            >
              {transaction.id ? t.edit_transaction : t.add_new_transaction}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                border: 'none', backgroundColor: 'rgba(0,0,0,0.05)',
                color: '#6B7280', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div style={{
            flex: '1 1 0%', overflowY: 'auto',
            padding: bodyPad,
            display: 'flex', flexDirection: 'column', gap: '20px',
            minHeight: 0,
          }}>

            {/* ── Hero: Tipo + Monto ────────────────────────────────────── */}
            <div style={{
              borderRadius: '16px',
              backgroundColor: heroTint,
              border: `1.5px solid ${heroBorder}`,
              padding: '16px',
              transition: 'background-color 200ms, border-color 200ms',
            }}>
              {/* Type pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  aria-pressed={isExpense}
                  onClick={() => handleTypeSelect('expense')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '999px',
                    border: '1.5px solid', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit',
                    backgroundColor: isExpense ? '#F43F5E' : 'rgba(0,0,0,0.04)',
                    color:           isExpense ? '#ffffff'  : '#9CA3AF',
                    borderColor:     isExpense ? '#F43F5E'  : 'transparent',
                  }}
                >
                  <TrendingDown size={13} aria-hidden="true" />
                  Gasto
                </button>
                <button
                  type="button"
                  aria-pressed={!isExpense}
                  onClick={() => handleTypeSelect('income')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '999px',
                    border: '1.5px solid', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit',
                    backgroundColor: !isExpense ? '#059669' : 'rgba(0,0,0,0.04)',
                    color:           !isExpense ? '#ffffff'  : '#9CA3AF',
                    borderColor:     !isExpense ? '#059669'  : 'transparent',
                  }}
                >
                  <TrendingUp size={13} aria-hidden="true" />
                  Ingreso
                </button>
              </div>

              {/* Amount */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: amountColor, lineHeight: 1, flexShrink: 0 }}>
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
                    flex: 1, minWidth: 0,
                    height: '48px', padding: '0 4px',
                    fontSize: '36px', fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: amountColor,
                    border: 'none', backgroundColor: 'transparent',
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* ── Concepto ─────────────────────────────────────────────── */}
            <div>
              <SectionLabel>Concepto</SectionLabel>
              <input
                type="text"
                placeholder="café, renta, gasolina..."
                value={transaction.concept}
                onChange={handleConceptChange}
                style={{
                  width: '100%', height: '44px', padding: '0 14px',
                  fontSize: '15px', color: '#111827',
                  border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px',
                  backgroundColor: '#ffffff', outline: 'none',
                  transition: 'border-color 100ms, box-shadow 100ms',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.10)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* ── Hábito (expense only) ─────────────────────────────────── */}
            {isExpense && (
              <div>
                <SectionLabel>Hábito</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {meaningfulHabits.map(g => {
                    const sel = transaction.habitCategory === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setTransaction(prev => ({
                          ...prev,
                          habitCategory: sel ? undefined : g.id,
                        }))}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '7px 12px', borderRadius: '999px',
                          border: '1.5px solid', fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit',
                          backgroundColor: sel ? g.bgColor         : '#ffffff',
                          color:           sel ? g.accentColor     : '#6B7280',
                          borderColor:     sel ? g.borderColor     : 'rgba(0,0,0,0.10)',
                        }}
                      >
                        <span aria-hidden="true">{g.emoji}</span>
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Clasificación ─────────────────────────────────────────── */}
            <div>
              <SectionLabel>Clasificación</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {classificationOpts.map(([value, label]) => {
                  const sel    = transaction.classification === value;
                  const colors = CLS_COLORS[value] ?? CLS_COLORS['otro'];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTransaction(prev => ({
                        ...prev,
                        classification: value as ExpenseClassification | IncomeClassification,
                      }))}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '7px 12px', borderRadius: '999px',
                        border: '1.5px solid', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit',
                        backgroundColor: sel ? colors.bg     : '#ffffff',
                        color:           sel ? colors.color  : '#6B7280',
                        borderColor:     sel ? colors.border : 'rgba(0,0,0,0.10)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Regularidad ───────────────────────────────────────────── */}
            <div>
              <SectionLabel>Regularidad</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(regularityLabels).map(([value, label]) => {
                  const sel = transaction.regularity === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTransaction(prev => ({
                        ...prev,
                        regularity: value as Regularity,
                      }))}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '7px 12px', borderRadius: '999px',
                        border: '1.5px solid', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit',
                        backgroundColor: sel ? 'rgba(99,102,241,0.10)' : '#ffffff',
                        color:           sel ? '#4F46E5'               : '#6B7280',
                        borderColor:     sel ? 'rgba(99,102,241,0.30)' : 'rgba(0,0,0,0.10)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Fecha ─────────────────────────────────────────────────── */}
            <div>
              <SectionLabel>{t.date}</SectionLabel>
              <input
                type="date"
                value={transaction.date}
                onChange={handleDateChange}
                style={{
                  width: '100%', height: '44px', padding: '0 14px',
                  fontSize: '14px', color: '#111827',
                  border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px',
                  backgroundColor: '#ffffff', outline: 'none',
                  transition: 'border-color 100ms, box-shadow 100ms',
                  boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.10)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* ── Notas (collapsible) ────────────────────────────────────── */}
            <div>
              {showNotes ? (
                <>
                  <SectionLabel>{t.notes}</SectionLabel>
                  <textarea
                    id="tx-notes"
                    rows={3}
                    placeholder="Detalles adicionales..."
                    value={transaction.notes || ''}
                    onChange={handleNotesChange}
                    style={{
                      width: '100%', padding: '10px 14px',
                      fontSize: '14px', color: '#111827',
                      border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: '10px',
                      backgroundColor: '#ffffff', outline: 'none',
                      resize: 'none' as const,
                      transition: 'border-color 100ms, box-shadow 100ms',
                      fontFamily: 'inherit', lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,0.10)'; e.target.style.boxShadow = 'none'; }}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: 0, border: 'none', background: 'none',
                    color: '#9CA3AF', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>⊕</span>
                  Agregar nota
                </button>
              )}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
            padding: isMobile ? '16px 20px 28px' : '16px 24px',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            backgroundColor: '#FAFAFA',
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                width: '100%', height: '52px', borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#ffffff', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', letterSpacing: '-0.01em',
                boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
                transition: 'opacity 100ms',
                fontFamily: 'inherit',
              }}
              onMouseDown={e  => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseUp={e    => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              {transaction.id ? t.update_transaction : t.add_transaction}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%', height: '40px',
                border: 'none', background: 'none',
                color: '#9CA3AF', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.cancel}
            </button>
          </div>
        </motion.div>
      </div>
    </>,
    portalEl,
  );
}
