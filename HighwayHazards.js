import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import GameHUD from '@/components/game/GameHUD';
import PauseMenu from '@/components/game/PauseMenu';
import GameOverScreen from '@/components/game/GameOverScreen';

const MAX_HEALTH = 3;
const POWER_UP_DURATION = 8000;

export default function HighwayHazards() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, gameover
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [health, setHealth] = useState(MAX_HEALTH);
  const [selectedCarColor, setSelectedCarColor] = useState('#00ffff');
  const [isMuted, setIsMuted] = useState(false);
  const [activePowerUps, setActivePowerUps] = useState({
    shield: false,
    speed: false,
    slowmo: false
  });
  const [survivalTime, setSurvivalTime] = useState(0);
  const survivalTimerRef = useRef(null);
  const powerUpTimersRef = useRef({});

  const { data: highScores = [] } = useQuery({
    queryKey: ['highScores'],
    queryFn: () => base44.entities.HighScore.list('-score', 1),
  });

  const highScore = highScores[0]?.score || 0;

  // Survival timer
  useEffect(() => {
    if (gameState === 'playing') {
      survivalTimerRef.current = setInterval(() => {
        setSurvivalTime(prev => prev + 0.1);
      }, 100);
    } else {
      if (survivalTimerRef.current) {
        clearInterval(survivalTimerRef.current);
      }
    }
    return () => {
      if (survivalTimerRef.current) {
        clearInterval(survivalTimerRef.current);
      }
    };
  }, [gameState]);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setCoins(0);
    setHealth(MAX_HEALTH);
    setSurvivalTime(0);
    setActivePowerUps({ shield: false, speed: false, slowmo: false });
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleHome = useCallback(() => {
    setGameState('menu');
    setScore(0);
    setCoins(0);
    setHealth(MAX_HEALTH);
    setSurvivalTime(0);
    setActivePowerUps({ shield: false, speed: false, slowmo: false });
  }, []);

  const handleScoreUpdate = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  const handleHealthChange = useCallback((change) => {
    setHealth(prev => {
      const newHealth = Math.max(0, Math.min(MAX_HEALTH, prev + change));
      if (newHealth === 0) {
        setGameState('gameover');
      }
      return newHealth;
    });
  }, []);

  const handleCoinCollect = useCallback((amount) => {
    setCoins(prev => prev + amount);
    setScore(prev => prev + amount * 10);
  }, []);

  const handlePowerUpCollect = useCallback((type) => {
    // Clear existing timer for this power-up
    if (powerUpTimersRef.current[type]) {
      clearTimeout(powerUpTimersRef.current[type]);
    }

    if (type === 'repair') {
      handleHealthChange(1);
      return;
    }

    setActivePowerUps(prev => ({ ...prev, [type]: true }));

    // Set timer to deactivate
    powerUpTimersRef.current[type] = setTimeout(() => {
      setActivePowerUps(prev => ({ ...prev, [type]: false }));
    }, POWER_UP_DURATION);
  }, [handleHealthChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      }
      if (e.key === ' ' && gameState === 'menu') {
        handleStartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handlePause, handleResume, handleStartGame]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(powerUpTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  if (gameState === 'menu') {
    return (
      <MainMenu
        onStartGame={handleStartGame}
        selectedCarColor={selectedCarColor}
        onCarColorChange={setSelectedCarColor}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      {/* Game Canvas */}
      <GameCanvas
        gameState={gameState}
        setGameState={setGameState}
        onScoreUpdate={handleScoreUpdate}
        onHealthChange={handleHealthChange}
        onCoinCollect={handleCoinCollect}
        onPowerUpCollect={handlePowerUpCollect}
        activePowerUps={activePowerUps}
        isPaused={gameState === 'paused'}
        carColor={selectedCarColor}
      />

      {/* HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <GameHUD
            score={score}
            health={health}
            maxHealth={MAX_HEALTH}
            coins={coins}
            activePowerUps={activePowerUps}
          />

          {/* Pause Button */}
          <Button
            onClick={handlePause}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 z-40"
          >
            <Pause className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Pause Menu */}
      <AnimatePresence>
        {gameState === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestart}
            onHome={handleHome}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState === 'gameover' && (
          <GameOverScreen
            score={score}
            coins={coins}
            distance={score}
            survivalTime={survivalTime}
            highScore={highScore}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
}