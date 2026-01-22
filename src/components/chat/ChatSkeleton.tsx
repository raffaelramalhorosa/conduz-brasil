import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChatSkeletonProps {
  variant?: 'light' | 'dark';
}

export function ConversationListSkeleton({ variant = 'light' }: ChatSkeletonProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            'p-4 flex items-start gap-3',
            isDark ? 'bg-white/5' : 'bg-slate-50'
          )}
        >
          <Skeleton 
            className={cn(
              'h-12 w-12 rounded-full shrink-0',
              isDark ? 'bg-white/10' : 'bg-slate-200'
            )} 
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton 
                className={cn(
                  'h-4 w-24',
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                )} 
              />
              <Skeleton 
                className={cn(
                  'h-3 w-12',
                  isDark ? 'bg-white/10' : 'bg-slate-200'
                )} 
              />
            </div>
            <Skeleton 
              className={cn(
                'h-3 w-3/4',
                isDark ? 'bg-white/10' : 'bg-slate-200'
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
  
  // Simulating a mix of sent and received messages
  const messageWidths = [
    { width: 'w-3/4', align: 'justify-start' },
    { width: 'w-1/2', align: 'justify-end' },
    { width: 'w-2/3', align: 'justify-start' },
    { width: 'w-1/3', align: 'justify-end' },
  ];

  return (
    <div className="space-y-4 p-4">
      {messageWidths.map((msg, i) => (
        <div key={i} className={cn('flex', msg.align)}>
          <Skeleton 
            className={cn(
              'h-16 rounded-2xl',
              msg.width,
              isDark ? 'bg-white/10' : 'bg-slate-200'
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
      'p-4 border-b flex items-center gap-3',
      isDark ? 'border-white/10' : 'border-slate-200'
    )}>
      <Skeleton 
        className={cn(
          'h-10 w-10 rounded-full',
          isDark ? 'bg-white/10' : 'bg-slate-200'
        )} 
      />
      <div className="space-y-2">
        <Skeleton 
          className={cn(
            'h-4 w-32',
            isDark ? 'bg-white/10' : 'bg-slate-200'
          )} 
        />
        <Skeleton 
          className={cn(
            'h-3 w-16',
            isDark ? 'bg-white/10' : 'bg-slate-200'
          )} 
        />
      </div>
    </div>
  );
}
