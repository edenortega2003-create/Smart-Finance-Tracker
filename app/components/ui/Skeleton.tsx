import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'text' | 'circle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

const variantClasses: Record<SkeletonVariant, string> = {
  card:   'h-28 rounded-xl',
  text:   'h-4 rounded',
  circle: 'rounded-full',
};

export function Skeleton({ variant = 'card', className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200/60',
        variantClasses[variant],
        className,
      )}
      aria-hidden="true"
    />
  );
}
