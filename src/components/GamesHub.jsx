import React from 'react';
import { Link } from 'react-router-dom';

function GamesHub() {
  const games = [
    {
      id: 'ball-shooter',
      title: 'Ball Shooter',
      description: 'Shoot falling balls before they hit the bottom! Classic arcade action.',
      icon: (
        <svg className="w-16 h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M2 12h20" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
      color: 'bg-cyan-50 hover:bg-cyan-100',
      buttonColor: 'bg-cyan-600 hover:bg-cyan-700',
      status: 'available',
      badge: 'Arcade'
    },
    {
      id: 'coming-soon-1',
      title: 'Puzzle Blocks',
      description: 'Stack blocks and clear lines in this classic puzzle game.',
      icon: (
        <svg className="w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" strokeWidth={1.5} rx="1" />
          <rect x="14" y="3" width="7" height="7" strokeWidth={1.5} rx="1" />
          <rect x="3" y="14" width="7" height="7" strokeWidth={1.5} rx="1" />
          <rect x="14" y="14" width="7" height="7" strokeWidth={1.5} rx="1" />
        </svg>
      ),
      color: 'bg-orange-50',
      buttonColor: 'bg-gray-400 cursor-not-allowed',
      status: 'locked'
    },
    {
      id: 'coming-soon-2',
      title: 'Snake Challenge',
      description: 'Grow your snake and avoid walls in this retro classic.',
      icon: (
        <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16v16H4z" />
          <circle cx="8" cy="8" r="2" fill="currentColor" />
          <circle cx="16" cy="16" r="2" fill="currentColor" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8h8v8" />
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
          <h2 className="text-4xl font-bold mb-4">Arcade Games</h2>
          <p className="text-gray-400 text-lg">
            Classic arcade games running entirely in your browser. More coming soon!
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
          <p>More arcade games coming soon!</p>
        </div>
      </div>
    </div>
  );
}

export default GamesHub;
