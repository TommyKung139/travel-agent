import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import type { ItineraryDay } from '../../services/ai';

interface EditPlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: ItineraryDay[];
  onSave: (updatedItinerary: ItineraryDay[]) => void;
}

export function EditPlanSheet({ isOpen, onClose, itinerary, onSave }: EditPlanSheetProps) {
  // Deep clone strategy for local editing
  const [localItin, setLocalItin] = useState<ItineraryDay[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalItin(JSON.parse(JSON.stringify(itinerary)));
    }
  }, [isOpen, itinerary]);

  const handleUpdateActivity = (dayIndex: number, actIndex: number, field: string, value: string) => {
    const updated = [...localItin];
    (updated[dayIndex].activities[actIndex] as any)[field] = value;
    setLocalItin(updated);
  };

  const handleAddActivity = (dayIndex: number) => {
    const updated = [...localItin];
    updated[dayIndex].activities.push({
      time: "12:00",
      title: "新行程",
      location: ""
    });
    setLocalItin(updated);
  };

  const handleDeleteActivity = (dayIndex: number, actIndex: number) => {
    const updated = [...localItin];
    updated[dayIndex].activities.splice(actIndex, 1);
    setLocalItin(updated);
  };

  const handleSave = () => {
    onSave(localItin);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 lg:hidden" // Only dim on mobile usually, but let's dimension everywhere
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-stone-50 rounded-t-3xl z-50 overflow-hidden shadow-2xl h-[90vh] flex flex-col md:max-w-2xl md:mx-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white border-b border-stone-200 shrink-0 shadow-sm sticky top-0 z-10">
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-stone-800 tracking-wider">✏️ 修改行程</h2>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-full text-white font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" /> 儲存
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
              {localItin.map((day, dIdx) => (
                <div key={dIdx} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="bg-stone-100/50 px-4 py-3 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-stone-800">
                      Day {day.dayIndex} <span className="font-normal text-stone-500 text-sm ml-2">{day.date}</span>
                    </h3>
                    <button 
                      onClick={() => handleAddActivity(dIdx)}
                      className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> 新增
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {day.activities.map((act, aIdx) => (
                      <div key={aIdx} className="flex gap-3 items-start group relative bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <div className="flex flex-col gap-2 w-20 shrink-0">
                           <div className="flex items-center gap-1 text-stone-400 text-xs font-bold pl-1"><Clock className="w-3 h-3"/> 時間</div>
                           <input
                            type="time"
                            value={act.time}
                            onChange={(e) => handleUpdateActivity(dIdx, aIdx, 'time', e.target.value)}
                            className="bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm font-medium w-full text-stone-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <input
                            type="text"
                            value={act.title}
                            placeholder="行程名稱"
                            onChange={(e) => handleUpdateActivity(dIdx, aIdx, 'title', e.target.value)}
                            className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-bold w-full text-stone-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                          />
                          <div className="relative">
                            <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                              type="text"
                              value={act.location}
                              placeholder="地點 (選填)"
                              onChange={(e) => handleUpdateActivity(dIdx, aIdx, 'location', e.target.value)}
                              className="bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium w-full text-stone-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteActivity(dIdx, aIdx)}
                          className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {day.activities.length === 0 && (
                      <div className="text-center py-4 text-stone-400 text-sm">此日尚未安排行程</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
