import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-lg border border-midnight/20 bg-parchment-50 font-sans text-ink placeholder:text-ink/40 transition-colors focus-ring focus:border-teal resize-y min-h-[100px]',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
