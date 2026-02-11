import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  onClick: () => void;
}

export default function SearchAreaButton({ visible, onClick }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[90px] md:top-[100px] left-1/2 -translate-x-1/2 z-[1000]"
        >
          <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-foreground hover:bg-primary hover:text-white transition-colors border border-border"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Buscar nesta área
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
