import React from 'react';
import { Link } from 'react-router-dom';

function GamesHub() {
  const games = [
    {
      id: 'voice-invaders',
      title: 'Voice Invaders',
      description: 'Destroy falling words with your voice! Speak the word correctly to shoot it down before it hits the bottom.',
      icon: (
        <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-purple-50 hover:bg-purple-100',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      status: 'available',
      badge: 'AI Powered'
    },
    {
      id: 'coming-soon-1',
      title: 'Word Scramble',
      description: 'Unscramble letters to form correct TOEIC words against the clock.',
      icon: (
        <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: 'bg-blue-50',
      buttonColor: 'bg-gray-400 cursor-not-allowed',
      status: 'locked'
    },
    {
      id: 'coming-soon-2',
      title: 'Listening Challenge',
      description: 'Listen and type what you hear. Test your listening comprehension.',
      icon: (
        <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      color: 'bg-green-50',
      buttonColor: 'bg-gray-400 cursor-not-allowed',
      status: 'locked'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Hub
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Games Hub
          </h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Game</h2>
          <p className="text-gray-400 text-lg">
            Learn English while having fun! More games coming soon.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game) => (
            <div 
              key={game.id}
              className={`${game.color} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 border border-gray-700 relative overflow-hidden ${
                game.status === 'available' ? 'hover:shadow-xl hover:shadow-purple-500/20' : ''
              }`}
            >
              {game.badge && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {game.badge}
                </span>
              )}
              
              {game.status === 'locked' && (
                <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-10">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-gray-400 font-medium">Coming Soon</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col h-full">
                <div className="mb-6 flex justify-center">{game.icon}</div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">{game.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow text-center">{game.description}</p>
                
                {game.status === 'available' ? (
                  <Link
                    to={`/games/${game.id}`}
                    className={`${game.buttonColor} text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors flex items-center justify-center gap-2`}
                  >
                    <span>Play Now</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Link>
                ) : (
                  <button
                    disabled
                    className={`${game.buttonColor} text-white font-semibold py-3 px-6 rounded-xl text-center flex items-center justify-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Locked</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats or Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">1</div>
            <div className="text-gray-400">Active Game</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="text-3xl font-bold text-pink-400 mb-2">2</div>
            <div className="text-gray-400">Coming Soon</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">AI</div>
            <div className="text-gray-400">Powered</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 max-w-6xl border-t border-gray-800 mt-8">
        <div className="text-center text-gray-500 text-sm">
          <p>More educational games will be added soon!</p>
        </div>
      </div>
    </div>
  );
}

export default GamesHub;
