import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

function BallShooter() {
  // Game state
  const [gameState, setGameState] = useState('idle'); // idle, playing, paused, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [balls, setBalls] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [shooterPosition, setShooterPosition] = useState(50); // percentage
  
  // Refs
  const gameLoopRef = useRef(null);
  const ballIdCounter = useRef(0);
  const bulletIdCounter = useRef(0);
  const gameAreaRef = useRef(null);
  const keysPressed = useRef({});
  
  // Game constants
  const BALL_SPEED_BASE = 1;
  const BULLET_SPEED = 8;
  const SPAWN_RATE_BASE = 2000;
  const SHOOTER_SPEED = 2;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'playing') {
          shootBullet();
        }
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Move shooter based on keys
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const moveInterval = setInterval(() => {
      setShooterPosition(prev => {
        let newPos = prev;
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
          newPos = Math.max(5, prev - SHOOTER_SPEED);
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
          newPos = Math.min(95, prev + SHOOTER_SPEED);
        }
        return newPos;
      });
    }, 16);
    
    return () => clearInterval(moveInterval);
  }, [gameState]);

  // Shoot bullet
  const shootBullet = useCallback(() => {
    const newBullet = {
      id: bulletIdCounter.current++,
      x: shooterPosition,
      y: 85,
    };
    setBullets(prev => [...prev, newBullet]);
  }, [shooterPosition]);

  // Spawn ball
  const spawnBall = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const newBall = {
      id: ballIdCounter.current++,
      x: Math.random() * 90 + 5,
      y: -5,
      speed: BALL_SPEED_BASE + (level * 0.2),
      color: ['red', 'blue', 'green', 'yellow', 'purple'][Math.floor(Math.random() * 5)],
      radius: 20 + Math.random() * 15
    };
    
    setBalls(prev => [...prev, newBall]);
  }, [gameState, level]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = () => {
      // Move balls
      setBalls(prevBalls => {
        const gameHeight = 100;
        let livesLost = 0;
        
        const updatedBalls = prevBalls.map(ball => ({
          ...ball,
          y: ball.y + ball.speed
        })).filter(ball => {
          if (ball.y > gameHeight) {
            livesLost++;
            return false;
          }
          return true;
        });
        
        if (livesLost > 0) {
          setLives(l => Math.max(0, l - livesLost));
        }
        
        return updatedBalls;
      });

      // Move bullets
      setBullets(prevBullets => 
        prevBullets.map(bullet => ({
          ...bullet,
          y: bullet.y - BULLET_SPEED
        })).filter(bullet => bullet.y > -10)
      );

      // Check collisions
      setBalls(prevBalls => {
        setBullets(prevBullets => {
          let newScore = 0;
          const remainingBalls = [];
          const remainingBullets = [...prevBullets];
          
          prevBalls.forEach(ball => {
            let hit = false;
            for (let i = remainingBullets.length - 1; i >= 0; i--) {
              const bullet = remainingBullets[i];
              const dx = (ball.x - bullet.x);
              const dy = (ball.y - bullet.y);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < ball.radius / 5 + 2) {
                hit = true;
                remainingBullets.splice(i, 1);
                newScore += 10;
                break;
              }
            }
            
            if (!hit) {
              remainingBalls.push(ball);
            }
          });
          
          if (newScore > 0) {
            setScore(s => s + newScore);
          }
          
          return remainingBullets;
        });
        
        return remainingBalls;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, level]);

  // Spawn interval
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(spawnBall, SPAWN_RATE_BASE - (level * 200));
    return () => clearInterval(interval);
  }, [gameState, spawnBall, level]);

  // Level up
  useEffect(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }
  }, [score, level]);

  // Check game over
  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [lives, gameState]);

  // Game controls
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setBalls([]);
    setBullets([]);
    setShooterPosition(50);
    spawnBall();
  };

  const pauseGame = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <Link to="/games" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Link>
          </div>
          <h1 className="text-xl font-bold text-cyan-400">Ball Shooter</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* HUD */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Score:</span>
              <span className="text-2xl font-bold text-yellow-400">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Level:</span>
              <span className="text-xl font-bold text-cyan-400">{level}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <svg key={i} className={`w-6 h-6 ${i < lives ? 'text-red-500' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div 
          ref={gameAreaRef}
          className="relative bg-gray-900 rounded-xl border-2 border-cyan-500/30 overflow-hidden"
          style={{ height: '500px' }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />

          {/* Game State: Idle */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Ball Shooter
                </h2>
                <p className="text-gray-400 mb-2">Use ← → or A D to move</p>
                <p className="text-gray-400 mb-6">SPACE or ENTER to shoot</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}

          {/* Game State: Playing or Paused */}
          {(gameState === 'playing' || gameState === 'paused') && (
            <>
              {gameState === 'paused' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <span className="text-3xl font-bold">PAUSED</span>
                </div>
              )}

              {/* Balls */}
              {balls.map(ball => (
                <div
                  key={ball.id}
                  className="absolute rounded-full shadow-lg"
                  style={{
                    left: `${ball.x}%`,
                    top: `${ball.y}%`,
                    width: `${ball.radius * 2}px`,
                    height: `${ball.radius * 2}px`,
                    backgroundColor: ball.color,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 20px ${ball.color}`
                  }}
                />
              ))}

              {/* Bullets */}
              {bullets.map(bullet => (
                <div
                  key={bullet.id}
                  className="absolute w-1 h-4 bg-cyan-400 rounded-full"
                  style={{
                    left: `${bullet.x}%`,
                    top: `${bullet.y}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 10px cyan'
                  }}
                />
              ))}

              {/* Shooter */}
              <div
                className="absolute bottom-8 w-12 h-8 bg-cyan-500 rounded-lg"
                style={{
                  left: `${shooterPosition}%`,
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 20px cyan'
                }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full" />
              </div>
            </>
          )}

          {/* Game State: Game Over */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
                <p className="text-gray-400 mb-2">Final Score</p>
                <p className="text-5xl font-bold text-yellow-400 mb-2">{score}</p>
                <p className="text-xl text-cyan-400 mb-6">Level {level}</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors"
                >
                  PLAY AGAIN
                </button>
                <div className="mt-4">
                  <Link to="/games" className="text-gray-400 hover:text-white text-sm">
                    ← Back to Games
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {gameState === 'playing' && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onMouseDown={() => keysPressed.current['ArrowLeft'] = true}
              onMouseUp={() => keysPressed.current['ArrowLeft'] = false}
              onTouchStart={() => keysPressed.current['ArrowLeft'] = true}
              onTouchEnd={() => keysPressed.current['ArrowLeft'] = false}
              className="px-6 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 active:bg-gray-500"
            >
              ←
            </button>
            <button
              onClick={shootBullet}
              className="px-8 py-4 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 active:bg-cyan-400"
            >
              SHOOT
            </button>
            <button
              onMouseDown={() => keysPressed.current['ArrowRight'] = true}
              onMouseUp={() => keysPressed.current['ArrowRight'] = false}
              onTouchStart={() => keysPressed.current['ArrowRight'] = true}
              onTouchEnd={() => keysPressed.current['ArrowRight'] = false}
              className="px-6 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 active:bg-gray-500"
            >
              →
            </button>
            <button
              onClick={pauseGame}
              className="px-4 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              ⏸
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <p className="text-center mt-4 text-gray-400 text-sm">
            Keyboard: ← → to move, SPACE to shoot, P to pause
          </p>
        )}
      </div>
    </div>
  );
}

export default BallShooter;
