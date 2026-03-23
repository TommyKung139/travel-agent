import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, CreditCard, Banknote, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Reward_Rules } from '../../services/db';

interface ExpenseActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description: string, paymentMethod: string) => void;
}

export function ExpenseActionSheet({ isOpen, onClose, onSubmit }: ExpenseActionSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Reset state when opened
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount('');
      setDescription('');
    }
  }, [isOpen]);

  const handleNextStep1 = () => {
    if (!amount || !description) return;
    setStep(2);
  };

  const handleSelectCash = () => {
    onSubmit(parseFloat(amount), description, '現金');
    onClose();
  };

  const handleSelectCreditCard = (cardId: string) => {
    const cardName = Reward_Rules[cardId].name;
    onSubmit(parseFloat(amount), description, cardName);
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
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                記一筆花費
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-2">消費金額</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-2xl font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-2">消費品項 / 地點</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="例如：大安區晚餐、全家買水"
                        className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <button
                      onClick={handleNextStep1}
                      disabled={!amount || !description}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      下一步
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <p className="text-stone-500 mb-1">剛剛花了 ${amount}</p>
                      <h3 className="text-2xl font-bold text-stone-800">這筆是用什麼付的呀？</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleSelectCash}
                        className="flex flex-col items-center justify-center p-6 bg-stone-50 hover:bg-stone-100 border-2 border-stone-200 rounded-3xl transition-all gap-4"
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Banknote className="w-8 h-8 text-emerald-600" />
                        </div>
                        <span className="font-bold text-stone-700 text-lg">現金 Cash</span>
                      </button>

                      <button
                        onClick={() => setStep(3)}
                        className="flex flex-col items-center justify-center p-6 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-3xl transition-all gap-4"
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <CreditCard className="w-8 h-8 text-emerald-600" />
                        </div>
                        <span className="font-bold text-stone-700 text-lg">信用卡 Card</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => setStep(2)}
                        className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500 -ml-2"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <h3 className="text-xl font-bold text-stone-800">選擇信用卡</h3>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(Reward_Rules).map(([id, rawRule]) => {
                        const rule = rawRule as { name: string; spend_cap: number; bank: string };
                        return (
                        <button
                          key={id}
                          onClick={() => handleSelectCreditCard(id)}
                          className="w-full flex items-center p-4 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl transition-all text-left group"
                        >
                          <div className="w-12 h-8 bg-gradient-to-br from-stone-700 to-stone-900 rounded-md mr-4 flex items-center justify-center shadow-inner relative overflow-hidden">
                            <div className="absolute top-1 right-1 w-2 h-1.5 bg-yellow-400/50 rounded-sm"></div>
                            <span className="text-[10px] text-white/80 font-bold tracking-wider">{rule.bank}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800">{rule.name}</h4>
                            <p className="text-xs text-stone-500">回饋上限: ${rule.spend_cap.toLocaleString()}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 transition-colors" />
                        </button>
                      )})}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
