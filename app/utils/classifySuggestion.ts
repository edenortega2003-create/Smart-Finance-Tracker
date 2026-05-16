import {
  ExpenseClassification,
  IncomeClassification,
  Regularity,
  TransactionType,
} from '../types';

const expenseMap: Record<ExpenseClassification, string[]> = {
  hormiga: [
    'dulce', 'cafe', 'cafe', 'snack', 'propina', 'chicle', 'refresco',
    'gomitas', 'botana', 'antojo', 'paleta', 'galleta', 'candy', 'gum',
    'agua embotellada', 'jugo', 'soda', 'helado',
  ],
  fijo: [
    'renta', 'luz', 'internet', 'agua', 'hipoteca', 'seguro', 'netflix',
    'spotify', 'suscripcion', 'mensualidad', 'pension', 'cuota fija',
    'telefono', 'celular', 'gas fijo', 'cable',
  ],
  variable: [
    'comida', 'despensa', 'gasolina', 'transporte', 'uber', 'lyft', 'taxi',
    'mercado', 'supermercado', 'restaurant', 'restaurante', 'farmacia',
    'medicamento', 'didi', 'beat', 'camion', 'metro', 'combustible',
  ],
  esporadico: [
    'inscripcion', 'mantenimiento', 'vacaciones', 'predial', 'reparacion',
    'dentista', 'medico', 'doctor', 'viaje', 'hotel', 'vuelo', 'evento',
    'boda', 'fiesta', 'curso', 'licencia', 'tramite',
  ],
  inversion: [
    'accion', 'crypto', 'cetes', 'fondo', 'bolsa', 'inversion', 'etf',
    'bono', 'divisa', 'bitcoin', 'ethereum', 'trading', 'deposito inversion',
  ],
  deuda: [
    'deuda', 'prestamo', 'credito', 'tarjeta', 'abono', 'pago deuda',
    'financiamiento', 'mensualidad credito', 'interes',
  ],
  ahorro: [
    'ahorro', 'reserva', 'fondo emergencia', 'piggy', 'alcancia',
    'deposito ahorro', 'guardado',
  ],
  otro: [],
};

const incomeMap: Record<IncomeClassification, string[]> = {
  sueldo: [
    'salario', 'sueldo', 'nomina', 'quincena', 'pago trabajo',
    'pago mensual', 'honorarios', 'sueldo mensual',
  ],
  venta: [
    'venta', 'cliente', 'freelance', 'servicio', 'cobro', 'proyecto',
    'factura', 'comision', 'vendi', 'cobré', 'pago cliente',
  ],
  regalo: [
    'regalo', 'donacion', 'obsequio', 'propina recibida', 'aguinaldo',
  ],
  inversion: [
    'dividendo', 'rendimiento', 'ganancia', 'crypto', 'accion', 'retorno',
    'utilidad', 'intereses', 'rendimiento fondo',
  ],
  reembolso: [
    'reembolso', 'devolucion', 'cashback', 'reintegro', 'regreso dinero',
    'me devolvieron', 'devolucion seguro',
  ],
  otro: [],
};

const regularityByClassification: Record<
  ExpenseClassification | IncomeClassification,
  Regularity
> = {
  fijo:       'recurrente',
  variable:   'regular',
  hormiga:    'eventual',
  esporadico: 'eventual',
  inversion:  'eventual',
  deuda:      'recurrente',
  ahorro:     'recurrente',
  sueldo:     'recurrente',
  venta:      'eventual',
  regalo:     'eventual',
  reembolso:  'eventual',
  otro:       'no_regular',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function suggestFromConcept(
  concept: string,
  type: TransactionType
): { classification: ExpenseClassification | IncomeClassification; regularity: Regularity } {
  const normalized = normalize(concept.trim());
  const map = type === 'expense' ? expenseMap : incomeMap;

  for (const [cls, keywords] of Object.entries(map)) {
    for (const keyword of keywords) {
      if (normalized.includes(normalize(keyword))) {
        const classification = cls as ExpenseClassification | IncomeClassification;
        return { classification, regularity: regularityByClassification[classification] };
      }
    }
  }

  const fallback: ExpenseClassification | IncomeClassification = 'otro';
  return { classification: fallback, regularity: 'no_regular' };
}

// ── Labels para display ──────────────────────────────────────────────────────

export const expenseClassificationLabels: Record<ExpenseClassification, string> = {
  hormiga:    'Hormiga',
  fijo:       'Fijo',
  variable:   'Variable',
  esporadico: 'Esporádico / grande',
  inversion:  'Inversión',
  deuda:      'Deuda',
  ahorro:     'Ahorro',
  otro:       'Otro',
};

export const incomeClassificationLabels: Record<IncomeClassification, string> = {
  sueldo:    'Sueldo',
  venta:     'Venta',
  regalo:    'Regalo',
  inversion: 'Inversión',
  reembolso: 'Reembolso',
  otro:      'Otro',
};

export const regularityLabels: Record<Regularity, string> = {
  regular:    'Regular',
  no_regular: 'No regular',
  recurrente: 'Recurrente',
  eventual:   'Eventual',
};

export function getClassificationLabel(
  classification: ExpenseClassification | IncomeClassification | undefined,
  type: TransactionType
): string {
  if (!classification) return '—';
  if (type === 'expense') {
    return expenseClassificationLabels[classification as ExpenseClassification] ?? String(classification);
  }
  return incomeClassificationLabels[classification as IncomeClassification] ?? String(classification);
}

export function getRegularityLabel(regularity: Regularity | undefined): string {
  if (!regularity) return '—';
  return regularityLabels[regularity] ?? String(regularity);
}
