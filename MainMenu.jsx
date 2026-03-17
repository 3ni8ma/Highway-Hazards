import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Trophy, Car, Info, ChevronLeft, ChevronRight } from 'lucide-react';

// Import gaming font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const CAR_COLORS = [
  { name: 'Neon Cyan', color: '#00ffff', class: 'from-cyan-400 to-cyan-600' },
  { name: 'Hot Pink', color: '#ff00ff', class: 'from-fuchsia-400 to-fuchsia-600' },
  { name: 'Electric Orange', color: '#ff8800', class: 'from-orange-400 to-orange-600' },
  { name: 'Lime Green', color: '#00ff88', class: 'from-green-400 to-green-600' },
  { name: 'Royal Purple', color: '#8800ff', class: 'from-purple-400 to-purple-600' },
  { name: 'Solar Yellow', color: '#ffff00', class: 'from-yellow-400 to-yellow-600' },
];

export default function MainMenu({ onStartGame, selectedCarColor, onCarColorChange }) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [carIndex, setCarIndex] = useState(0);

  const { data: highScores = [] } = useQuery({
    queryKey: ['highScores'],
    queryFn: () => base44.entities.HighScore.list('-score', 10),
  });

  const handleCarChange = (direction) => {
    const newIndex = (carIndex + direction + CAR_COLORS.length) % CAR_COLORS.length;
    setCarIndex(newIndex);
    onCarColorChange(CAR_COLORS[newIndex].color);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 bg-gradient-to-b from-cyan-500/30 to-transparent"
            style={{
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 200 + 100}px`,
            }}
            initial={{ y: -200 }}
            animate={{ y: '100vh' }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        {/* Title */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-5xl md:text-7xl font-black mb-2"
        >
          <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
            HIGHWAY
          </span>
        </motion.h1>
        <motion.h2
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-white mb-8"
        >
          HAVOC
        </motion.h2>

        {/* Car Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCarChange(-1)}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <div className="relative">
              <div 
                className={`w-32 h-20 rounded-2xl bg-gradient-to-br ${CAR_COLORS[carIndex].class} shadow-2xl`}
                style={{ boxShadow: `0 0 40px ${CAR_COLORS[carIndex].color}40` }}
              >
                <div className="absolute inset-2 bg-black/30 rounded-xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-black/50 rounded-full blur-md transform translate-y-4" />
              </div>
              <div className="text-sm text-white/60 mt-4 font-medium">
                {CAR_COLORS[carIndex].name}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCarChange(1)}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </motion.div>

        {/* Buttons */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={onStartGame}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 hover:from-cyan-400 hover:via-blue-400 hover:to-fuchsia-400 text-white rounded-2xl shadow-2xl shadow-cyan-500/30 transform hover:scale-105 transition-transform"
            >
              <Play className="w-6 h-6 mr-2" />
              START GAME
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => setShowLeaderboard(true)}
              variant="outline"
              className="w-full h-14 text-lg font-semibold border-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 rounded-xl"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Leaderboard
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => setShowControls(true)}
              variant="ghost"
              className="w-full h-12 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <Info className="w-5 h-5 mr-2" />
              How to Play
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLeaderboard(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-md w-full border border-yellow-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Top Scores
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {highScores.length > 0 ? highScores.map((score, index) => (
                <div
                  key={score.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    index === 0 ? 'bg-yellow-500/20' :
                    index === 1 ? 'bg-gray-400/20' :
                    index === 2 ? 'bg-orange-500/20' :
                    'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold w-6 ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                      'text-white/50'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-white font-medium">{score.player_name}</span>
                  </div>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {score.score?.toLocaleString()}
                  </span>
                </div>
              )) : (
                <div className="text-center text-white/50 py-8">
                  No scores yet. Be the first!
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white"
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Controls Modal */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowControls(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-md w-full border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">How to Play</h3>
            <div className="space-y-4 text-white/80">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  ⬅️➡️
                </div>
                <div>
                  <div className="font-semibold text-white">Controls</div>
                  <div className="text-sm">Arrow keys or A/D to switch lanes. On mobile, tap left or right side of screen.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                  ⚠️
                </div>
                <div>
                  <div className="font-semibold text-white">Avoid Hazards</div>
                  <div className="text-sm">Dodge cars, roadblocks, cones, and debris. Oil spills will make you slip!</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                  ⭐
                </div>
                <div>
                  <div className="font-semibold text-white">Collect Power-ups</div>
                  <div className="text-sm">Grab coins for points. Shield, speed boost, slow-mo, and repair kits will help you survive!</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                  🏆
                </div>
                <div>
                  <div className="font-semibold text-white">Survive & Score</div>
                  <div className="text-sm">Travel as far as you can! Speed increases over time. Beat the high score!</div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowControls(false)}
              className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white"
            >
              Got it!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}