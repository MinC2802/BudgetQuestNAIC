import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../lib/store';
import { AlertCircle, X, ArrowDownRight, Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface SpendingAlertProps {
  onReview: () => void;
}

export default function SpendingAlert({ onReview }: SpendingAlertProps) {
  const { transactions, user } = useStore();
  const [activeAlert, setActiveAlert] = useState<'80' | '100' | '110' | null>(null);
  const [hasDismissed, setHasDismissed] = useState(false);

  // Use a ref or simple state to avoid playing sound multiple times if not needed, 
  // but for a fun app, a playful alert sound is good.
  const playAlertSound = async () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
      audio.volume = 0.4;
      await audio.play();
    } catch (e) {
      // Browsers block autoplay until interaction. This is fine.
    }
  };

  const currentExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && tx.amount < 0;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  useEffect(() => {
    if (!user.monthlyBudget || user.monthlyBudget <= 0 || hasDismissed) return;

    const ratio = currentExpenses / user.monthlyBudget;
    
    if (ratio >= 1.1) {
      if (activeAlert !== '110') {
        setActiveAlert('110');
        playAlertSound();
      }
    } else if (ratio >= 1.0) {
      if (activeAlert !== '100') {
        setActiveAlert('100');
        playAlertSound();
      }
    } else if (ratio >= 0.8) {
      if (activeAlert !== '80') {
        setActiveAlert('80');
        playAlertSound();
      }
    } else {
      setActiveAlert(null);
    }
  }, [currentExpenses, user.monthlyBudget, hasDismissed, activeAlert]);

  const alertContent = {
    '80': {
      title: "Whoa 😳",
      message: "You’re getting close to your budget limit!",
      color: "bg-orange-500",
      icon: "⚠️",
      tips: ["Skip that extra coffee today", "Maybe cook at home tonight?", "Check your 'Want' vs 'Need' list"]
    },
    '100': {
      title: "U SPENT TOO MUCHHHH 🚨",
      message: "You have officially hit your budget limit!",
      color: "bg-[#FF4B4B]",
      icon: "🚨",
      tips: ["Lock those credit cards! 🔒", "Switch to 'Essential Only' mode", "Challenge yourself to RM0 weekend"]
    },
    '110': {
      title: "Budget destroyed 💸",
      message: "Slow down! You are over budget!",
      color: "bg-red-800",
      icon: "🔥",
      tips: ["Emergency spending audit required", "Redefine your priorities for the month", "Forgive yourself, but stop now!"]
    }
  };

  if (!activeAlert) return null;

  const content = alertContent[activeAlert];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setActiveAlert(null);
            setHasDismissed(true);
          }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Popup Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            x: [0, -10, 10, -10, 10, 0] // Shake animation
          }}
          exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
          transition={{ 
            type: 'spring', 
            damping: 20, 
            stiffness: 300,
            x: { duration: 0.4, delay: 0.1 }
          }}
          className={cn(
            "relative w-full max-w-sm rounded-[2.5rem] border-b-8 border-black/20 p-8 text-white text-center space-y-6 shadow-2xl",
            content.color
          )}
        >
          <div className="text-6xl mb-2">{content.icon}</div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter leading-tight uppercase">
              {content.title}
            </h2>
            <p className="text-lg font-bold opacity-90 leading-tight">
              {content.message}
            </p>
          </div>

          <div className="bg-white/10 rounded-3xl p-5 space-y-3 text-left">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest opacity-60">
              <Lightbulb className="w-4 h-4" />
              Ways to save now:
            </div>
            <ul className="space-y-2">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-bold opacity-90">
                  <span className="text-xs mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                onReview();
                setActiveAlert(null);
                setHasDismissed(true);
              }}
              className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              Review Spending <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setActiveAlert(null);
                setHasDismissed(true);
              }}
              className="w-full py-3 bg-black/20 text-white/80 font-bold rounded-xl hover:bg-black/30 transition-all uppercase tracking-widest text-xs"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
