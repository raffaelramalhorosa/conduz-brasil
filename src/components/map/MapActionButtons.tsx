import { LocateFixed, Plus, Minus } from 'lucide-react';

interface Props {
  onRecenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function MapActionButtons({ onRecenter, onZoomIn, onZoomOut }: Props) {
  const btnClass =
    'w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-50 transition-colors border border-border';

  return (
    <div className="absolute bottom-[200px] md:bottom-[220px] right-4 z-[1000] flex flex-col gap-2">
      <button onClick={onRecenter} className={btnClass} aria-label="Recentrar">
        <LocateFixed className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
      </button>
      <button onClick={onZoomIn} className={btnClass} aria-label="Zoom in">
        <Plus className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
      </button>
      <button onClick={onZoomOut} className={btnClass} aria-label="Zoom out">
        <Minus className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
      </button>
    </div>
  );
}
