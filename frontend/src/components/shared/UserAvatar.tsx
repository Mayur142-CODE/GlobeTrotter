import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-28 h-28 text-3xl font-semibold',
};

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'TR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  avatarUrl,
  name,
  size = 'md',
  className,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const hasValidUrl = avatarUrl && avatarUrl.trim().length > 0 && !imgError;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 flex items-center justify-center select-none font-serif',
        sizeClasses[size],
        !hasValidUrl && 'bg-gradient-to-br from-teal-600 to-midnight text-parchment-50 font-semibold border-2 border-teal/30',
        className
      )}
    >
      {hasValidUrl ? (
        <img
          src={avatarUrl}
          alt={name || 'Traveler avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
