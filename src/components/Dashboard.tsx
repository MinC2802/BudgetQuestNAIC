import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Flame, TrendingUp, ChevronRight, Target, Trophy, Edit2, Check, Plus, Settings2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DashboardProps {
  onViewAll?: () => void;
}

export default function Dashboard({ onViewAll }: DashboardProps) {
  const { user, pockets, transactions, weeklyQuests, updateUser, categories, addCategory, updateCategoryBudget } = useStore();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(user.monthlyBudget);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalName, setTempGoalName] = useState(user.savingGoals[0] || 'My Goal');
  const [tempGoalAmount, setTempGoalAmount] = useState(user.savingTarget || 0);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const totalBalance = pockets.reduce((acc, p) => acc + p.currentBalance, 0);
  
  const { totalIncome, totalSpent } = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.reduce((acc, tx) => {
      const d = new Date(tx.date);
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        if (tx.amount > 0) {
          acc.totalIncome += tx.amount;
        } else {
          acc.totalSpent += Math.abs(tx.amount);
        }
      }
      return acc;
    }, { totalIncome: 0, totalSpent: 0 });
  }, [transactions]);

  const amountRemaining = totalIncome - totalSpent;
  const budgetRatio = user.monthlyBudget > 0 ? (totalSpent / user.monthlyBudget) * 100 : 0;
  const remainingInBudget = Math.max(0, user.monthlyBudget - totalSpent);
  
  const mainQuest = weeklyQuests[0] || { title: 'No active quest', progress: 0, target: 1, xp: 0 };
  const progressPercentage = Math.round((mainQuest.progress / mainQuest.target) * 100);

  const handleSaveBudget = () => {
    updateUser({ monthlyBudget: Number(tempBudget) });
    setIsEditingBudget(false);
  };

  const handleSaveGoal = () => {
    updateUser({ 
      savingGoals: [tempGoalName],
      savingTarget: Number(tempGoalAmount)
    });
    setIsEditingGoal(false);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      budget: 0,
      icon: '📁'
    });
    setNewCatName('');
    setIsAddingCat(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <section className="flex justify-between items-start">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-xs sm:text-sm font-medium opacity-60">
            {user.financialChallenge === 'Save more' ? 'Ready to grow your bags?' : 'Keep smashing those goals,'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{user.name} 👋</h2>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 sm:gap-2 bg-orange-100 dark:bg-orange-900/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-orange-200 dark:border-orange-800/50 shadow-sm"
        >
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 fill-orange-500" />
          <span className="font-bold text-xs sm:text-sm text-orange-600 dark:text-orange-400">{user.streak} Day Streak</span>
        </motion.div>
      </section>

      {/* Budget Card */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-dq-green dark:bg-dq-card border-4 border-black/10 dark:border-dq-green/30 shadow-md relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start text-white dark:text-dq-text">
              <div className="space-y-1 flex-1">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60 dark:text-dq-green">Spendable Budget</p>
                {isEditingBudget ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg opacity-60">RM</span>
                    <input 
                      type="number"
                      value={tempBudget}
                      onChange={(e) => setTempBudget(Number(e.target.value))}
                      className="bg-black/10 dark:bg-dq-bg border-2 border-white/20 dark:border-dq-border rounded-xl px-2 py-1 w-32 text-2xl font-black italic focus:border-white focus:outline-none transition-colors"
                      autoFocus
                    />
                    <button onClick={handleSaveBudget} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group/edit">
                    <h3 className="text-3xl sm:text-4xl font-black italic tracking-tighter">
                      <span className="text-lg opacity-60 mr-1">RM</span>
                      {user.monthlyBudget.toLocaleString()}
                    </h3>
                    <button 
                      onClick={() => setIsEditingBudget(true)}
                      className="opacity-0 group-hover/edit:opacity-100 p-2 hover:bg-white/10 dark:hover:bg-dq-green/10 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white/20 dark:bg-dq-green/20 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border border-white/10 dark:border-dq-green/20 italic text-white dark:text-dq-green">
                {Math.round(budgetRatio)}% Spent
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/10 dark:bg-dq-bg border border-white/10 dark:border-dq-border">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white dark:text-dq-green">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-black italic text-white dark:text-dq-text">RM {totalSpent.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 dark:bg-dq-bg border border-white/10 dark:border-dq-border">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white dark:text-dq-green">Remaining</p>
                  <p className="text-xl sm:text-2xl font-black italic text-white dark:text-dq-text">RM {amountRemaining.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 dark:bg-dq-bg border border-white/10 dark:border-dq-border col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white dark:text-dq-green">This Month's Income</p>
                    <p className="text-xl sm:text-2xl font-black italic text-white dark:text-dq-text">RM {totalIncome.toLocaleString()}</p>
                  </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white dark:text-dq-green">Net Flow</p>
                  <p className={cn(
                    "text-xl sm:text-2xl font-black italic",
                    amountRemaining >= 0 ? "text-white dark:text-dq-green" : "text-red-300"
                  )}>
                    {amountRemaining >= 0 ? '+' : ''}RM {amountRemaining.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full bg-black/10 dark:bg-dq-bg rounded-full overflow-hidden border-2 border-black/5 dark:border-dq-border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, budgetRatio)}%` }}
                  className={cn(
                    "h-full rounded-full transition-colors",
                    budgetRatio > 100 ? "bg-red-400" : (budgetRatio > 80 ? "bg-orange-400" : "bg-white dark:bg-dq-green")
                  )}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-black text-lg sm:text-xl tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 opacity-40"/> 
            Recent Transactions
          </h4>
          <button 
            onClick={onViewAll}
            className="text-[10px] sm:text-xs font-bold text-dq-green flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-2.5 sm:space-y-3">
          {transactions.slice(0, 4).map((tx, idx) => (
            <motion.div 
              key={tx.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex justify-between items-center p-4 sm:p-5 bg-dq-card rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:border-dq-green/20 dark:hover:border-dq-green/30 transition-colors group"
            >
              <div className="flex gap-3 sm:gap-4 items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-dq-bg flex items-center justify-center text-lg sm:text-xl group-hover:scale-110 transition-transform">
                  {tx.amount > 0 ? '💰' : (tx.category.toLowerCase() === 'food' ? '🍕' : tx.category.toLowerCase() === 'transport' ? '🚗' : '🛍️')}
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base tracking-tight">{tx.storeName}</p>
                  <p className="text-[10px] sm:text-xs font-medium opacity-40">{tx.category} • {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-mono font-black text-base sm:text-lg",
                  tx.amount < 0 ? "text-red-500" : "text-dq-green"
                )}>
                  {tx.amount < 0 ? '-' : '+'}RM{Math.abs(tx.amount).toFixed(2)}
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-30">{tx.source}</p>
              </div>
            </motion.div>
          ))}
          
          {transactions.length === 0 && (
            <div className="py-10 text-center space-y-2 opacity-40">
              <p className="text-sm font-medium">No transactions yet.</p>
              <p className="text-xs">Start your first quest by adding a receipt!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface CategoryCardProps {
  category: any;
  onUpdateLimit: (l: number) => void;
  key?: string;
}

function CategoryCard({ category, onUpdateLimit }: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(category.budget);

  return (
    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-dq-card border border-dq-border shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl">{category.icon}</span>
          <span className="font-bold text-xs uppercase tracking-tight">{category.name}</span>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="p-1 hover:bg-dq-bg rounded-lg transition-colors"
        >
          {isEditing ? <Check className="w-3.5 h-3.5 text-dq-green" onClick={() => { onUpdateLimit(Number(val)); setIsEditing(false); }} /> : <Edit2 className="w-3.5 h-3.5 opacity-30" />}
        </button>
      </div>
      <div className="space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Limit</p>
        {isEditing ? (
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-40 italic">RM</span>
                <input 
                  type="number"
                  value={val}
                  onChange={(e) => setVal(Number(e.target.value))}
                  className="bg-dq-bg border border-dq-border focus:ring-2 ring-dq-green outline-none rounded-lg px-2 py-0.5 w-full text-sm font-black transition-colors"
                />
              </div>
        ) : (
          <p className="text-base font-black italic tracking-tighter">RM {category.budget.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

