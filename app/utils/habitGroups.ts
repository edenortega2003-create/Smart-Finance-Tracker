import { Transaction } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HabitGroupId =
  | 'alimentacion'
  | 'transporte'
  | 'hogar'
  | 'salud'
  | 'ocio'
  | 'servicios'
  | 'educacion'
  | 'compras'
  | 'otro';

export interface HabitGroupMeta {
  id: HabitGroupId;
  label: string;
  emoji: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

export interface HabitGroupStats {
  meta: HabitGroupMeta;
  monthlyTotal: number;
  weeklyTotal: number;
  count: number;
  prevMonthTotal: number;
}

// ─── Habit group definitions ──────────────────────────────────────────────────

export const HABIT_GROUPS: HabitGroupMeta[] = [
  {
    id: 'alimentacion',
    label: 'Alimentación',
    emoji: '🍽️',
    accentColor: '#EA580C',
    bgColor: 'rgba(234,88,12,0.07)',
    borderColor: 'rgba(234,88,12,0.18)',
  },
  {
    id: 'transporte',
    label: 'Transporte',
    emoji: '🚗',
    accentColor: '#2563EB',
    bgColor: 'rgba(37,99,235,0.07)',
    borderColor: 'rgba(37,99,235,0.18)',
  },
  {
    id: 'hogar',
    label: 'Hogar',
    emoji: '🏠',
    accentColor: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.07)',
    borderColor: 'rgba(124,58,237,0.18)',
  },
  {
    id: 'salud',
    label: 'Salud',
    emoji: '❤️',
    accentColor: '#16A34A',
    bgColor: 'rgba(22,163,74,0.07)',
    borderColor: 'rgba(22,163,74,0.18)',
  },
  {
    id: 'ocio',
    label: 'Ocio',
    emoji: '🎮',
    accentColor: '#D97706',
    bgColor: 'rgba(217,119,6,0.07)',
    borderColor: 'rgba(217,119,6,0.18)',
  },
  {
    id: 'servicios',
    label: 'Servicios',
    emoji: '💡',
    accentColor: '#0284C7',
    bgColor: 'rgba(2,132,199,0.07)',
    borderColor: 'rgba(2,132,199,0.18)',
  },
  {
    id: 'educacion',
    label: 'Educación',
    emoji: '📚',
    accentColor: '#BE123C',
    bgColor: 'rgba(190,18,60,0.07)',
    borderColor: 'rgba(190,18,60,0.18)',
  },
  {
    id: 'compras',
    label: 'Compras',
    emoji: '🛒',
    accentColor: '#A21CAF',
    bgColor: 'rgba(162,28,175,0.07)',
    borderColor: 'rgba(162,28,175,0.18)',
  },
  {
    id: 'otro',
    label: 'Otro',
    emoji: '💰',
    accentColor: '#64748B',
    bgColor: 'rgba(100,116,139,0.07)',
    borderColor: 'rgba(100,116,139,0.18)',
  },
];

// ─── Keyword map (both sides normalized via stripAccents) ─────────────────────

const KEYWORD_MAP: Record<Exclude<HabitGroupId, 'otro'>, string[]> = {
  alimentacion: [
    'comida', 'cafe', 'restaurant', 'restaurante', 'taco', 'pizza', 'sushi',
    'lunch', 'desayuno', 'cena', 'almuerzo', 'tortilla', 'pollo', 'carne',
    'mercado', 'super', 'supermercado', 'walmart', 'oxxo', 'chedraui', 'soriana',
    'starbucks', 'burger', 'hamburguesa', 'sandwich', 'panaderia', 'verdura',
    'fruta', 'snack', 'antojitos', 'comida rapida',
  ],
  transporte: [
    'uber', 'didi', 'taxi', 'metro', 'bus', 'autobus', 'camion', 'gasolina',
    'diesel', 'bicicleta', 'tren', 'avion', 'vuelo', 'parking', 'estacionamiento',
    'peaje', 'caseta', 'transporte', 'ride', 'moto',
  ],
  hogar: [
    'renta', 'alquiler', 'luz', 'agua', 'internet', 'predial', 'mantenimiento',
    'limpieza', 'mueble', 'electrodomestico', 'plomero', 'electricista', 'hogar',
    'casa', 'departamento', 'depa', 'habitacion', 'jardin', 'pintura',
  ],
  salud: [
    'doctor', 'medico', 'farmacia', 'medicina', 'hospital', 'consulta', 'dentista',
    'gym', 'gimnasio', 'vitaminas', 'salud', 'terapia', 'psicologo', 'nutriologo',
    'laboratorio', 'analisis', 'optometrista', 'lentes',
  ],
  ocio: [
    'netflix', 'spotify', 'disney', 'cine', 'pelicula', 'juego', 'videojuego',
    'fiesta', 'evento', 'concierto', 'teatro', 'viaje', 'hotel', 'musica', 'ocio',
    'entretenimiento', 'bar', 'antro', 'club', 'vacacion', 'turismo',
  ],
  servicios: [
    'telmex', 'telcel', 'att', 'movistar', 'telefono', 'celular', 'banco', 'bank',
    'seguro', 'pension', 'servicios', 'suscripcion', 'subscription', 'membresia',
  ],
  educacion: [
    'escuela', 'universidad', 'curso', 'libro', 'clase', 'tutor', 'aprendizaje',
    'taller', 'diplomado', 'maestria', 'educacion', 'capacitacion', 'certificacion',
    'colegio', 'kinder',
  ],
  compras: [
    'amazon', 'ropa', 'zapatos', 'electronics', 'computadora', 'laptop', 'telefono',
    'tienda', 'compras', 'shopping', 'moda', 'accesorios', 'joyeria', 'bolsa',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Determines the habit group for a transaction.
 * Priority: explicit habitCategory field → direct label match → keyword match → 'otro'
 */
export function inferHabitGroup(concept: string, habitCategory?: string): HabitGroupId {
  // 1. Explicit field
  if (habitCategory) {
    const norm = stripAccents(habitCategory);
    const found = HABIT_GROUPS.find(g => g.id === norm);
    if (found) return found.id;
  }

  const normConcept = stripAccents(concept);

  // 2. Direct label match (handles Registro quick-entry concepts like "Comida", "Transporte")
  const labelMatch = HABIT_GROUPS.find(g => stripAccents(g.label) === normConcept);
  if (labelMatch) return labelMatch.id;

  // 3. Keyword match
  for (const [groupId, keywords] of Object.entries(KEYWORD_MAP) as [Exclude<HabitGroupId, 'otro'>, string[]][]) {
    for (const kw of keywords) {
      if (normConcept.includes(stripAccents(kw))) return groupId;
    }
  }

  return 'otro';
}

/**
 * Computes stats per habit group from a list of transactions.
 * Only expense transactions are counted.
 * Returns all 9 groups, sorted by current-month total descending.
 */
export function computeHabitStats(transactions: Transaction[]): HabitGroupStats[] {
  const now = new Date();

  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  type Bucket = { monthly: number; weekly: number; count: number; prevMonth: number };
  const buckets = new Map<HabitGroupId, Bucket>();
  for (const g of HABIT_GROUPS) {
    buckets.set(g.id, { monthly: 0, weekly: 0, count: 0, prevMonth: 0 });
  }

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;

    const txDate = parseLocalDate(tx.date);
    const gid = inferHabitGroup(tx.concept, tx.habitCategory);
    const b = buckets.get(gid)!;

    if (txDate >= monthStart && txDate <= now) {
      b.monthly += tx.amount;
      b.count   += 1;
    }
    if (txDate >= weekStart && txDate <= now) {
      b.weekly += tx.amount;
    }
    if (txDate >= prevMonthStart && txDate <= prevMonthEnd) {
      b.prevMonth += tx.amount;
    }
  }

  return HABIT_GROUPS
    .map(meta => ({
      meta,
      monthlyTotal:   buckets.get(meta.id)!.monthly,
      weeklyTotal:    buckets.get(meta.id)!.weekly,
      count:          buckets.get(meta.id)!.count,
      prevMonthTotal: buckets.get(meta.id)!.prevMonth,
    }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
}
