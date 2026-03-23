import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Footprints, Wallet } from 'lucide-react';
import type { ExpenseItem, LocationPin, JourneyEntry, TravelPlan, PostTripStatus } from '../services/ai';
import TravelPlanTab from './TravelPlanTab';
import FootprintTab from './FootprintTab';
import ExpensePanel from './ExpensePanel';

interface Props {
  expenses: ExpenseItem[];
  entries: JourneyEntry[];
  locations: LocationPin[];
  forceTab?: 'plan' | 'footprint' | 'expense';
  onTabChange?: (tab: 'plan' | 'footprint' | 'expense') => void;
  travelPlan?: TravelPlan;
  postTripStatus?: PostTripStatus;
  phase?: 'idle' | 'planning' | 'traveling' | 'post_trip';
  onUpdatePlan?: (plan: TravelPlan) => void;
}

export type RightTabType = 'plan' | 'footprint' | 'expense';

export default function RightPanelTabs({ expenses, entries, locations, forceTab, onTabChange, travelPlan, postTripStatus, phase, onUpdatePlan }: Props) {
  const [activeTab, setActiveTab] = useState<RightTabType>(forceTab || 'plan');

  // Sync with prop if mobile forces a change
  if (forceTab && forceTab !== activeTab) {
    setActiveTab(forceTab);
  }

  const handleTabChange = (tab: RightTabType) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Desktop Top Tab Navigation (Hidden on mobile) */}
      <div className="hidden lg:flex items-center shrink-0 border-b border-border bg-card/50 backdrop-blur-md px-2 pt-2">
        <button 
          onClick={() => handleTabChange('plan')}
          className={`px-4 py-3 text-sm font-bold flex-1 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'plan' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Compass size={18} /> 旅遊規劃
        </button>
        <button 
          onClick={() => handleTabChange('footprint')}
          className={`px-4 py-3 text-sm font-bold flex-1 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'footprint' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Footprints size={18} /> 今日足跡
        </button>
        <button 
          onClick={() => handleTabChange('expense')}
          className={`px-4 py-3 text-sm font-bold flex-1 flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'expense' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Wallet size={18} /> 今日花費
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-muted/10 relative">
         <AnimatePresence mode="wait">
            {activeTab === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full">
                <TravelPlanTab travelPlan={travelPlan} postTripStatus={postTripStatus} phase={phase || 'idle'} onUpdatePlan={onUpdatePlan} />
              </motion.div>
            )}
            {activeTab === 'footprint' && (
              <motion.div key="footprint" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full">
                <FootprintTab entries={entries} locations={locations} expenses={expenses} />
              </motion.div>
            )}
            {activeTab === 'expense' && (
              <motion.div key="expense" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full p-4">
                <ExpensePanel expenses={expenses} />
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
