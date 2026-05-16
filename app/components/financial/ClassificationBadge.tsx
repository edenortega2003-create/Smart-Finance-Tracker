import { Badge } from '../ui/Badge';
import { getClassificationLabel } from '../../utils/classifySuggestion';
import type { ExpenseClassification, IncomeClassification, TransactionType } from '../../types';
import { cn } from '@/lib/utils';

interface ClassificationBadgeProps {
  classification: ExpenseClassification | IncomeClassification;
  type: TransactionType;
  size?: 'sm' | 'md';
  className?: string;
}

export function ClassificationBadge({
  classification,
  type,
  size = 'sm',
  className,
}: ClassificationBadgeProps) {
  const label = getClassificationLabel(classification, type);
  return <Badge label={label} variant="default" size={size} className={className} />;
}
