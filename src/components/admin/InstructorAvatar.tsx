import { cn } from '@/lib/utils';

interface InstructorAvatarProps {
  photoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

export function InstructorAvatar({ photoUrl, name, size = 'md', className }: InstructorAvatarProps) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  const sizeClass = sizeClasses[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn(sizeClass, 'rounded-full object-cover border-2 border-white/20 shadow-sm', className)}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          const next = e.currentTarget.nextElementSibling as HTMLElement;
          if (next) next.classList.remove('hidden');
        }}
      />
    );
  }

  return (
    <div className={cn(
      sizeClass,
      'rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold shrink-0',
      className
    )}>
      {initials}
    </div>
  );
}
