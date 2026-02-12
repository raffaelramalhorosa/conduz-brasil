import { useState } from 'react';
import { Info } from 'lucide-react';

export default function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-[200px] left-4 z-[1000]">
      <div
        className="bg-white/95 rounded-[10px] shadow-md cursor-pointer transition-all duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <div className="p-2.5 space-y-1.5 min-w-[180px]">
            <div className="flex items-center gap-2 text-[11px] text-foreground">
              <span className="w-3 h-3 rounded-full bg-[#FF8C00] inline-block flex-shrink-0" />
              Instrutor independente
            </div>
            <div className="flex items-center gap-2 text-[11px] text-foreground">
              <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] inline-block flex-shrink-0" />
              Autoescola
            </div>
            <div className="flex items-center gap-2 text-[11px] text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA] inline-block flex-shrink-0" />
              Instrutor de autoescola
            </div>
            <div className="flex items-center gap-2 text-[11px] text-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />
              Online agora
            </div>
          </div>
        ) : (
          <div className="p-2">
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
