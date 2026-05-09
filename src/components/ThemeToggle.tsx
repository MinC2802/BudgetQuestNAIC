import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../lib/store';
import { motion } from 'motion/react';

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={() => setDarkMode(!darkMode)}
      className="p-3 rounded-2xl bg-dq-card border border-dq-border shadow-sm hover:shadow-md transition-all"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-dq-green" />
      )}
    </motion.button>
  );
}
