import type { ReactNode } from 'react';
import { Compass, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Compass, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-midnight/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-midnight/40" aria-hidden />
      </div>
      <h3 className="font-serif text-xl font-semibold text-midnight mb-1.5">{title}</h3>
      {description && <p className="font-sans text-sm text-ink/60 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
