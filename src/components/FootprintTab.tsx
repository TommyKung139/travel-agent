import type { LocationPin, JourneyEntry } from '../services/ai';
import FootprintMap from './FootprintMap';
import JourneyTimeline from './JourneyTimeline';

interface Props {
  entries: JourneyEntry[];
  locations: LocationPin[];
}

export default function FootprintTab({ entries, locations }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-6">
      <div className="h-64 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-border">
         <FootprintMap locations={locations} />
      </div>
      <div className="bg-card border border-border rounded-xl px-4 py-4 shadow-sm flex-1 mb-4">
         <h3 className="text-sm font-bold text-muted-foreground mb-4 flex items-center gap-2">
           👣 今日足跡軌跡
         </h3>
         <JourneyTimeline entries={entries} />
      </div>
    </div>
  );
}
