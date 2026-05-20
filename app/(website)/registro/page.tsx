'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import type { ExpenseClassification } from '../../types';

/* ─── Auto-classify by amount ─────────────────────────────────────── */
function autoClassify(amount: number): ExpenseClassification {
  if (amount < 100) return 'hormiga';
  if (amount < 500) return 'variable';
  return 'fijo';
}

/* ─── Category data ────────────────────────────────────────────────── */
const CATEGORIES: {
  id: string;
  label: string;
  emoji: string;
  bg: string;
  color: string;
  concept: string;
}[] = [
  { id: 'comida',      label: 'Comida',      emoji: '🍔', bg: '#FFF7ED', color: '#EA580C', concept: 'Comida'       },
  { id: 'transporte',  label: 'Transporte',  emoji: '🚌', bg: '#EFF6FF', color: '#2563EB', concept: 'Transporte'   },
  { id: 'compras',     label: 'Compras',     emoji: '🛍️', bg: '#FDF4FF', color: '#A21CAF', concept: 'Compras'      },
  { id: 'salud',       label: 'Salud',       emoji: '💊', bg: '#F0FDF4', color: '#16A34A', concept: 'Salud'        },
  { id: 'ocio',        label: 'Ocio',        emoji: '🎬', bg: '#FFFBEB', color: '#D97706', concept: 'Ocio'         },
  { id: 'servicios',   label: 'Servicios',   emoji: '💡', bg: '#F0F9FF', color: '#0284C7', concept: 'Servicios'    },
  { id: 'educacion',   label: 'Educación',   emoji: '📚', bg: '#FFF1F2', color: '#E11D48', concept: 'Educación'    },
  { id: 'hogar',       label: 'Hogar',       emoji: '🏠', bg: '#F5F3FF', color: '#7C3AED', concept: 'Hogar'        },
  { id: 'otro',        label: 'Otro',        emoji: '📦', bg: '#F8FAFC', color: '#64748B', concept: 'Otro'         },
];

/* ─── Payment methods ──────────────────────────────────────────────── */
const METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'];

/* ─── Helpers ──────────────────────────────────────────────────────── */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function RegistroPage() {
  const addTransaction = useStore((s) => s.addTransaction);

  const [amountStr, setAmountStr]       = useState('');
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  const [method, setMethod]             = useState<string>('Efectivo');
  const [note, setNote]                 = useState('');
  const [date, setDate]                 = useState(todayStr);
  const [time, setTime]                 = useState(nowTimeStr);
  const [showActions, setShowActions]   = useState(false);

  const amount  = parseFloat(amountStr) || 0;
  const canSave = amount > 0 && selectedCat !== null;

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
    const next = amountStr + key;
    // max 2 decimal places
    const parts = next.split('.');
    if (parts[1] && parts[1].length > 2) return;
    setAmountStr(next);
  }, [amountStr]);

  const handleSave = () => {
    if (!canSave) return;
    const cat = CATEGORIES.find(c => c.id === selectedCat)!;
    const classification = autoClassify(amount);
    addTransaction({
      id:             uuidv4(),
      date,
      amount,
      type:           'expense',
      concept:        cat.concept + (note ? ` — ${note}` : ''),
      classification,
      regularity:     'eventual',
      notes:          note || undefined,
    });
    // reset
    setAmountStr('');
    setSelectedCat(null);
    setNote('');
    setDate(todayStr());
    setTime(nowTimeStr());
    // show action panel
    setShowActions(true);
    setTimeout(() => setShowActions(false), 6000);
  };

  /* ── Numpad keys ─────────────────────────────────────────────────── */
  const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','del'];

  /* ── Styles (all inline — CSS bypass pattern) ────────────────────── */
  const pageStyle: React.CSSProperties = {
    minHeight:      '100vh',
    background:     'linear-gradient(160deg, #F0FDF4 0%, #FFFDF7 50%, #F0F9FF 100%)',
    paddingBottom:  '24px',
  };

  const amountBoxStyle: React.CSSProperties = {
    background:    'linear-gradient(135deg, #10B981 0%, #14B8A6 60%, #06B6D4 100%)',
    borderRadius:  '24px',
    padding:       '28px 24px 24px',
    marginBottom:  '16px',
    boxShadow:     '0 12px 40px rgba(16,185,129,0.22)',
    position:      'relative',
    overflow:      'hidden',
  };

  const amountDisplayStyle: React.CSSProperties = {
    fontSize:      amountStr.length > 6 ? '42px' : '56px',
    fontWeight:    700,
    color:         '#ffffff',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
    lineHeight:    1,
    minHeight:     '60px',
    display:       'flex',
    alignItems:    'center',
  };

  return (
    <div style={pageStyle}>
      {/* ── Amount Hero ───────────────────────────────────────────── */}
      <div style={amountBoxStyle}>
        {/* decorative circle */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px',
          background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
        }} />

        <div className="flex items-center justify-between mb-1">
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Monto del gasto
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.20)',
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

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '6px' }}>
          {amount > 0 && amount < 100   ? '🐜 Gasto hormiga'   :
           amount >= 100 && amount < 500 ? '💳 Gasto variable'  :
           amount >= 500                 ? '🏷️ Gasto fijo'       :
           'Ingresa el monto'}
        </p>
      </div>

      {/* ── Numpad ───────────────────────────────────────────────── */}
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
            onPointerUp={e => (e.currentTarget.style.transform   = 'scale(1)')}
            onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={key === 'del' ? 'Borrar' : key}
          >
            {key === 'del' ? '⌫' : key}
          </button>
        ))}
      </div>

      {/* ── Category grid ────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Categoría
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {CATEGORIES.map(cat => {
            const active = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(active ? null : cat.id)}
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'center',
                  justifyContent:'center',
                  gap:           '6px',
                  padding:       '12px 6px',
                  borderRadius:  '14px',
                  border:        active ? `2px solid ${cat.color}` : '2px solid transparent',
                  background:    active ? cat.bg : '#ffffff',
                  cursor:        'pointer',
                  boxShadow:     active ? `0 4px 16px ${cat.color}30` : '0 1px 4px rgba(0,0,0,0.07)',
                  transition:    'all 120ms ease',
                }}
                aria-pressed={active}
                aria-label={cat.label}
              >
                <span style={{ fontSize: '26px', lineHeight: 1 }}>{cat.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: active ? cat.color : '#6B7280', lineHeight: 1.2 }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Payment method ───────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Método de pago
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {METHODS.map(m => {
            const active = method === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                style={{
                  padding:      '8px 16px',
                  borderRadius: '999px',
                  border:       active ? '2px solid #10B981' : '2px solid #E5E7EB',
                  background:   active ? '#ECFDF5' : '#ffffff',
                  color:        active ? '#059669' : '#6B7280',
                  fontSize:     '13px',
                  fontWeight:   active ? 600 : 400,
                  cursor:       'pointer',
                  transition:   'all 120ms ease',
                }}
                aria-pressed={active}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Note ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Nota <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
        </p>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ej: almuerzo con el equipo…"
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
          onFocus={e  => (e.currentTarget.style.borderColor = '#10B981')}
          onBlur={e   => (e.currentTarget.style.borderColor = '#E5E7EB')}
        />
      </div>

      {/* ── Date / Time ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        <div>
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
            onFocus={e => (e.currentTarget.style.borderColor = '#10B981')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#E5E7EB')}
          />
        </div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Hora
          </p>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
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
            onFocus={e => (e.currentTarget.style.borderColor = '#10B981')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#E5E7EB')}
          />
        </div>
      </div>

      {/* ── Save button ───────────────────────────────────────────── */}
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
            ? 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
            : '#E5E7EB',
          color:         canSave ? '#ffffff' : '#9CA3AF',
          fontSize:      '16px',
          fontWeight:    700,
          cursor:        canSave ? 'pointer' : 'not-allowed',
          letterSpacing: '-0.01em',
          boxShadow:     canSave ? '0 8px 24px rgba(16,185,129,0.30)' : 'none',
          transition:    'all 150ms ease',
        }}
        onPointerDown={e  => canSave && (e.currentTarget.style.transform = 'scale(0.97)')}
        onPointerUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {canSave ? '✓ Registrar gasto' : 'Selecciona monto y categoría'}
      </button>

      {/* ── Post-save action panel ───────────────────────────────── */}
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
              background: 'linear-gradient(135deg, #10B981, #14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(16,185,129,0.30)',
            }}>
              <span style={{ color: '#fff', fontSize: '18px', lineHeight: 1 }}>✓</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#111827', lineHeight: 1.2 }}>
                ¡Registrado!
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                Gasto guardado correctamente
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
              href="/categories"
              style={{
                flex: 1, height: '40px',
                borderRadius: '10px',
                border: '1.5px solid rgba(16,185,129,0.25)',
                background: '#ECFDF5',
                color: '#059669',
                fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Hábitos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
