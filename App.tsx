
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, GameState, ScoreEntry } from './types';
import Jar from './components/Jar';
import Leaderboard from './components/Leaderboard';
import { getMotivationalMessage } from './services/geminiService';

declare global {
  interface Window {
    Telegram: any;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'playing' | 'leaderboard' | 'result'>('home');
  const [gameState, setGameState] = useState<GameState>({
    currentMode: null,
    score: 0,
    timeLeft: 0,
    isActive: false,
    fillLevel: 0
  });
  const [scores, setScores] = useState<ScoreEntry[]>(() => {
    const saved = localStorage.getItem('shakemaster_scores');
    return saved ? JSON.parse(saved) : [];
  });
  const [aiComment, setAiComment] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Shake detection refs
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const shakeCount = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const tg = window.Telegram.WebApp;

  useEffect(() => {
    tg.ready();
    tg.expand();
    tg.MainButton.hide();
  }, []);

  const saveScore = useCallback((score: number, mode: GameMode) => {
    const newEntry: ScoreEntry = {
      username: tg.initDataUnsafe?.user?.first_name || 'Anonymous',
      score,
      mode,
      date: Date.now()
    };
    const updated = [...scores, newEntry].sort((a, b) => b.score - a.score).slice(0, 100);
    setScores(updated);
    localStorage.setItem('shakemaster_scores', JSON.stringify(updated));
  }, [scores, tg.initDataUnsafe?.user?.first_name]);

  const startMode = (mode: GameMode) => {
    let seconds = 0;
    switch(mode) {
      case GameMode.ONE_MIN: seconds = 60; break;
      case GameMode.THREE_MIN: seconds = 180; break;
      case GameMode.FIVE_MIN: seconds = 300; break;
      case GameMode.SEVEN_MIN: seconds = 420; break;
      case GameMode.INFINITE: seconds = 999999; break;
    }

    setGameState({
      currentMode: mode,
      score: 0,
      timeLeft: seconds,
      isActive: true,
      fillLevel: 0
    });
    setView('playing');
    setAiComment("");

    // Request motion permission for iOS
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }
  };

  const stopGame = useCallback(async () => {
    window.removeEventListener('devicemotion', handleMotion);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setGameState(prev => {
      if (prev.currentMode) {
        saveScore(prev.score, prev.currentMode);
      }
      return { ...prev, isActive: false };
    });

    setView('result');
    setLoadingAi(true);
    const comment = await getMotivationalMessage(gameState.score, gameState.currentMode || "Unknown");
    setAiComment(comment);
    setLoadingAi(false);
  }, [gameState.score, gameState.currentMode, saveScore]);

  useEffect(() => {
    if (gameState.isActive) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            stopGame();
            return { ...prev, timeLeft: 0, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isActive, stopGame]);

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const curTime = Date.now();
    if ((curTime - lastUpdate.current) > 100) {
      const diffTime = curTime - lastUpdate.current;
      lastUpdate.current = curTime;

      const { x, y, z } = acc;
      if (lastX.current !== null && x !== null && y !== null && z !== null) {
        const speed = Math.abs(x + y + z - (lastX.current + (lastY.current || 0) + (lastZ.current || 0))) / diffTime * 10000;

        if (speed > 800) {
          tg.HapticFeedback.impactOccurred('light');
          setGameState(prev => {
            const addedScore = Math.floor(speed / 100);
            const newFill = Math.min(100, prev.fillLevel + 0.5);
            return {
              ...prev,
              score: prev.score + addedScore,
              fillLevel: newFill
            };
          });
        }
      }
      lastX.current = x;
      lastY.current = y;
      lastZ.current = z;
    }
  };

  const formatTime = (s: number) => {
    if (s > 9999) return "∞";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-[100px]" />
      </div>

      {view === 'home' && (
        <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 animate-fadeIn">
          <div className="text-center">
            <h1 className="text-5xl font-black italic tracking-tighter mb-2">SHAKE MASTER</h1>
            <p className="text-slate-400">Тряси телефон, чтобы наполнить баночку!</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {[GameMode.ONE_MIN, GameMode.THREE_MIN, GameMode.FIVE_MIN, GameMode.SEVEN_MIN].map(mode => (
              <button 
                key={mode}
                onClick={() => startMode(mode)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 p-6 rounded-2xl flex flex-col items-center transition-all active:scale-95"
              >
                <span className="text-2xl font-bold">{mode}</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Минут</span>
              </button>
            ))}
            <button 
              onClick={() => startMode(GameMode.INFINITE)}
              className="col-span-2 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl flex flex-col items-center transition-all active:scale-95 shadow-lg shadow-purple-500/20"
            >
              <span className="text-2xl font-black">ПОЛНАЯ СУШКА</span>
              <span className="text-xs text-white/70 uppercase tracking-widest">Бесконечный режим</span>
            </button>
          </div>

          <button 
            onClick={() => setView('leaderboard')}
            className="w-full py-4 border border-white/10 rounded-xl bg-slate-800/50 flex items-center justify-center gap-2"
          >
            🏆 Посмотреть лидеров
          </button>
        </div>
      )}

      {view === 'playing' && (
        <div className="flex flex-col h-full p-6 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-widest">Score</p>
              <p className="text-4xl font-black tabular-nums">{gameState.score.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm uppercase tracking-widest">Time</p>
              <p className={`text-4xl font-black tabular-nums ${gameState.timeLeft < 10 ? 'text-red-500 animate-pulse' : ''}`}>
                {formatTime(gameState.timeLeft)}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <Jar fillLevel={gameState.fillLevel} />
            <div className="mt-12 text-center">
              <p className="text-xl font-bold animate-bounce text-white/80">БЫСТРЕЕ! ТРЯСИ!</p>
            </div>
          </div>

          <button 
            onClick={stopGame}
            className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold"
          >
            Закончить раньше
          </button>
        </div>
      )}

      {view === 'result' && (
        <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 mb-4">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black">СЕССИЯ ЗАВЕРШЕНА!</h2>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl w-full">
            <p className="text-slate-400 uppercase text-xs tracking-widest mb-1">Финальный счет</p>
            <p className="text-5xl font-black text-white">{gameState.score.toLocaleString()}</p>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
              <span className="text-slate-400">Режим:</span>
              <span className="font-bold">{gameState.currentMode}</span>
            </div>
          </div>

          <div className="min-h-[60px] flex items-center justify-center">
            {loadingAi ? (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            ) : (
              <p className="text-lg italic text-blue-400 px-4">"{aiComment}"</p>
            )}
          </div>

          <div className="w-full space-y-3 pt-4">
            <button 
              onClick={() => setView('home')}
              className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg active:scale-95 transition-all shadow-lg"
            >
              Главное меню
            </button>
            <button 
              onClick={() => setView('leaderboard')}
              className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold active:scale-95 transition-all border border-white/10"
            >
              Посмотреть таблицу лидеров
            </button>
          </div>
        </div>
      )}

      {view === 'leaderboard' && (
        <Leaderboard scores={scores} onBack={() => setView('home')} />
      )}
    </div>
  );
};

export default App;
