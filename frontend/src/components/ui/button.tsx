import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'coral' | 'outline' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-teal text-parchment-50 hover:bg-teal-600 active:bg-teal-700',
  secondary: 'bg-midnight text-parchment-50 hover:bg-midnight-600 active:bg-midnight-700',
  coral: 'bg-coral text-parchment-50 hover:bg-coral-600 active:bg-coral-700',
  gold: 'bg-gold text-midnight hover:bg-gold-600 active:bg-gold-700',
  outline: 'border border-midnight/30 text-midnight bg-transparent hover:bg-midnight/5',
  ghost: 'text-midnight hover:bg-midnight/5',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-lg',
  lg: 'h-12 px-7 text-base rounded-xl',
  icon: 'h-10 w-10 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-sans font-semibold transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
