import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../lib/store';
import { Check, ChevronRight, TrendingUp, Target, Save, Zap, Wallet, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;

const CATEGORIES = [
  { id: 'Food', icon: '🍕' },
  { id: 'Shopping', icon: '🛍️' },
  { id: 'Transport', icon: '🚗' },
  { id: 'Entertainment', icon: '🎮' },
  { id: 'Bills', icon: '📄' },
  { id: 'Other', icon: '📦' },
];

const CHALLENGES = [
  { id: 'Save more', desc: 'Focus on growing your emergency fund', icon: Save },
  { id: 'Spend less', desc: 'Cut down on impulse purchases', icon: Zap },
  { id: 'Track expenses', desc: 'Log every single RM spent', icon: Target },
  { id: 'Build better habits', desc: 'Understand your spending patterns', icon: TrendingUp },
];

export default function Onboarding() {
  const { completeOnboarding, user } = useStore();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    monthlyBudget: 3000,
    savingGoals: [] as string[],
    controlCategories: [] as string[],
    savingTarget: 500,
    financialChallenge: 'Save more',
  });
  const [customGoal, setCustomGoal] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const nextStep = () => {
    if (step === 2) {
      const hasPreset = formData.savingGoals.length > 0;
      const hasCustom = isOtherSelected && customGoal.trim().length > 0;
      if (!hasPreset && !hasCustom) {
        // Prevent proceeding if no goal is selected
        return;
      }
    }
    setStep((s) => (s + 1) as Step);
  };
  const prevStep = () => setStep((s) => (s - 1) as Step);

  const handleComplete = () => {
    let finalGoals = [...formData.savingGoals];
    if (isOtherSelected && customGoal.trim()) {
      finalGoals.push(customGoal.trim());
    }

    completeOnboarding({
      monthlyBudget: formData.monthlyBudget,
      savingTarget: formData.savingTarget,
      controlCategories: formData.controlCategories,
      financialChallenge: formData.financialChallenge,
      savingGoals: finalGoals,
    });
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      controlCategories: prev.controlCategories.includes(cat)
        ? prev.controlCategories.filter(c => c !== cat)
        : [...prev.controlCategories, cat]
    }));
  };

  return (
    <div className="min-h-screen bg-dq-bg flex flex-col items-center justify-center p-6 sm:p-10">
      <div className="max-w-md w-full space-y-8">
        {/* Progress bar */}
        <div className="w-full h-4 bg-dq-border rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            className="h-full bg-dq-green"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="space-y-6"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-dq-text italic uppercase">Step 1: The Budget</h2>
                  <p className="text-sm opacity-60">What is your total monthly budget target? 💰</p>
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-dq-green/40">RM</span>
                  <input 
                    type="number"
                    value={formData.monthlyBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyBudget: Number(e.target.value) })}
                    className="w-full p-8 pl-20 text-4xl font-black bg-dq-card border-4 border-dq-border rounded-[2.5rem] focus:border-dq-green outline-none text-dq-text snappy-transition"
                  />
                </div>
                <p className="text-center text-xs font-bold opacity-40 uppercase tracking-widest">You can change this later in settings</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-dq-text italic uppercase">Step 2: Goals</h2>
                  <p className="text-sm opacity-60">What are your main saving goals? 🏠✈️</p>
                </div>
                <div className="grid gap-3">
                  {['Emergency Fund', 'Vacation', 'New Phone', 'New Car'].map(goal => (
                    <button
                      key={goal}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        savingGoals: prev.savingGoals.includes(goal)
                          ? prev.savingGoals.filter(g => g !== goal)
                          : [...prev.savingGoals, goal]
                      }))}
                      className={cn(
                        "p-5 rounded-2xl border-4 text-left font-bold transition-all relative group overflow-hidden",
                        formData.savingGoals.includes(goal) 
                          ? "border-dq-green bg-dq-green/10 text-dq-green" 
                          : "border-dq-border bg-dq-card hover:border-dq-green/30"
                      )}
                    >
                      {goal}
                      {formData.savingGoals.includes(goal) && <Check className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6" />}
                    </button>
                  ))}
                  
                  {/* Custom Goal Option */}
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsOtherSelected(!isOtherSelected)}
                      className={cn(
                        "w-full p-5 rounded-2xl border-4 text-left font-bold transition-all relative group overflow-hidden",
                        isOtherSelected 
                          ? "border-dq-green bg-dq-green/10 text-dq-green" 
                          : "border-dq-border bg-dq-card hover:border-dq-green/30"
                      )}
                    >
                      Other (Custom Goal)
                      {isOtherSelected && <Check className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6" />}
                    </button>
                    
                    <AnimatePresence>
                      {isOtherSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input 
                            type="text"
                            placeholder="Type your custom goal..."
                            value={customGoal}
                            onChange={(e) => setCustomGoal(e.target.value)}
                            className="w-full p-5 rounded-2xl bg-dq-bg border-4 border-dq-border focus:border-dq-green outline-none text-dq-text font-bold transition-all"
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-dq-text italic uppercase">Step 3: Control</h2>
                  <p className="text-sm opacity-60">Categories you want to control most? 🛒</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "p-6 rounded-3xl border-4 text-center transition-all flex flex-col items-center gap-3",
                        formData.controlCategories.includes(cat.id) 
                          ? "border-dq-green bg-dq-green/10" 
                          : "border-dq-border bg-dq-card"
                      )}
                    >
                      <span className="text-4xl">{cat.icon}</span>
                      <span className="font-bold text-xs uppercase tracking-widest">{cat.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-dq-text italic uppercase">Step 4: Target</h2>
                  <p className="text-sm opacity-60">Monthly saving target? 📈</p>
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-dq-green/40">RM</span>
                  <input 
                    type="number"
                    value={formData.savingTarget}
                    onChange={(e) => setFormData({ ...formData, savingTarget: Number(e.target.value) })}
                    className="w-full p-8 pl-20 text-4xl font-black bg-dq-card border-4 border-dq-border rounded-[2.5rem] focus:border-dq-green outline-none text-dq-text snappy-transition"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-dq-text italic uppercase">Step 5: Challenge</h2>
                  <p className="text-sm opacity-60">Choose your starting financial challenge: 🔥</p>
                </div>
                <div className="grid gap-4">
                  {CHALLENGES.map(challenge => {
                    const Icon = challenge.icon;
                    return (
                      <button
                        key={challenge.id}
                        onClick={() => setFormData({ ...formData, financialChallenge: challenge.id })}
                        className={cn(
                          "p-4 rounded-3xl border-4 text-left transition-all flex items-center gap-4 group",
                          formData.financialChallenge === challenge.id 
                            ? "border-dq-green bg-dq-green/10" 
                            : "border-dq-border bg-dq-card"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                          formData.financialChallenge === challenge.id ? "bg-dq-green text-white" : "bg-dq-bg text-dq-green opacity-40"
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black uppercase text-sm tracking-tight">{challenge.id}</p>
                          <p className="text-xs opacity-50 font-medium">{challenge.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-4 pt-10">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-4 bg-dq-card border-4 border-dq-border text-dq-text font-black rounded-2xl hover:bg-dq-bg transition-all uppercase tracking-widest text-sm"
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex-[2] py-4 bg-dq-green text-white font-black rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-[2] py-4 bg-dq-green text-white font-black rounded-2xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
            >
              Start Adventure!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
