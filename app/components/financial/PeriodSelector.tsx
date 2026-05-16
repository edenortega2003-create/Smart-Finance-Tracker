'use client';

import { Toggle } from '../ui/Toggle';
import { type Period, PERIOD_LABELS } from '../../utils/financialSuggestions';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  className?: string;
}

const options = (Object.keys(PERIOD_LABELS) as Period[]).map((key) => ({
  value: key,
  label: PERIOD_LABELS[key],
}));

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  return (
    <Toggle
      options={options}
      value={value}
      onChange={(v) => onChange(v as Period)}
      size="sm"
      className={cn(className)}
    />
  );
}
