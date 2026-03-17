import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

const gameFont = { fontFamily: "'Orbitron', sans-serif" };

export default function PauseMenu({ 
  onResume, 
  onRestart, 
  onHome,
  isMuted,
  onToggleMute
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-white/10 max-w-sm w-full mx-4"
        style={gameFont}
      >
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          PAUSED
        </h2>

        <div className="space-y-4">
          <Button
            onClick={onResume}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl shadow-lg shadow-cyan-500/25"
          >
            <Play className="w-5 h-5 mr-2" />
            Resume
          </Button>

          <Button
            onClick={onRestart}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-xl"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Restart
          </Button>

          <Button
            onClick={onHome}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-white/20 text-white/70 hover:bg-white/10 rounded-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Main Menu
          </Button>

          <div className="pt-4 border-t border-white/10">
            <Button
              onClick={onToggleMute}
              variant="ghost"
              className="w-full h-12 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-5 h-5 mr-2" />
                  Sound Off
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Sound On
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}