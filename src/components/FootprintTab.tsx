import { useState } from 'react';
import type { LocationPin, JourneyEntry, ExpenseItem } from '../services/ai';
import FootprintMap from './FootprintMap';
import JourneyTimeline from './JourneyTimeline';
import DailyRecapModal from './DailyRecapModal';

interface Props {
  entries: JourneyEntry[];
  locations: LocationPin[];
  expenses: ExpenseItem[];
}

export default function FootprintTab({ entries, locations, expenses }: Props) {
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-6 relative">
      <button 
        onClick={() => setIsRecapOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-nature text-primary-foreground font-bold py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
      >
        <span>✨</span> 產生專屬今日小結
      </button>

      <div className="h-64 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-border">
         <FootprintMap locations={locations} />
      </div>

      <div className="bg-card border border-border rounded-xl px-4 py-4 shadow-sm flex-1 mb-4">
         <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
           👣 今日足跡軌跡
         </h3>
         <JourneyTimeline entries={entries} />
      </div>

      <DailyRecapModal 
        isOpen={isRecapOpen} 
        onClose={() => setIsRecapOpen(false)} 
        expenses={expenses} 
        locations={locations} 
      />
    </div>
  );
}
