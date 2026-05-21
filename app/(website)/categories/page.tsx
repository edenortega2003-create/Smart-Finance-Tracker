'use client';

import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CustomHabit } from '../../types';
import { computeHabitStats, HabitGroupStats } from '../../utils/habitGroups';
import { computeCustomHabitStats, CustomHabitStats } from '../../utils/customHabitUtils';
import { TrendingUp, TrendingDown, Plus, X, Pencil, Archive, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Formatters ───────────────────────────────────────────────────────────────

const numFmt = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(amount: number, symbol: string): string {
  return `${symbol}${numFmt.format(amount)}`;
}

function extractSymbol(currency: string): string {
  return currency.split(' ')[1] ?? '$';
}

function getTrend(current: number, prev: number): { pct: number; up: boolean } | null {
  if (prev === 0 || current === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  if (Math.abs(pct) < 1) return null;
  return { pct: Math.abs(pct), up: pct > 0 };
}

// ─── Preset options ───────────────────────────────────────────────────────────

const PRESET_EMOJIS = [
  '☕','🏋️','🐱','🐶','✈️','👕','💊','🎮','🎵','🍕',
  '🏥','🌿','🎁','📱','🏦','🧴','🎓','🍔','🌮','💡',
  '🎭','💻','🏄','🚀',
];

const PRESET_COLORS = [
  { label: 'Rojo',    accent: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.20)'   },
  { label: 'Naranja', accent: '#F97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.20)'  },
  { label: 'Ámbar',   accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.20)'  },
  { label: 'Lima',    accent: '#84CC16', bg: 'rgba(132,204,22,0.08)',  border: 'rgba(132,204,22,0.20)'  },
  { label: 'Verde',   accent: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.20)'   },
  { label: 'Teal',    accent: '#14B8A6', bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.20)'  },
  { label: 'Azul',    accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.20)'  },
  { label: 'Índigo',  accent: '#6366F1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.20)'  },
  { label: 'Violeta', accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.20)'  },
  { label: 'Rosa',    accent: '#EC4899', bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.20)'  },
  { label: 'Gris',    accent: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.20)' },
];

// ─── Create/Edit modal ────────────────────────────────────────────────────────

interface HabitFormState {
  label: string;
  emoji: string;
  colorIdx: number;
  type: 'expense' | 'income' | 'both';
  description: string;
}

function defaultForm(): HabitFormState {
  return { label: '', emoji: '☕', colorIdx: 0, type: 'expense', description: '' };
}

function HabitModal({
  editing,
  onSave,
  onClose,
}: {
  editing: CustomHabit | null;
  onSave: (form: HabitFormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<HabitFormState>(() => {
    if (!editing) return defaultForm();
    const colorIdx = PRESET_COLORS.findIndex((c) => c.accent === editing.accentColor);
    return {
      label:       editing.label,
      emoji:       editing.emoji,
      colorIdx:    colorIdx >= 0 ? colorIdx : 0,
      type:        editing.type,
      description: editing.description ?? '',
    };
  });

  const color = PRESET_COLORS[form.colorIdx];
  const valid = form.label.trim().length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header — sticky, never scrolls away */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            {editing ? 'Editar hábito' : 'Nuevo hábito'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable on short screens */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', flex: 1 }}>

          {/* Preview */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px',
            backgroundColor: color.bg,
            borderRadius: '14px',
            border: `1px solid ${color.border}`,
          }}>
            <span style={{ fontSize: '28px', lineHeight: 1 }}>{form.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: color.accent }}>
                {form.label.trim() || 'Nombre del hábito'}
              </p>
              {form.description && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                  {form.description}
                </p>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Nombre
            </label>
            <input
              autoFocus
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              maxLength={32}
              placeholder="Ej. Mascota, Gym, Suscripciones..."
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                border: '1.5px solid rgba(0,0,0,0.12)',
                padding: '0 12px', fontSize: '14px', color: '#111827',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Emoji picker */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Emoji
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px', fontSize: '18px',
                    border: form.emoji === e ? `2px solid ${color.accent}` : '1.5px solid rgba(0,0,0,0.09)',
                    backgroundColor: form.emoji === e ? color.bg : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Color
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESET_COLORS.map((c, idx) => (
                <button
                  key={c.label}
                  onClick={() => setForm((f) => ({ ...f, colorIdx: idx }))}
                  title={c.label}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: c.accent,
                    border: form.colorIdx === idx ? `3px solid ${c.accent}` : '2px solid transparent',
                    outline: form.colorIdx === idx ? `2px solid rgba(0,0,0,0.12)` : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Type toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Aplica a
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['expense', 'income', 'both'] as const).map((t) => {
                const labels = { expense: 'Gastos', income: 'Ingresos', both: 'Ambos' };
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    style={{
                      flex: 1, height: '36px', borderRadius: '9px', fontSize: '13px',
                      fontWeight: active ? 700 : 400,
                      border: active ? `1.5px solid ${color.accent}` : '1.5px solid rgba(0,0,0,0.10)',
                      backgroundColor: active ? color.bg : 'transparent',
                      color: active ? color.accent : '#6B7280',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Descripción <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={64}
              placeholder="Ej. Gastos relacionados con mi gato"
              style={{
                width: '100%', height: '40px', borderRadius: '10px',
                border: '1.5px solid rgba(0,0,0,0.12)',
                padding: '0 12px', fontSize: '13px', color: '#111827',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Footer — sticky, never scrolled under content */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            style={{
              height: '48px', borderRadius: '14px', border: 'none',
              background: valid
                ? `linear-gradient(135deg, ${color.accent} 0%, ${color.accent}cc 100%)`
                : 'rgba(0,0,0,0.08)',
              color: valid ? '#ffffff' : '#9CA3AF',
              fontSize: '15px', fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 150ms ease',
            }}
          >
            {editing ? 'Guardar cambios' : 'Crear hábito'}
          </button>
          <button
            onClick={onClose}
            style={{
              height: '40px', borderRadius: '12px',
              border: 'none', background: 'none',
              color: '#9CA3AF', fontSize: '14px', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Habit cards ──────────────────────────────────────────────────────────────

function BaseHabitCard({ stats, symbol, rank }: { stats: HabitGroupStats; symbol: string; rank: number }) {
  const { meta, monthlyTotal, weeklyTotal, count, prevMonthTotal } = stats;
  const trend  = getTrend(monthlyTotal, prevMonthTotal);
  const active = count > 0;

  return (
    <div style={{
      backgroundColor: active ? meta.bgColor : 'rgba(0,0,0,0.02)',
      borderRadius: '16px',
      border: `1px solid ${active ? meta.borderColor : 'rgba(0,0,0,0.06)'}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      opacity: active ? 1 : 0.45,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>{meta.emoji}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: active ? meta.accentColor : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta.label}
          </span>
        </div>
        {rank === 1 && active && (
          <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, backgroundColor: meta.accentColor, color: '#fff', padding: '2px 7px', borderRadius: '9999px' }}>
            Top
          </span>
        )}
      </div>

      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', margin: '0 0 3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Este mes
        </p>
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: active ? meta.accentColor : '#D1D5DB' }}>
          {active ? fmt(monthlyTotal, symbol) : `${symbol}0.00`}
        </span>
      </div>

      {active && (
        <div style={{ display: 'flex', gap: '14px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semana</p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmt(weeklyTotal, symbol)}</span>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mov.</p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{count}</span>
          </div>
        </div>
      )}

      {active && trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend.up
            ? <TrendingUp  size={12} style={{ color: '#F59E0B', flexShrink: 0 }} />
            : <TrendingDown size={12} style={{ color: '#22C55E', flexShrink: 0 }} />
          }
          <span style={{ fontSize: '11px', fontWeight: 600, color: trend.up ? '#B45309' : '#15803D' }}>
            {trend.up ? '+' : '−'}{trend.pct.toFixed(0)}% vs mes ant.
          </span>
        </div>
      )}
    </div>
  );
}

function CustomHabitCard({
  stats,
  symbol,
  onEdit,
  onArchive,
}: {
  stats: CustomHabitStats;
  symbol: string;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const { meta, monthlyTotal, weeklyTotal, count, prevMonthTotal } = stats;
  const trend  = getTrend(monthlyTotal, prevMonthTotal);
  const active = count > 0;

  return (
    <div style={{
      backgroundColor: active ? meta.bgColor : 'rgba(0,0,0,0.02)',
      borderRadius: '16px',
      border: `1px solid ${active ? meta.borderColor : 'rgba(0,0,0,0.06)'}`,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      opacity: active ? 1 : 0.55,
      position: 'relative',
    }}>
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
        <button
          onClick={onEdit}
          title="Editar"
          style={{
            width: '26px', height: '26px', borderRadius: '7px',
            border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280',
          }}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onArchive}
          title="Archivar hábito"
          style={{
            width: '26px', height: '26px', borderRadius: '7px',
            border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280',
          }}
        >
          <Archive size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingRight: '64px' }}>
        <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>{meta.emoji}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: active ? meta.accentColor : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta.label}
        </span>
        <span style={{ fontSize: '9px', fontWeight: 600, backgroundColor: meta.accentColor, color: '#fff', padding: '1px 6px', borderRadius: '9999px', flexShrink: 0 }}>
          Custom
        </span>
      </div>

      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', margin: '0 0 3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Este mes
        </p>
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: active ? meta.accentColor : '#D1D5DB' }}>
          {active ? fmt(monthlyTotal, symbol) : `${symbol}0.00`}
        </span>
      </div>

      {active && (
        <div style={{ display: 'flex', gap: '14px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semana</p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmt(weeklyTotal, symbol)}</span>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mov.</p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{count}</span>
          </div>
        </div>
      )}

      {active && trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend.up
            ? <TrendingUp  size={12} style={{ color: '#F59E0B', flexShrink: 0 }} />
            : <TrendingDown size={12} style={{ color: '#22C55E', flexShrink: 0 }} />
          }
          <span style={{ fontSize: '11px', fontWeight: 600, color: trend.up ? '#B45309' : '#15803D' }}>
            {trend.up ? '+' : '−'}{trend.pct.toFixed(0)}% vs mes ant.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Archived list ────────────────────────────────────────────────────────────

function ArchivedSection({
  archived,
  onRestore,
  onDelete,
}: {
  archived: CustomHabit[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (archived.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', fontWeight: 600, color: '#9CA3AF', padding: 0,
        }}
      >
        <Archive size={13} />
        {open ? 'Ocultar archivados' : `Ver archivados (${archived.length})`}
      </button>

      {open && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {archived.map((h) => (
            <div
              key={h.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '12px',
                backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{h.emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>{h.label}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => onRestore(h.id)}
                  style={{ fontSize: '12px', fontWeight: 600, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Restaurar
                </button>
                <button
                  onClick={() => onDelete(h.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { transactions, settings, customHabits, addCustomHabit, updateCustomHabit, archiveCustomHabit, deleteCustomHabit } = useStore();
  const symbol = extractSymbol(settings.currency);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingHabit, setEditingHabit] = useState<CustomHabit | null>(null);

  const baseStats   = useMemo(() => computeHabitStats(transactions), [transactions]);
  const customStats = useMemo(() => computeCustomHabitStats(transactions, customHabits), [transactions, customHabits]);

  const archivedHabits = useMemo(() => customHabits.filter((h) => h.archived), [customHabits]);

  const totalMonth   = baseStats.reduce((s, g) => s + g.monthlyTotal, 0)
                     + customStats.reduce((s, g) => s + g.monthlyTotal, 0);
  const activeHabits = baseStats.filter((g) => g.count > 0).length
                     + customStats.filter((g) => g.count > 0).length;

  const hasAnyExpenses = useMemo(
    () => transactions.some((tx) => tx.type === 'expense'),
    [transactions],
  );

  function openCreate() {
    setEditingHabit(null);
    setModalOpen(true);
  }

  function openEdit(h: CustomHabit) {
    setEditingHabit(h);
    setModalOpen(true);
  }

  function handleSave(form: HabitFormState) {
    const color = PRESET_COLORS[form.colorIdx];
    if (editingHabit) {
      updateCustomHabit({
        ...editingHabit,
        label:       form.label.trim(),
        emoji:       form.emoji,
        accentColor: color.accent,
        bgColor:     color.bg,
        borderColor: color.border,
        type:        form.type,
        description: form.description.trim() || undefined,
      });
    } else {
      addCustomHabit({
        id:          uuidv4(),
        label:       form.label.trim(),
        emoji:       form.emoji,
        accentColor: color.accent,
        bgColor:     color.bg,
        borderColor: color.border,
        type:        form.type,
        description: form.description.trim() || undefined,
        archived:    false,
        createdAt:   new Date().toISOString(),
      });
    }
    setModalOpen(false);
  }

  function handleRestore(id: string) {
    const h = customHabits.find((c) => c.id === id);
    if (h) updateCustomHabit({ ...h, archived: false });
  }

  return (
    <div style={{ paddingTop: '4px' }}>

      {/* ── Summary header ─────────────────────────────────── */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Gasto total · este mes
          </p>
          <p style={{ fontSize: '30px', fontWeight: 700, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
            {hasAnyExpenses ? fmt(totalMonth, symbol) : `${symbol}0.00`}
          </p>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            {activeHabits === 0
              ? 'Sin movimientos este mes'
              : `${activeHabits} ${activeHabits === 1 ? 'hábito activo' : 'hábitos activos'}`}
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            height: '40px', padding: '0 14px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(99,102,241,0.30)',
          }}
        >
          <Plus size={15} />
          Nuevo hábito
        </button>
      </div>

      {/* ── Custom habits section (only if any) ────────────── */}
      {customStats.length > 0 && (
        <>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Mis hábitos
          </p>
          <div className="habit-grid" style={{ marginBottom: '24px' }}>
            {customStats.map((s) => {
              const habit = customHabits.find((h) => h.id === s.meta.id)!;
              return (
                <CustomHabitCard
                  key={s.meta.id}
                  stats={s}
                  symbol={symbol}
                  onEdit={() => openEdit(habit)}
                  onArchive={() => archiveCustomHabit(habit.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ── Base habits section ─────────────────────────────── */}
      {hasAnyExpenses ? (
        <>
          {customStats.length > 0 && (
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Hábitos base
            </p>
          )}
          <div className="habit-grid">
            {baseStats.map((s, i) => (
              <BaseHabitCard key={s.meta.id} stats={s} symbol={symbol} rank={i + 1} />
            ))}
          </div>
        </>
      ) : (
        customStats.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '56px 20px' }}>
            <span style={{ fontSize: '52px', lineHeight: 1, marginBottom: '20px' }}>🌱</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Tu mapa está vacío
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.65, margin: 0, maxWidth: '270px' }}>
              Registra tus primeros movimientos para ver cómo se distribuyen tus hábitos financieros.
            </p>
          </div>
        )
      )}

      {/* ── Archived ───────────────────────────────────────── */}
      <ArchivedSection
        archived={archivedHabits}
        onRestore={handleRestore}
        onDelete={deleteCustomHabit}
      />

      {/* ── Footer note ────────────────────────────────────── */}
      <p style={{ fontSize: '11.5px', color: '#9CA3AF', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 }}>
        Los hábitos base se infieren del concepto. Los hábitos personalizados se asignan al registrar.
      </p>

      {/* ── Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <HabitModal
          editing={editingHabit}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
