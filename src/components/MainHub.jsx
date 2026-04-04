import React from 'react';
import { Link } from 'react-router-dom';

function MainHub() {
  const apps = [
    {
      id: 'toeic',
      title: 'Daily TOEIC',
      description: 'Learn 10 words daily with AI pronunciation check',
      icon: (
        <svg className="w-12 h-12 text-toeic-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'bg-blue-50 hover:bg-blue-100',
      buttonColor: 'bg-toeic-blue hover:bg-blue-700',
      status: 'available'
    },
    {
      id: 'games',
      title: 'Games Hub',
      description: 'Play fun voice-controlled games powered by AI.',
      icon: (
        <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-purple-50 hover:bg-purple-100',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      status: 'available',
      badge: 'Games'
    },
    {
      id: 'coming-soon',
      title: 'Coming Soon',
      description: 'More English learning features are on the way!',
      icon: (
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'bg-gray-100',
      buttonColor: 'bg-gray-400 cursor-not-allowed',
      status: 'locked'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-toeic-blue to-purple-600 opacity-5"></div>
        <div className="container mx-auto px-4 py-16 max-w-6xl relative">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-toeic-blue to-purple-600 bg-clip-text text-transparent">
                Smart English Edge Hub
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your AI-powered learning companion. Master English with cutting-edge Edge AI technology.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Offline AI
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A4.001 4.001 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Multi-App Hub
              </span>
              <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Edge Powered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* App Grid */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {apps.map((app) => (
            <div 
              key={app.id}
              className={`${app.color} rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-gray-200 relative overflow-hidden`}
            >
              {app.badge && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {app.badge}
                </span>
              )}
              
              <div className="flex flex-col h-full">
                <div className="mb-4">{app.icon}</div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{app.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{app.description}</p>
                
                {app.status === 'available' ? (
                  <Link
                    to={`/${app.id}`}
                    className={`${app.buttonColor} text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors flex items-center justify-center gap-2`}
                  >
                    {app.id === 'toeic' ? (
                      <>
                        <span>Launch</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    ) : app.id === 'games' ? (
                      <>
                        <span>Enter</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Play Now</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </>
                    )}
                  </Link>
                ) : (
                  <button
                    disabled
                    className={`${app.buttonColor} text-white font-semibold py-3 px-6 rounded-xl text-center flex items-center justify-center gap-2`}
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
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 max-w-6xl border-t border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          <p>Built with React, Vite, Tailwind CSS & Transformers.js</p>
          <p className="mt-2">Running entirely in your browser - no data sent to servers</p>
        </div>
      </div>
    </div>
  );
}

export default MainHub;
