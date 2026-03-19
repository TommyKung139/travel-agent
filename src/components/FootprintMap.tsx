import { motion } from 'framer-motion';
import type { LocationPin } from '../services/ai';

export default function FootprintMap({ locations }: { locations: LocationPin[] }) {
  // Mock abstract map positions since we don't have real lat/lng
  const getMockPosition = (index: number) => {
    // Generate a pseudo-random looking path
    const seed = (index * 137) % 100;
    const x = 20 + (seed % 60); // 20% to 80% width
    const y = 20 + ((seed * 1.5) % 60); // 20% to 80% height
    return { x: `${x}%`, y: `${y}%` };
  };

  const hasPins = locations.length > 0;

  return (
    <div className="w-full h-full bg-pikmin-cream rounded-2xl border border-border overflow-hidden relative" 
         style={{ backgroundImage: 'linear-gradient(hsla(140,20%,15%,0.08) 1px, transparent 1px), linear-gradient(90deg, hsla(140,20%,15%,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      
      {/* Decorative environment elements */}
      <div className="absolute top-10 left-10 text-2xl opacity-40">🌳</div>
      <div className="absolute top-20 right-16 text-3xl opacity-40">🏔️</div>
      <div className="absolute bottom-16 left-8 text-2xl opacity-40">🏠</div>
      <div className="absolute bottom-8 right-12 text-3xl opacity-40">⛩️</div>

      {!hasPins ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground z-10 bg-background/50 backdrop-blur-[2px]">
          <motion.div 
            className="w-16 h-16 rounded-full bg-pikmin-bloom/20 flex items-center justify-center shadow-float mb-4 text-xs font-bold text-pikmin-bloom border-[3px] border-pikmin-bloom/30"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            咻妮
          </motion.div>
          <p className="text-sm font-bold mb-1">地圖上還空空的～</p>
          <p className="text-xs">跟咻妮說你去了哪裡，就會在地圖上留下腳印喔 👣</p>
        </div>
      ) : (
        <div className="relative w-full h-full z-10">
          {/* Paths connecting pins */}
          {locations.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {locations.map((_, i) => {
                if (i === 0) return null;
                const prev = getMockPosition(i - 1);
                const curr = getMockPosition(i);
                return (
                  <line 
                    key={`line-${i}`}
                    x1={prev.x} y1={prev.y} 
                    x2={curr.x} y2={curr.y}
                    stroke="var(--pikmin-leaf)"
                    strokeWidth="2"
                    strokeDasharray="6,6"
                    className="opacity-50"
                  />
                );
              })}
            </svg>
          )}

          {/* Pins */}
          {locations.map((loc, i) => {
            const isLatest = i === locations.length - 1;
            const pos = getMockPosition(i);
            return (
              <motion.div 
                key={i}
                className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: pos.x, top: pos.y, zIndex: isLatest ? 20 : 10 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-9 h-9 rounded-full bg-card border-[3px] border-primary shadow-float flex items-center justify-center text-lg z-10 relative">
                  📍
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] whitespace-nowrap px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {loc.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-foreground" />
                  </div>
                </div>

                {/* Shuni at the latest pin */}
                {isLatest && (
                  <motion.div 
                    className="absolute -top-8 -right-8 w-10 h-10 rounded-full bg-pikmin-bloom border-[2px] border-pikmin-cream flex items-center justify-center shadow-float text-[10px] text-primary-foreground font-bold z-20"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                  >
                    咻妮
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
