import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('font-sans text-sm font-semibold text-midnight block mb-1.5', className)}
      {...props}
    />
  );
}
