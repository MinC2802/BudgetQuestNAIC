import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  const handleSearch = () => {
    if (!email) return;
    setIsSearching(true);
    // Mock search
    setTimeout(() => {
      setFoundUser({
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        points: 0,
        streak: 0
      });
      setIsSearching(false);
    }, 1000);
  };

  const handleAdd = () => {
    // In a real app, this would call an API
    alert(`Friend request sent to ${foundUser.name}!`);
    onClose();
    setEmail('');
    setFoundUser(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }} 
            animate={{ scale: 1, y: 0, opacity: 1 }} 
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-dq-card w-full max-w-md rounded-3xl overflow-hidden relative z-10 p-6 shadow-2xl border border-dq-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black tracking-tight text-dq-text">Add Friend</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-dq-bg transition-colors">
                <X className="w-5 h-5 opacity-50 font-bold" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 pr-12 rounded-2xl bg-dq-bg border border-dq-border focus:ring-2 ring-dq-green outline-none transition-all text-dq-text"
                  placeholder="Enter friend's email"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-2 top-2 p-2 bg-dq-green text-white rounded-xl shadow-md"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {isSearching && (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 border-4 border-dq-green border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-sm font-bold opacity-50">Searching for adventurer...</p>
                </div>
              )}

              {foundUser && !isSearching && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-dq-bg border border-dq-border flex flex-col items-center gap-4"
                >
                  <img src={foundUser.avatar} className="w-20 h-20 rounded-2xl shadow-lg" alt="" />
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-dq-text">{foundUser.name}</h4>
                    <p className="text-xs opacity-50">New Adventurer</p>
                  </div>
                  <button 
                    onClick={handleAdd}
                    className="w-full py-3 bg-dq-green text-white rounded-xl font-bold shadow-lg shadow-dq-green/20 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Send Friend Request
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
