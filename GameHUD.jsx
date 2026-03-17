import React from 'react';
import { Heart, Zap, Shield, Timer, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const gameFont = { fontFamily: "'Orbitron', sans-serif" };

export default function GameHUD({ 
  score, 
  health, 
  maxHealth, 
  coins, 
  activePowerUps,
  speed 
}) {
  return (
    <div className="absolute inset-x-0 top-0 p-4 pointer-events-none" style={gameFont}>
      <div className="flex justify-between items-start max-w-4xl mx-auto">
        {/* Left: Health & Score */}
        <div className="space-y-3">
          {/* Health */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
            {[...Array(maxHealth)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 1 }}
                animate={{ 
                  scale: i < health ? 1 : 0.8,
                  opacity: i < health ? 1 : 0.3
                }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Heart 
                  className={`w-6 h-6 ${i < health ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} 
                />
              </motion.div>
            ))}
          </div>

          {/* Score */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-xs text-cyan-400 font-medium tracking-wider">DISTANCE</div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {score.toLocaleString()}m
            </div>
          </div>
        </div>

        {/* Right: Coins & Power-ups */}
        <div className="space-y-3">
          {/* Coins */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-bold text-yellow-400 tabular-nums">{coins}</span>
          </div>

          {/* Active Power-ups */}
          <AnimatePresence>
            {activePowerUps.shield && (
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className="flex items-center gap-2 bg-cyan-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-400/50"
              >
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">SHIELD</span>
              </motion.div>
            )}
            {activePowerUps.speed && (
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className="flex items-center gap-2 bg-fuchsia-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-fuchsia-400/50"
              >
                <Zap className="w-5 h-5 text-fuchsia-400" />
                <span className="text-sm font-medium text-fuchsia-400">SPEED BOOST</span>
              </motion.div>
            )}
            {activePowerUps.slowmo && (
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className="flex items-center gap-2 bg-green-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/50"
              >
                <Timer className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">SLOW MOTION</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Controls Hint */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center md:hidden">
        <div className="bg-black/40 backdrop-blur-sm rounded-full px-6 py-2 text-white/60 text-sm">
          Tap left or right to switch lanes
        </div>
      </div>
    </div>
  );
}