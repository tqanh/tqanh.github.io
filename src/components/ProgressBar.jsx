import React from 'react';

function ProgressBar({ progress, mastered, total }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Today's Progress</h3>
        <span className="text-sm text-gray-600">
          {mastered} / {total} words mastered
        </span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-toeic-blue to-toeic-light h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="absolute right-0 -top-6 text-sm font-semibold text-toeic-blue">
          {progress}%
        </span>
      </div>
      
      {progress === 100 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-green-800 text-center font-medium">
            🎉 Congratulations! You've mastered all today's words!
          </p>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
