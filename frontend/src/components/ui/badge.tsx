import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'teal' | 'coral' | 'gold' | 'midnight' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-midnight/10 text-midnight',
  secondary: 'bg-parchment-200/80 text-ink/70 border border-parchment-300/60',
  teal: 'bg-teal/15 text-teal-700',
  coral: 'bg-coral/15 text-coral-700',
  gold: 'bg-gold/20 text-gold-800',
  midnight: 'bg-midnight text-parchment-50',
  outline: 'border border-midnight/30 text-midnight',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
