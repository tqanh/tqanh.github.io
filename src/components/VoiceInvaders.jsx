import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { levenshteinDistance, normalizeText } from '../utils/similarity';

function VoiceInvaders() {
  // Game state
  const [gameState, setGameState] = useState('idle'); // idle, playing, paused, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [fallingWords, setFallingWords] = useState([]);
  const [vocabData, setVocabData] = useState([]);
  const [aiStatus, setAiStatus] = useState('loading');
  const [worker, setWorker] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [explodingWords, setExplodingWords] = useState([]);
  
  // Refs
  const gameLoopRef = useRef(null);
  const wordIdCounter = useRef(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const gameAreaRef = useRef(null);
  
  // Game constants
  const GAME_SPEED = 0.5; // pixels per frame
  const SPAWN_RATE = 3000; // ms between new words
  const SIMILARITY_THRESHOLD = 80; // %

  // Load game targets (simple words, not English learning)
  useEffect(() => {
    // Use simple common words for the voice game - no English learning context
    const gameWords = [
      { word: "red", type: "color", meaning: "color" },
      { word: "blue", type: "color", meaning: "color" },
      { word: "green", type: "color", meaning: "color" },
      { word: "yellow", type: "color", meaning: "color" },
      { word: "up", type: "direction", meaning: "direction" },
      { word: "down", type: "direction", meaning: "direction" },
      { word: "left", type: "direction", meaning: "direction" },
      { word: "right", type: "direction", meaning: "direction" },
      { word: "start", type: "action", meaning: "action" },
      { word: "stop", type: "action", meaning: "action" },
      { word: "go", type: "action", meaning: "action" },
      { word: "fire", type: "action", meaning: "action" },
      { word: "one", type: "number", meaning: "number" },
      { word: "two", type: "number", meaning: "number" },
      { word: "three", type: "number", meaning: "number" },
      { word: "alpha", type: "code", meaning: "code" },
      { word: "beta", type: "code", meaning: "code" },
      { word: "gamma", type: "code", meaning: "code" },
      { word: "delta", type: "code", meaning: "code" },
      { word: "omega", type: "code", meaning: "code" }
    ];
    setVocabData(gameWords);
  }, []);

  // Initialize AI Worker
  useEffect(() => {
    const speechWorker = new Worker(new URL('../worker/speechWorker.js', import.meta.url), {
      type: 'module'
    });

    speechWorker.onmessage = (e) => {
      const { type, status, result, error } = e.data;
      
      if (type === 'status') {
        setAiStatus(status);
      } else if (type === 'result') {
        handleTranscriptionResult(result);
      } else if (type === 'error') {
        console.error('Worker error:', error);
        setAiStatus('error');
      }
    };

    setWorker(speechWorker);

    return () => {
      speechWorker.terminate();
    };
  }, []);

  // Handle transcription result
  const handleTranscriptionResult = useCallback((result) => {
    if (!result || !result.text) return;
    
    const spokenText = normalizeText(result.text);
    console.log('Spoken:', spokenText);
    
    // Find the lowest falling word (most urgent)
    const lowestWord = [...fallingWords]
      .filter(w => !explodingWords.includes(w.id))
      .sort((a, b) => b.y - a.y)[0];
    
    if (!lowestWord) return;
    
    const targetWord = normalizeText(lowestWord.word);
    
    // Calculate similarity
    const maxLen = Math.max(spokenText.length, targetWord.length);
    const distance = levenshteinDistance(spokenText, targetWord);
    const similarity = Math.round(((maxLen - distance) / maxLen) * 100);
    
    console.log(`Comparing "${spokenText}" with "${targetWord}": ${similarity}%`);
    
    if (similarity >= SIMILARITY_THRESHOLD) {
      // Destroy the word!
      destroyWord(lowestWord.id);
    }
  }, [fallingWords, explodingWords]);

  // Destroy word (explosion)
  const destroyWord = useCallback((wordId) => {
    setExplodingWords(prev => [...prev, wordId]);
    
    setTimeout(() => {
      setFallingWords(prev => prev.filter(w => w.id !== wordId));
      setExplodingWords(prev => prev.filter(id => id !== wordId));
      setScore(s => s + 10);
      setStreak(s => s + 1);
    }, 300);
  }, []);

  // Spawn new word
  const spawnWord = useCallback(() => {
    if (gameState !== 'playing' || vocabData.length === 0) return;
    
    const randomWord = vocabData[Math.floor(Math.random() * vocabData.length)];
    const gameWidth = gameAreaRef.current?.offsetWidth || 800;
    
    const newWord = {
      id: wordIdCounter.current++,
      word: randomWord.word,
      meaning: randomWord.meaning,
      x: Math.random() * (gameWidth - 150) + 20,
      y: -50,
      speed: GAME_SPEED + Math.random() * 0.3
    };
    
    setFallingWords(prev => [...prev, newWord]);
  }, [gameState, vocabData]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = () => {
      setFallingWords(prev => {
        const gameHeight = gameAreaRef.current?.offsetHeight || 600;
        const updated = prev.map(word => ({
          ...word,
          y: word.y + word.speed
        }));
        
        // Check for words hitting bottom
        const hitBottom = updated.filter(word => word.y > gameHeight - 30 && !explodingWords.includes(word.id));
        
        if (hitBottom.length > 0) {
          setLives(l => Math.max(0, l - hitBottom.length));
          setStreak(0);
          return updated.filter(word => word.y <= gameHeight - 30 || explodingWords.includes(word.id));
        }
        
        return updated;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, explodingWords]);

  // Spawn interval
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(spawnWord, SPAWN_RATE);
    return () => clearInterval(interval);
  }, [gameState, spawnWord]);

  // Check game over
  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [lives, gameState]);

  // Voice recording handlers
  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Microphone not supported in your browser');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        if (worker && aiStatus === 'ready') {
          const arrayBuffer = await audioBlob.arrayBuffer();
          worker.postMessage({
            type: 'transcribe',
            audioData: arrayBuffer,
            targetWord: ''
          }, [arrayBuffer]);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Game controls
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setStreak(0);
    setFallingWords([]);
    setExplodingWords([]);
    spawnWord();
  };

  const pauseGame = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
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
          <h1 className="text-xl font-bold text-purple-400">Voice Invaders</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              aiStatus === 'ready' ? 'bg-green-500' : 
              aiStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-400">
              {aiStatus === 'ready' ? 'AI Ready' : 
               aiStatus === 'loading' ? 'Loading AI...' : 'AI Error'}
            </span>
          </div>
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
              <span className="text-gray-400">Streak:</span>
              <span className="text-xl font-bold text-purple-400">x{streak}</span>
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
          className="relative bg-gray-900 rounded-xl border-2 border-purple-500/30 overflow-hidden"
          style={{ height: '500px' }}
        >
          {/* Stars background */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 30 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Game State: Idle */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Voice Invaders
                </h2>
                <p className="text-gray-400 mb-6">Speak the code words to destroy the targets!</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                >
                  START GAME
                </button>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Hold the microphone button to speak</p>
                  <p>Speak the target code to destroy it</p>
                </div>
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

              {/* Falling Words */}
              {fallingWords.map(word => (
                <div
                  key={word.id}
                  className={`absolute transition-transform ${
                    explodingWords.includes(word.id) ? 'animate-ping scale-150' : ''
                  }`}
                  style={{
                    left: `${word.x}px`,
                    top: `${word.y}px`,
                  }}
                >
                  <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    explodingWords.includes(word.id) 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-purple-600 text-white shadow-lg'
                  }`}>
                    {word.word}
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-1 max-w-[120px] truncate">
                    {word.meaning}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Game State: Game Over */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
                <p className="text-gray-400 mb-4">Final Score</p>
                <p className="text-5xl font-bold text-yellow-400 mb-6">{score}</p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
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
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseLeave={isRecording ? stopRecording : undefined}
              disabled={aiStatus !== 'ready'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50' 
                  : aiStatus === 'ready'
                    ? 'bg-purple-600 hover:bg-purple-500'
                    : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isRecording && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={pauseGame}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <p className="text-center mt-4 text-gray-400 text-sm">
            Hold the microphone button and speak the code word to destroy the target!
          </p>
        )}
      </div>
    </div>
  );
}

export default VoiceInvaders;
