'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import type { IncomeClassification, Regularity, CustomHabit } from '../../types';

/* ─── Income source data ──────────────────────────────────────────────── */

interface IncomeSource {
  id:             string;
  label:          string;
  emoji:          string;
  bg:             string;
  color:          string;
  concept:        string;
  classification: IncomeClassification;
  regularity:     Regularity;
}

const INCOME_SOURCES: IncomeSource[] = [
  { id: 'sueldo',    label: 'Sueldo',    emoji: '💼', bg: '#ECFDF5', color: '#059669', concept: 'Sueldo',       classification: 'sueldo',    regularity: 'recurrente' },
  { id: 'freelance', label: 'Freelance', emoji: '💻', bg: '#F0FDFA', color: '#0D9488', concept: 'Freelance',    classification: 'venta',     regularity: 'eventual'   },
  { id: 'venta',     label: 'Venta',     emoji: '🏷️', bg: '#EFF6FF', color: '#2563EB', concept: 'Venta',        classification: 'venta',     regularity: 'eventual'   },
  { id: 'regalo',    label: 'Regalo',    emoji: '🎁', bg: '#FFF7ED', color: '#D97706', concept: 'Regalo',       classification: 'regalo',    regularity: 'eventual'   },
  { id: 'inversion', label: 'Inversión', emoji: '📈', bg: '#EEF2FF', color: '#4F46E5', concept: 'Inversión',    classification: 'inversion', regularity: 'no_regular' },
  { id: 'beca',      label: 'Beca',      emoji: '🎓', bg: '#F5F3FF', color: '#7C3AED', concept: 'Beca',         classification: 'otro',      regularity: 'recurrente' },
  { id: 'reembolso', label: 'Reembolso', emoji: '↩️', bg: '#ECFEFF', color: '#0891B2', concept: 'Reembolso',    classification: 'reembolso', regularity: 'eventual'   },
  { id: 'otro',      label: 'Otro',      emoji: '💰', bg: '#F8FAFC', color: '#64748B', concept: 'Otro ingreso', classification: 'otro',      regularity: 'eventual'   },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function amountHint(amount: number, source: IncomeSource | null, customHabit: CustomHabit | null): string {
  if (customHabit) return `${customHabit.emoji} ${customHabit.label}`;
  if (source) return `${source.emoji} ${source.label}`;
  if (amount <= 0) return 'Ingresa el monto';
  if (amount < 500)   return '💵 Ingreso pequeño';
  if (amount < 5000)  return '💸 Buen ingreso';
  if (amount < 20000) return '📈 Gran ingreso';
  return '🏆 Ingreso excepcional';
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function IngresosPage() {
  const { addTransaction, customHabits } = useStore();

  const [amountStr,          setAmountStr]          = useState('');
  const [selectedSrc,        setSelectedSrc]        = useState<string | null>(null);
  const [selectedCustomHabit, setSelectedCustomHabit] = useState<CustomHabit | null>(null);
  const [note,               setNote]               = useState('');
  const [date,               setDate]               = useState(todayStr);
  const [showActions,        setShowActions]        = useState(false);
  const [savedSource,        setSavedSource]        = useState<IncomeSource | null>(null);
  const [savedCustomHabit,   setSavedCustomHabit]   = useState<CustomHabit | null>(null);

  const incomeCustomHabits = useMemo(
    () => customHabits.filter(h => !h.archived && (h.type === 'income' || h.type === 'both')),
    [customHabits],
  );

  const amount   = parseFloat(amountStr) || 0;
  const source   = INCOME_SOURCES.find(s => s.id === selectedSrc) ?? null;
  const canSave  = amount > 0 && (selectedSrc !== null || selectedCustomHabit !== null);

  const handleAmountKey = useCallback((key: string) => {
    if (key === 'del') {
      setAmountStr(prev => prev.slice(0, -1));
      return;
    }
    if (key === '.' && amountStr.includes('.')) return;
    if (amountStr === '0' && key !== '.') {
      setAmountStr(key);
      return;
    }
    const next  = amountStr + key;
    const parts = next.split('.');
    if (parts[1] && parts[1].length > 2) return;
    setAmountStr(next);
  }, [amountStr]);

  const handleSave = () => {
    if (!canSave) return;

    if (selectedCustomHabit) {
      addTransaction({
        id:             uuidv4(),
        date,
        amount,
        type:           'income',
        concept:        selectedCustomHabit.label + (note ? ` — ${note}` : ''),
        classification: 'otro',
        regularity:     'eventual',
        notes:          note || undefined,
        habitCategory:  selectedCustomHabit.id,
      });
      setSavedCustomHabit(selectedCustomHabit);
      setSavedSource(null);
    } else if (source) {
      addTransaction({
        id:             uuidv4(),
        date,
        amount,
        type:           'income',
        concept:        source.concept + (note ? ` — ${note}` : ''),
        classification: source.classification,
        regularity:     source.regularity,
        notes:          note || undefined,
      });
      setSavedSource(source);
      setSavedCustomHabit(null);
    }

    setAmountStr('');
    setSelectedSrc(null);
    setSelectedCustomHabit(null);
    setNote('');
    setDate(todayStr());
    setShowActions(true);
    setTimeout(() => setShowActions(false), 6000);
  };

  const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','del'];

  /* ── Styles ────────────────────────────────────────────────────────── */

  const pageStyle: React.CSSProperties = {
    minHeight:     '100vh',
    background:    'linear-gradient(160deg, #ECFDF5 0%, #F0FDFA 50%, #ECFEFF 100%)',
    paddingBottom: '24px',
  };

  const amountBoxStyle: React.CSSProperties = {
    background:    'linear-gradient(135deg, #059669 0%, #0D9488 50%, #0891B2 100%)',
    borderRadius:  '24px',
    padding:       '28px 24px 24px',
    marginBottom:  '16px',
    boxShadow:     '0 12px 40px rgba(13,148,136,0.26)',
    position:      'relative',
    overflow:      'hidden',
  };

  const amountDisplayStyle: React.CSSProperties = {
    fontSize:           amountStr.length > 6 ? '42px' : '56px',
    fontWeight:         700,
    color:              '#ffffff',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing:      '-0.02em',
    lineHeight:         1,
    minHeight:          '60px',
    display:            'flex',
    alignItems:         'center',
  };

  return (
    <div style={pageStyle}>

      {/* ── Amount Hero ──────────────────────────────────────────────── */}
      <div style={amountBoxStyle}>
        {/* decorative circle */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px',
          background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
        }} />
        {/* second circle */}
        <div style={{
          position: 'absolute', bottom: '-30px', left: '-20px',
          width: '100px', height: '100px',
          background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
        }} />

        <div className="flex items-center justify-between mb-1">
          <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Monto del ingreso
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.22)',
            color: '#ffffff',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 9px', borderRadius: '999px',
          }}>
            MXN
          </span>
        </div>

        <div style={amountDisplayStyle}>
          <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: '0.6em', marginRight: '4px' }}>$</span>
          <span>{amountStr || '0'}</span>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '12px', marginTop: '6px' }}>
          {amountHint(amount, source, selectedCustomHabit)}
        </p>
      </div>

      {/* ── Numpad ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px', marginBottom: '20px',
      }}>
        {PAD_KEYS.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => handleAmountKey(key)}
            style={{
              height:        '56px',
              borderRadius:  '14px',
              border:        'none',
              background:    key === 'del' ? '#FFF1F2' : '#ffffff',
              color:         key === 'del' ? '#F43F5E' : '#1a1a2e',
              fontSize:      key === 'del' ? '18px' : '22px',
              fontWeight:    key === 'del' ? 600 : 500,
              cursor:        'pointer',
              boxShadow:     '0 1px 4px rgba(0,0,0,0.08)',
              transition:    'transform 80ms ease, box-shadow 80ms ease',
              display:       'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.94)')}
            onPointerUp={e   => (e.currentTarget.style.transform = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={key === 'del' ? 'Borrar' : key}
          >
            {key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>

      {/* ── Income source grid ───────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Fuente de ingreso
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {INCOME_SOURCES.map(src => {
            const active = selectedSrc === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => {
                  setSelectedCustomHabit(null);
                  setSelectedSrc(active ? null : src.id);
                }}
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '6px',
                  padding:        '12px 6px',
                  borderRadius:   '14px',
                  border:         active ? `2px solid ${src.color}` : '2px solid transparent',
                  background:     active ? src.bg : '#ffffff',
                  cursor:         'pointer',
                  boxShadow:      active ? `0 4px 16px ${src.color}30` : '0 1px 4px rgba(0,0,0,0.07)',
                  transition:     'all 120ms ease',
                }}
                aria-pressed={active}
                aria-label={src.label}
              >
                <span style={{ fontSize: '26px', lineHeight: 1 }}>{src.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: active ? src.color : '#6B7280', lineHeight: 1.2 }}>
                  {src.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom income habits (shown only if any exist) */}
        {incomeCustomHabits.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Mis hábitos
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {incomeCustomHabits.map(h => {
                const active = selectedCustomHabit?.id === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setSelectedSrc(null);
                      setSelectedCustomHabit(active ? null : h);
                    }}
                    style={{
                      display:        'flex',
                      flexDirection:  'column',
                      alignItems:     'center',
                      justifyContent: 'center',
                      gap:            '6px',
                      padding:        '12px 6px',
                      borderRadius:   '14px',
                      border:         active ? `2px solid ${h.accentColor}` : '2px solid transparent',
                      background:     active ? h.bgColor : '#ffffff',
                      cursor:         'pointer',
                      boxShadow:      active ? `0 4px 16px ${h.accentColor}40` : '0 1px 4px rgba(0,0,0,0.07)',
                      transition:     'all 120ms ease',
                    }}
                    aria-pressed={active}
                    aria-label={h.label}
                  >
                    <span style={{ fontSize: '26px', lineHeight: 1 }}>{h.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: active ? h.accentColor : '#6B7280', lineHeight: 1.2, textAlign: 'center' }}>
                      {h.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Note ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Nota <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
        </p>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ej: pago proyecto cliente, bonificación…"
          maxLength={80}
          style={{
            width:        '100%',
            height:       '44px',
            borderRadius: '12px',
            border:       '1.5px solid #E5E7EB',
            padding:      '0 14px',
            fontSize:     '14px',
            color:        '#111827',
            background:   '#ffffff',
            outline:      'none',
            boxSizing:    'border-box',
            fontFamily:   'inherit',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
          onBlur={e  => (e.currentTarget.style.borderColor = '#E5E7EB')}
        />
      </div>

      {/* ── Date ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Fecha
        </p>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            width:        '100%',
            height:       '44px',
            borderRadius: '12px',
            border:       '1.5px solid #E5E7EB',
            padding:      '0 12px',
            fontSize:     '14px',
            color:        '#111827',
            background:   '#ffffff',
            outline:      'none',
            boxSizing:    'border-box',
            fontFamily:   'inherit',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
          onBlur={e  => (e.currentTarget.style.borderColor = '#E5E7EB')}
        />
      </div>

      {/* ── Save button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        style={{
          width:         '100%',
          height:        '56px',
          borderRadius:  '16px',
          border:        'none',
          background:    canSave
            ? 'linear-gradient(135deg, #059669 0%, #0D9488 100%)'
            : '#E5E7EB',
          color:         canSave ? '#ffffff' : '#9CA3AF',
          fontSize:      '16px',
          fontWeight:    700,
          cursor:        canSave ? 'pointer' : 'not-allowed',
          letterSpacing: '-0.01em',
          boxShadow:     canSave ? '0 8px 24px rgba(13,148,136,0.30)' : 'none',
          transition:    'all 150ms ease',
        }}
        onPointerDown={e  => canSave && (e.currentTarget.style.transform = 'scale(0.97)')}
        onPointerUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {canSave ? '✓ Registrar ingreso' : 'Selecciona monto y fuente'}
      </button>

      {/* ── Post-save action panel ───────────────────────────────────── */}
      {showActions && (
        <div
          style={{
            position:     'fixed',
            bottom:       '84px',
            left:         '50%',
            transform:    'translateX(-50%)',
            width:        'min(calc(100% - 32px), 400px)',
            background:   '#ffffff',
            borderRadius: '20px',
            boxShadow:    '0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)',
            border:       '1px solid rgba(0,0,0,0.08)',
            padding:      '20px',
            zIndex:       2000,
          }}
          role="alert"
          aria-live="assertive"
        >
          {/* Success indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669, #0D9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(13,148,136,0.30)',
            }}>
              <span style={{ color: '#fff', fontSize: '18px', lineHeight: 1 }}>✓</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#111827', lineHeight: 1.2 }}>
                ¡Ingreso registrado!
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                {savedSource
                  ? `${savedSource.emoji} Añadido desde ${savedSource.label}`
                  : savedCustomHabit
                  ? `${savedCustomHabit.emoji} Añadido a ${savedCustomHabit.label}`
                  : 'Ingreso guardado correctamente'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowActions(false)}
              style={{
                flex: 1, height: '40px',
                borderRadius: '10px',
                border: '1.5px solid #E5E7EB',
                background: '#F9FAFB',
                color: '#374151',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Otro
            </button>
            <Link
              href="/transactions"
              style={{
                flex: 1, height: '40px',
                borderRadius: '10px',
                border: '1.5px solid rgba(99,102,241,0.25)',
                background: '#EEF2FF',
                color: '#4F46E5',
                fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Movimientos
            </Link>
            <Link
              href="/"
              style={{
                flex: 1, height: '40px',
                borderRadius: '10px',
                border: '1.5px solid rgba(13,148,136,0.25)',
                background: '#F0FDFA',
                color: '#0D9488',
                fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
