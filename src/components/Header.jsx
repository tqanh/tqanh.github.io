import React from 'react';

function Header({ aiStatus }) {
  const statusConfig = {
    loading: { color: 'bg-yellow-500', text: 'AI Loading...', label: 'Loading' },
    ready: { color: 'bg-green-500', text: 'AI Ready', label: 'Ready' },
    error: { color: 'bg-red-500', text: 'AI Error', label: 'Error' }
  };

  const status = statusConfig[aiStatus] || statusConfig.loading;

  return (
    <header className="bg-toeic-blue text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-toeic-blue font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Daily TOEIC AI</h1>
              <p className="text-blue-200 text-sm">Learn with Edge AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-800 rounded-full px-4 py-2">
            <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`}></div>
            <span className="text-sm font-medium">{status.text}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
