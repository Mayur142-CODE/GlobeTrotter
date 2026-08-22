import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-11 px-4 rounded-lg border border-midnight/20 bg-parchment-50 font-sans text-ink placeholder:text-ink/40 transition-colors focus-ring focus:border-teal',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
