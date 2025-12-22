import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  bookingId: string;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ChatButton({
  bookingId,
  onClick,
  variant = 'ghost',
  size = 'icon',
  className,
}: ChatButtonProps) {
  const { unreadCount } = useUnreadMessages(bookingId);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn('relative', className)}
      title="Abrir chat"
    >
      <MessageCircle className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}
    </Button>
  );
}
