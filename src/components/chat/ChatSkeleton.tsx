import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChatSkeletonProps {
  variant?: 'light' | 'dark';
}

export function ConversationListSkeleton({ variant = 'light' }: ChatSkeletonProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            'p-4 flex items-start gap-3 border-b',
            isDark ? 'border-white/5' : 'border-border'
          )}
        >
          <Skeleton 
            className={cn(
              'h-12 w-12 rounded-full shrink-0',
              isDark ? 'bg-white/10' : 'bg-muted'
            )} 
          />
          <div className="flex-1 space-y-2 py-1">
            <div className="flex items-center justify-between">
              <Skeleton 
                className={cn(
                  'h-4 w-28',
                  isDark ? 'bg-white/10' : 'bg-muted'
                )} 
              />
              <Skeleton 
                className={cn(
                  'h-3 w-10',
                  isDark ? 'bg-white/10' : 'bg-muted'
                )} 
              />
            </div>
            <Skeleton 
              className={cn(
                'h-3 w-4/5',
                isDark ? 'bg-white/10' : 'bg-muted'
              )} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatMessagesSkeleton({ variant = 'light' }: ChatSkeletonProps) {
  const isDark = variant === 'dark';
  
  // Simulating alternating sent/received messages with varied widths
  const messagePatterns = [
    { width: 'w-[65%]', align: 'justify-start', height: 'h-14' },
    { width: 'w-[45%]', align: 'justify-end', height: 'h-12' },
    { width: 'w-[55%]', align: 'justify-start', height: 'h-16' },
    { width: 'w-[40%]', align: 'justify-end', height: 'h-10' },
    { width: 'w-[70%]', align: 'justify-start', height: 'h-14' },
  ];

  return (
    <div className="h-full flex flex-col justify-end space-y-3">
      {messagePatterns.map((msg, i) => (
        <div key={i} className={cn('flex', msg.align)}>
          <Skeleton 
            className={cn(
              'rounded-2xl',
              msg.width,
              msg.height,
              isDark ? 'bg-white/10' : 'bg-muted'
            )} 
          />
        </div>
      ))}
    </div>
  );
}

export function ChatHeaderSkeleton({ variant = 'light' }: ChatSkeletonProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className={cn(
      'p-4 border-b flex items-center gap-3 shrink-0',
      isDark ? 'border-white/10' : 'border-border'
    )}>
      <Skeleton 
        className={cn(
          'h-10 w-10 rounded-full shrink-0',
          isDark ? 'bg-white/10' : 'bg-muted'
        )} 
      />
      <div className="space-y-2">
        <Skeleton 
          className={cn(
            'h-4 w-32',
            isDark ? 'bg-white/10' : 'bg-muted'
          )} 
        />
        <Skeleton 
          className={cn(
            'h-3 w-16',
            isDark ? 'bg-white/10' : 'bg-muted'
          )} 
        />
      </div>
    </div>
  );
}

export function ChatInputSkeleton({ variant = 'light' }: ChatSkeletonProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className={cn(
      'p-4 border-t flex items-center gap-2 shrink-0',
      isDark ? 'border-white/10' : 'border-border'
    )}>
      <Skeleton 
        className={cn(
          'h-10 flex-1 rounded-md',
          isDark ? 'bg-white/10' : 'bg-muted'
        )} 
      />
      <Skeleton 
        className={cn(
          'h-10 w-10 rounded-md shrink-0',
          isDark ? 'bg-white/10' : 'bg-muted'
        )} 
      />
    </div>
  );
}
