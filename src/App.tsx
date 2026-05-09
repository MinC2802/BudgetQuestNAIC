import React, { useState, useEffect } from 'react';
import { useStore } from './lib/store';
import { Home, Wallet, Trophy, LayoutGrid, User as UserIcon, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Components
import Dashboard from './components/Dashboard';
import Pockets from './components/Pockets';
import Leaderboard from './components/Leaderboard';
import Quests from './components/Quests';
import Category from './components/Category';
import Transactions from './components/Transactions';
import Profile from './components/Profile';
import ThemeToggle from './components/ThemeToggle';
import AddTransactionModal from './components/AddTransactionModal';
import Login from './components/Login';
import ChatAssistant from './components/ChatAssistant';
import Onboarding from './components/Onboarding';
import FloatingMoney from './components/FloatingMoney';
import SpendingAlert from './components/SpendingAlert';

type View = 'dashboard' | 'pockets' | 'leaderboard' | 'quests' | 'category' | 'profile' | 'transactions';

export default function App() {
  const { darkMode, syncData, isSyncing, user: storeUser } = useStore();
  const [activeView, setActiveView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('budgetquest-view') as View) || 'dashboard';
    }
    return 'dashboard';
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('budgetquest-view', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubSync = syncData(user.uid);
      return () => unsubSync();
    }
  }, [user, syncData]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dq-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dq-green" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Show loading while syncing initial user data
  if (isSyncing && !storeUser.id) {
    return (
      <div className="min-h-screen bg-dq-bg flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-dq-green" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 animate-pulse">Syncing your progress...</p>
      </div>
    );
  }

  // Show loading while syncing initial user data
  if (isSyncing && !storeUser.id) {
    return (
      <div className="min-h-screen bg-dq-bg flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-dq-green" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 animate-pulse">Syncing your progress...</p>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!storeUser.isOnboarded) {
    return (
      <>
        <FloatingMoney />
        <Onboarding />
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard onViewAll={() => setActiveView('transactions')} />;
      case 'pockets': return <Pockets />;
      case 'leaderboard': return <Leaderboard />;
      case 'quests': return <Quests />;
      case 'category': return <Category />;
      case 'profile': return <Profile />;
      case 'transactions': return <Transactions onBack={() => setActiveView('dashboard')} />;
      default: return <Dashboard onViewAll={() => setActiveView('transactions')} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'pockets', icon: Wallet, label: 'Accounts' },
    { id: 'category', icon: LayoutGrid, label: 'Categories' },
    { id: 'quests', icon: Trophy, label: 'Quests' },
    { id: 'leaderboard', icon: Users, label: 'Social' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className={cn(
      "min-h-screen bg-dq-bg text-dq-text snappy-transition relative overflow-x-hidden",
      isChatOpen && "lg:mr-[400px]"
    )}>
      {/* Dynamic Background */}
      <FloatingMoney />
      
      <div className="relative z-10">
        {/* Header */}
        <header className={cn(
          "fixed top-0 w-full z-50 bg-dq-bg/80 backdrop-blur-xl border-b border-dq-border px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center snappy-transition",
          isChatOpen && "lg:w-[calc(100%-400px)]"
        )}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-dq-green flex items-center justify-center text-white shadow-lg shadow-dq-green/20">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="font-black text-xl sm:text-2xl tracking-tighter italic">BudgetQuest</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dq-green/5 dark:bg-dq-green/20 text-[10px] font-bold text-dq-green dark:text-dq-green"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing</span>
              </motion.div>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-20 sm:pt-28 pb-32 px-4 sm:px-6 max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className={cn(
          "fixed bottom-0 w-full z-50 bg-dq-card/90 backdrop-blur-2xl border-t border-dq-border px-4 sm:px-6 pt-2 sm:pt-3 pb-6 sm:pb-8 snappy-transition",
          isChatOpen && "lg:w-[calc(100%-400px)]"
        )}>
          <div className="max-w-lg mx-auto flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as View)}
                  className="flex flex-col items-center gap-1 group relative flex-1"
                >
                  <div className={cn(
                    "p-2 rounded-xl sm:rounded-2xl transition-all duration-200",
                    isActive 
                      ? "bg-dq-green text-white shadow-lg shadow-dq-green/30 scale-105 sm:scale-110" 
                      : "text-dq-text-secondary hover:bg-dq-bg"
                  )}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-opacity duration-200",
                    isActive ? "opacity-100 text-dq-green" : "opacity-0"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-dq-green rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Modals */}
        <AddTransactionModal />
        <ChatAssistant isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
        <SpendingAlert onReview={() => setActiveView('dashboard')} />
      </div>
    </div>
  );
}

