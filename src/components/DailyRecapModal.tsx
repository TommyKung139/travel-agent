import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarHeart, Receipt, Heart } from 'lucide-react';
import type { ExpenseItem, LocationPin } from '../services/ai';
import FootprintMap from './FootprintMap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  locations: LocationPin[];
}

export default function DailyRecapModal({ isOpen, onClose, expenses, locations }: Props) {
  const [step, setStep] = useState(0);

  // Auto-advance animation sequence
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }
    
    // Step 0: Initial map
    // Step 1: Date drops in
    // Step 2: Location pins pop up
    // Step 3: Photos/Stats drop in
    // Step 4: Final badge
    
    const timeouts = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2800),
      setTimeout(() => setStep(4), 4500),
    ];
    
    return () => timeouts.forEach(clearTimeout);
  }, [isOpen]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = expenses[0]?.currency || 'TWD';
  const todayStr = new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 lg:p-12 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors active:scale-90">
          <X size={24} />
        </button>

        {/* The Frame */}
        <motion.div 
          className="relative w-full max-w-md h-[80vh] bg-pikmin-sky/30 rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center border-[4px] border-white/50"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")',
            backgroundBlendMode: 'overlay',
          }}
        >
          {/* Animated Background Elements */}
          <motion.div className="absolute inset-0 bg-gradient-to-t from-pikmin-leaf-dark/90 via-pikmin-leaf/60 to-transparent z-0" />
          
          <div className="relative z-10 w-full h-full flex flex-col items-center pt-10">
            
            {/* Step 1: Date & Title */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div 
                  initial={{ y: -50, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="flex flex-col items-center text-white"
                >
                  <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 mb-2 border border-white/30">
                    <CalendarHeart size={16} /> <span>今日小結</span>
                  </div>
                  <h2 className="text-4xl font-display font-black tracking-wider drop-shadow-lg flex items-baseline gap-2">
                    {todayStr.split(' ')[0]} 
                    <span className="text-xl opacity-90">{todayStr.split(' ')[1]}</span>
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 2: FootprintMap appearing */}
            <AnimatePresence>
               {step >= 2 && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 1 }}
                   className="w-11/12 mt-6 h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-white z-20"
                 >
                   <FootprintMap locations={locations} />
                 </motion.div>
               )}
            </AnimatePresence>

            {/* No Locations Fallback */}
            {locations.length === 0 && step >= 2 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1/2 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full text-foreground shadow-sm">
                  🌱 今天還沒有移動足跡喔！
                </motion.div>
            )}

            {/* Step 4: Final Badge (Expense & Steps) */}
            <AnimatePresence>
                {step >= 4 && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', bounce: 0.6 }}
                    className="absolute bottom-8 w-11/12 bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-30 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                        📍 新增足跡
                      </div>
                      <div className="text-2xl font-display font-black text-foreground">
                        {locations.length} <span className="text-sm font-medium opacity-60">個地點</span>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-border mx-2" />

                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                        <Receipt size={14} className="text-pikmin-bloom" /> 今日花費
                      </div>
                      <div className="text-2xl font-display font-black text-primary flex items-baseline gap-1">
                        <span className="text-sm font-medium opacity-60">{currency}</span>
                        {totalSpent.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Cute floating badge */}
                    <motion.div 
                      className="absolute -top-4 -right-2 bg-pikmin-sun text-pikmin-earth font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1 border-2 border-white"
                      animate={{ y: [-2, 2, -2], rotate: [-2, 2, -2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Heart size={12} className="fill-pikmin-earth" /> 完美的一天
                    </motion.div>
                  </motion.div>
                )}
             </AnimatePresence>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
