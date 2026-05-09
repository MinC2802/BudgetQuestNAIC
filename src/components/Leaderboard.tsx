import React, { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { UserPlus, Trophy, Flame, Crown, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import AddFriendModal from './AddFriendModal';

export default function Leaderboard() {
  const { user, leaderboardUsers, isLeaderboardLoading, fetchLeaderboard } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  if (isLeaderboardLoading && leaderboardUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-dq-green" />
        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Loading Legends...</p>
      </div>
    );
  }

  const top3 = leaderboardUsers.slice(0, 3);
  const rest = leaderboardUsers.slice(3);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tight text-dq-text">Leaderboard</h2>
        <div className="flex gap-2">
          {isLeaderboardLoading && <Loader2 className="w-5 h-5 animate-spin text-dq-green/30" />}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-3 bg-dq-green text-white rounded-2xl shadow-lg shadow-dq-green/20 hover:scale-105 transition-transform"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AddFriendModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex justify-center items-end gap-1.5 sm:gap-2 pt-10 pb-4">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2 sm:gap-3"
            >
              <div className="relative">
                <img src={top3[1].avatar} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-4 border-slate-300 dark:border-slate-700 shadow-lg" alt="" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-200">2</div>
              </div>
              <div className="text-center">
                <p className="font-bold text-xs sm:text-sm tracking-tight truncate w-16 sm:w-auto overflow-hidden">{top3[1].name}</p>
                <p className="text-[10px] sm:text-xs font-black text-dq-green">{top3[1].points} XP</p>
              </div>
              <div className="w-16 sm:w-20 h-20 sm:h-24 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-t-xl sm:rounded-t-2xl border-x border-t border-slate-200 dark:border-slate-700 shadow-sm transition-all" />
            </motion.div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2 sm:gap-3"
            >
              <div className="relative">
                <Crown className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 fill-yellow-500 animate-bounce" />
                <img src={top3[0].avatar} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border-4 border-yellow-500 shadow-xl shadow-yellow-500/20" alt="" />
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white">1</div>
              </div>
              <div className="text-center">
                <p className="font-black text-sm sm:text-base tracking-tight truncate w-20 sm:w-auto overflow-hidden">{top3[0].name}</p>
                <p className="text-xs sm:text-sm font-black text-dq-green">{top3[0].points} XP</p>
              </div>
              <div className="w-20 sm:w-24 h-28 sm:h-32 bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/40 rounded-t-2xl sm:rounded-t-3xl border-x border-t border-yellow-200 dark:border-yellow-800 shadow-md transition-all" />
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-2 sm:gap-3"
            >
              <div className="relative">
                <img src={top3[2].avatar} className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-4 border-orange-300 dark:border-orange-900/50 shadow-lg" alt="" />
                <div className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-orange-300 dark:bg-orange-800 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black text-orange-900 dark:text-orange-100">3</div>
              </div>
              <div className="text-center">
                <p className="font-bold text-[10px] sm:text-xs tracking-tight truncate w-14 sm:w-auto overflow-hidden">{top3[2].name}</p>
                <p className="text-[9px] sm:text-[10px] font-black text-dq-green">{top3[2].points} XP</p>
              </div>
              <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-900/30 rounded-t-lg sm:rounded-t-xl border-x border-t border-orange-200 dark:border-orange-800 shadow-sm transition-all" />
            </motion.div>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {rest.map((player, idx) => {
          const isCurrentUser = player.id === user.id;
          return (
            <motion.div 
              key={player.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "flex justify-between items-center p-4 rounded-3xl border transition-all",
                isCurrentUser 
                  ? "bg-dq-green/10 border-dq-green/30 shadow-md scale-[1.02]" 
                  : "bg-dq-card border-dq-border shadow-sm"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-center font-black opacity-30 text-sm">{idx + 4}</span>
                <img src={player.avatar} className="w-12 h-12 rounded-2xl border-2 border-dq-border" alt="" />
                <div>
                  <p className="font-bold text-base tracking-tight flex items-center gap-2">
                    {player.name}
                    {isCurrentUser && <span className="text-[10px] bg-dq-green text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                  </p>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-bold">{player.streak}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-black text-lg tracking-tight">{player.points}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-30">Points</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-dq-green/10 flex items-center justify-center text-dq-green">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
        {leaderboardUsers.length === 0 && (
          <div className="text-center py-10 opacity-30 font-black uppercase tracking-widest text-sm">
            No adventurers yet...
          </div>
        )}
      </div>
    </div>
  );
}
