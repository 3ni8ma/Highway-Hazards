import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RotateCcw, Home, Trophy, Star, Coins } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const gameFont = { fontFamily: "'Orbitron', sans-serif" };

export default function GameOverScreen({ 
  score, 
  coins, 
  distance,
  survivalTime,
  highScore,
  onRestart, 
  onHome 
}) {
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isNewHighScore = score > highScore;

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    
    setIsSaving(true);
    try {
      await base44.entities.HighScore.create({
        player_name: playerName.trim(),
        score: score,
        distance: distance,
        coins_collected: coins,
        survival_time: survivalTime
      });
      setSaved(true);
    } catch (error) {
      console.error('Failed to save score:', error);
    }
    setIsSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-red-500/30 max-w-md w-full"
        style={gameFont}
      >
        {/* Game Over Title */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-4xl font-black text-red-500 tracking-wider mb-2">
            GAME OVER
          </h2>
          {isNewHighScore && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex items-center justify-center gap-2 text-yellow-400"
            >
              <Star className="w-5 h-5 fill-yellow-400" />
              <span className="text-lg font-bold">NEW HIGH SCORE!</span>
              <Star className="w-5 h-5 fill-yellow-400" />
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400 tabular-nums">
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Score</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400 tabular-nums flex items-center justify-center gap-1">
              <Coins className="w-6 h-6" />
              {coins}
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Coins</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-fuchsia-400 tabular-nums">
              {distance.toLocaleString()}m
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Distance</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400 tabular-nums">
              {Math.floor(survivalTime)}s
            </div>
            <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Time</div>
          </div>
        </div>

        {/* Save Score */}
        {!saved ? (
          <div className="mb-6">
            <label className="text-sm text-white/60 mb-2 block">Save your score</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Button
                onClick={handleSaveScore}
                disabled={!playerName.trim() || isSaving}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6"
              >
                {isSaving ? '...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-500/20 rounded-xl p-3 text-center text-green-400 font-medium"
          >
            Score saved successfully!
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onRestart}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl shadow-lg shadow-cyan-500/25"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>

          <Button
            onClick={onHome}
            variant="outline"
            className="w-full h-12 text-lg font-semibold border-2 border-white/20 text-white/70 hover:bg-white/10 rounded-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Main Menu
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}