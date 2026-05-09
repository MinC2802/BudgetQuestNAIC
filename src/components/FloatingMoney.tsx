import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface FloatingIconProps {
  delay: number;
  duration: number;
  left: string;
  size: number;
  icon: string;
  depth: number;
}

const FloatingIcon = ({ delay, duration, left, size, icon, depth }: FloatingIconProps) => {
  return (
    <motion.div
      initial={{ y: "110vh", x: 0, opacity: 0, rotate: 0 }}
      animate={{ 
        y: "-10vh",
        x: [0, 20 * depth, -20 * depth, 0],
        opacity: [0, 0.12, 0.12, 0],
        rotate: [0, 15 * depth, -15 * depth, 360]
      }}
      transition={{
        duration: duration / depth,
        repeat: Infinity,
        delay,
        ease: "linear"
      }}
      className="fixed pointer-events-none text-dq-green font-black select-none z-0"
      style={{ left, fontSize: size }}
    >
      {icon}
    </motion.div>
  );
};

export default function FloatingMoney() {
  const icons = useMemo(() => {
    const symbols = ['$', '🪙', '📈', '✨', '$', '✨'];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 15,
      left: `${Math.random() * 100}%`,
      size: 14 + Math.random() * 24,
      icon: symbols[i % symbols.length],
      depth: 0.5 + Math.random() * 1.5 // Parallax factor
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {icons.map((item) => (
        <FloatingIcon key={item.id} {...item} />
      ))}
    </div>
  );
}
