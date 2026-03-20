import { useMemo } from 'react';
import type { ExpenseItem, ExpenseCategory } from '../services/ai';
import { motion } from 'framer-motion';

const expenseIcons: Record<ExpenseCategory, string> = {
  food: '🍜',
  transport: '🚃',
  shopping: '🛍️',
  lodging: '🏨',
  entertainment: '🎮',
  other: '📌'
};

const expenseLabels: Record<ExpenseCategory, string> = {
  food: '飲食',
  transport: '交通',
  shopping: '購物',
  lodging: '住宿',
  entertainment: '娛樂',
  other: '其他'
};

export default function ExpensePanel({ expenses }: { expenses: ExpenseItem[] }) {
  // Compute totals
  const totalAmount = useMemo(() => {
    // Naively summing up assuming same currency for prototype
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const currency = expenses.length > 0 ? expenses[0].currency : 'TWD';

  const categoryTotals = useMemo(() => {
    const totals = {} as Record<ExpenseCategory, number>;
    expenses.forEach(item => {
      totals[item.category] = (totals[item.category] || 0) + item.amount;
    });
    return totals;
  }, [expenses]);

  return (
    <div className="flex flex-col gap-6 p-4 h-full bg-background overflow-y-auto">
      {/* Total Card */}
      <motion.div 
        className="bg-gradient-nature rounded-2xl p-5 text-primary-foreground shadow-soft relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute right-[-20px] top-[-20px] text-8xl opacity-10 pointer-events-none">💰</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💰</span>
          <span className="text-sm font-medium opacity-90">今日花費</span>
        </div>
        <div className="font-display text-4xl font-bold tracking-tight mb-1">
          <span className="text-xl mr-1">{currency}</span>
          {totalAmount.toLocaleString()}
        </div>
        <div className="text-xs opacity-80">共 {expenses.length} 筆消費</div>
      </motion.div>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          📊 分類統計
        </h3>
        
        {Object.entries(expenseLabels).map(([cat, label]) => {
          const category = cat as ExpenseCategory;
          const amount = categoryTotals[category] || 0;
          if (amount === 0) return null;
          const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

          return (
            <motion.div key={category} layout className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{expenseIcons[category]}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="font-display font-bold text-sm">{amount.toLocaleString()}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-nature rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          );
        })}
        
        {expenses.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4 bg-card border-border border rounded-xl border-dashed">
            暫無分類資料
          </div>
        )}
      </div>

      {/* Recent List */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          📝 最近消費
        </h3>
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-3">
            <span className="text-4xl opacity-50 animate-bounce-in">🌱</span>
            <p className="text-sm">還沒有消費紀錄，<br/>快跟咻妮聊聊吧！</p>
          </div>
        ) : (
          [...expenses].reverse().slice(0, 10).map((exp, i) => (
            <motion.div 
              key={exp.id} 
              className="bg-card border border-border rounded-xl p-3 flex justify-between items-center shadow-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                  {expenseIcons[exp.category]}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{exp.description || expenseLabels[exp.category]}</span>
                  <span className="text-xs text-pikmin-sky flex items-center gap-1 mt-0.5">
                    {exp.location ? `📍 ${exp.location}` : `🌱 隨手記`}
                    {exp.paymentMethod && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">💳 {exp.paymentMethod}</span>}
                  </span>
                  {exp.limitWarning && (
                     <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 mt-1 w-fit max-w-[200px] truncate" title={exp.limitWarning}>
                       ⚠️ {exp.limitWarning}
                     </span>
                  )}
                </div>
              </div>
              <span className="font-display font-bold text-pikmin-earth bg-pikmin-cream/50 px-2 py-1 rounded-md text-sm">
                {exp.amount.toLocaleString()}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
