import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RefreshCw, Trophy, Music } from 'lucide-react';
import { motion } from 'motion/react';

// --- Types ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 120;

// --- Dummy Music Tracks ---
const TRACKS = [
  {
    id: 1,
    title: "Neon Horizon (AI Generated)",
    artist: "SynthMind",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "6:12"
  },
  {
    id: 2,
    title: "Cybernetic Pulse (AI Generated)",
    artist: "NeuralWave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "7:05"
  },
  {
    id: 3,
    title: "Digital Dreamscape (AI Generated)",
    artist: "AlgoRhythm",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "5:44"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isGamePlaying, setIsGamePlaying] = useState<boolean>(false);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const generateFood = useCallback((): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setFood(generateFood());
    setIsGamePlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGamePlaying) return;
      
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGamePlaying]);

  useEffect(() => {
    if (!isGamePlaying || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (direction) {
          case 'UP':
            newHead.y -= 1;
            break;
          case 'DOWN':
            newHead.y += 1;
            break;
          case 'LEFT':
            newHead.x -= 1;
            break;
          case 'RIGHT':
            newHead.x += 1;
            break;
        }

        // Check collision with walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGamePlaying(false);
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        // Check collision with self
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGamePlaying(false);
          if (score > highScore) setHighScore(score);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [direction, food, gameOver, isGamePlaying, score, highScore, generateFood]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Audio play failed:", e);
          }
        });
      }
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const skipBackward = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleTrackEnded = () => {
    skipForward();
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-fuchsia-500/30 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8 z-10 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.4)]">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
              Neon Snake
            </h1>
            <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">v1.0.0 // Synth Edition</p>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex gap-4">
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl px-6 py-3 flex flex-col items-center shadow-lg">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Score</span>
            <span className="text-2xl font-mono font-bold text-cyan-400">{score.toString().padStart(4, '0')}</span>
          </div>
          <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl px-6 py-3 flex flex-col items-center shadow-lg">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">High Score</span>
            <span className="text-2xl font-mono font-bold text-fuchsia-400">{highScore.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center z-10">
        
        {/* Game Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          <div className="relative bg-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-2xl">
            <div 
              className="bg-neutral-900 rounded-xl overflow-hidden relative"
              style={{
                width: GRID_SIZE * 20,
                height: GRID_SIZE * 20,
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
              }}
            >
              {/* Grid Lines (Optional, for aesthetic) */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <motion.div
                    key={`${segment.x}-${segment.y}-${index}`}
                    initial={false}
                    animate={{
                      x: segment.x * 20,
                      y: segment.y * 20,
                    }}
                    transition={{ type: 'tween', duration: 0.1, ease: 'linear' }}
                    className="absolute w-[20px] h-[20px] p-[1px]"
                  >
                    <div className={`w-full h-full rounded-sm ${isHead ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10' : 'bg-cyan-600/80'}`} />
                  </motion.div>
                );
              })}

              {/* Food */}
              <motion.div
                animate={{
                  x: food.x * 20,
                  y: food.y * 20,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  scale: { repeat: Infinity, duration: 1 },
                  x: { type: 'tween', duration: 0 },
                  y: { type: 'tween', duration: 0 }
                }}
                className="absolute w-[20px] h-[20px] p-[2px]"
              >
                <div className="w-full h-full bg-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.9)]" />
              </motion.div>

              {/* Overlays */}
              {!isGamePlaying && !gameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <button 
                    onClick={resetGame}
                    className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                  >
                    Start Game
                  </button>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 border border-neutral-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reboot
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Music Player */}
        <div className="w-full max-w-sm bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {/* Player Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <Music className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Now Playing</h3>
          </div>

          {/* Track Info */}
          <div className="mb-8">
            <div className="w-full aspect-video bg-neutral-950 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-neutral-800">
              {isPlaying ? (
                <div className="flex items-end gap-1 h-12">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['20%', '100%', '20%'] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + Math.random() * 0.5,
                        delay: Math.random() * 0.5,
                      }}
                      className="w-2 bg-gradient-to-t from-fuchsia-500 to-cyan-400 rounded-t-sm opacity-80"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-700">
                  <Music className="w-12 h-12 opacity-20" />
                </div>
              )}
            </div>
            <h4 className="text-xl font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-sm text-fuchsia-400 font-mono mt-1">{currentTrack.artist}</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={skipBackward}
                className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              
              <button 
                onClick={skipForward}
                className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 bg-neutral-950/50 p-3 rounded-2xl border border-neutral-800/50">
              <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              />
            </div>
          </div>
        </div>

      </main>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnded}
        preload="auto"
      />
      
    </div>
  );
}
