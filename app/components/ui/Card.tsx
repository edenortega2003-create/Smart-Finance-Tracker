import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ glass = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // et-card is defined in globals.css — always renders, no Tailwind scanning required
        glass
          ? 'rounded-2xl p-5 bg-white/10 backdrop-blur-[16px] saturate-[1.6] border border-white/[0.18] shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
          : 'et-card p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
