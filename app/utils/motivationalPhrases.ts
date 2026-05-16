const phrases: string[] = [
  'Controlar tu dinero no es limitarte, es darte claridad.',
  'Lo que registras, lo puedes mejorar.',
  'Un gasto pequeño también cuenta cuando se repite.',
  'Conocer tus hábitos financieros es el primer paso para cambiarlos.',
  'Hoy no necesitas perfección, solo registrar con honestidad.',
  'Cada registro es un paso hacia la libertad financiera.',
  'El control financiero es un hábito, no un talento.',
  'Registrar gastos pequeños marca la diferencia a fin de mes.',
  'Tu dinero futuro empieza con las decisiones de hoy.',
  'No se trata de gastar menos, sino de gastar con propósito.',
  'Un presupuesto no es una restricción, es un plan.',
  'La conciencia financiera transforma pequeños hábitos en grandes cambios.',
  'Hoy es un buen día para conocer mejor tu dinero.',
  'Lo que no se mide, no se puede mejorar.',
  'Cada peso registrado es un paso hacia tus metas.',
  'El ahorro de hoy es la libertad de mañana.',
  'Pequeñas decisiones, grandes resultados con el tiempo.',
  'La disciplina financiera se construye un registro a la vez.',
  'Invertir en conocerte financieramente siempre tiene retorno.',
  'La mejor inversión es entender en qué gastas.',
];

export function getDailyPhrase(): string {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return phrases[dayIndex % phrases.length];
}
