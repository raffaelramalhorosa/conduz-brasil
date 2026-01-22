import { ReactNode, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedChatContainerProps {
  conversationId: string | null;
  children: ReactNode;
  className?: string;
}

export function AnimatedChatContainer({ 
  conversationId, 
  children, 
  className = '' 
}: AnimatedChatContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={conversationId || 'empty'}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ 
          duration: 0.25,
          ease: 'easeInOut'
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface AnimatedMessageProps {
  children: ReactNode;
  className?: string;
  isNew?: boolean;
}

export function AnimatedMessage({ 
  children, 
  className = '',
  isNew = false 
}: AnimatedMessageProps) {
  return (
    <motion.div
      initial={isNew ? { opacity: 0, scale: 0.95, y: 10 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.2,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SmoothScrollContainerProps {
  children: ReactNode;
  className?: string;
  dependency?: unknown;
}

export function useSmoothScroll(dependency?: unknown) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [dependency]);

  return scrollRef;
}
