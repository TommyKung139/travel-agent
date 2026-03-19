import { Footprints } from 'lucide-react';
import { motion } from 'framer-motion';
import type { JourneyEntry } from '../services/ai';

const typeColors: Record<JourneyEntry['type'], { bg: string, border: string }> = {
  checkin: { bg: 'bg-pikmin-sky/15', border: 'border-pikmin-sky' },
  expense: { bg: 'bg-pikmin-sun/15', border: 'border-pikmin-sun' },
  note: { bg: 'bg-pikmin-leaf/15', border: 'border-pikmin-leaf' }
};

export default function JourneyTimeline({ entries }: { entries: JourneyEntry[] }) {
  return (
    <div className="flex flex-col h-full bg-background p-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Footprints className="text-pikmin-leaf" size={24} />
        <h2 className="font-display text-lg font-bold text-foreground">今日足跡</h2>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}
        </span>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 relative">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4 pb-10">
            <motion.div 
              className="text-5xl opacity-50"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              🌿
            </motion.div>
            <div className="text-sm">
              <p>今天的冒險還沒開始</p>
              <p>跟咻妮說說你在哪裡吧！</p>
            </div>
          </div>
        ) : (
          <div className="relative pl-3">
            {/* Vertical Line */}
            <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-border rounded-full" />
            
            <div className="flex flex-col gap-6 relative z-10">
              {entries.map((entry, i) => (
                <motion.div 
                  key={entry.id} 
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {/* Node */}
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <div className={`w-[30px] h-[30px] rounded-full border-[3px] flex items-center justify-center shadow-sm ${typeColors[entry.type].bg} ${typeColors[entry.type].border} bg-background`}>
                      <div className={`w-2 h-2 rounded-full ${typeColors[entry.type].border.replace('border-', 'bg-')}`} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-card border border-border rounded-xl p-3 shadow-card hover:shadow-float transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-foreground">{entry.title}</span>
                      <span className="text-xs text-muted-foreground">{entry.time}</span>
                    </div>
                    
                    {entry.detail && (
                      <p className="text-xs text-muted-foreground mb-2">{entry.detail}</p>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      {entry.type === 'expense' && entry.amount !== undefined && (
                        <span className="bg-pikmin-cream/50 text-pikmin-earth text-xs font-bold px-2 py-0.5 rounded-md">
                          {entry.currency} {entry.amount}
                        </span>
                      )}
                      {entry.location && entry.type !== 'checkin' && (
                        <span className="text-pikmin-sky text-xs flex items-center gap-0.5">
                          📍 {entry.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
