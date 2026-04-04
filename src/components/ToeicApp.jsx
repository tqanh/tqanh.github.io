import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import VocabCard from './VocabCard';
import ProgressBar from './ProgressBar';
import SmartSearch from './SmartSearch';

function ToeicApp() {
  const [vocabData, setVocabData] = useState([]);
  const [masteredWords, setMasteredWords] = useState(new Set());
  const [aiStatus, setAiStatus] = useState('loading');
  const [worker, setWorker] = useState(null);
  const [activeTab, setActiveTab] = useState('vocab'); // 'vocab' | 'search'

  // Load vocabulary data
  useEffect(() => {
    fetch('./src/data/daily-vocab.json')
      .then(res => res.json())
      .then(data => {
        setVocabData(data.words || []);
      })
      .catch(err => {
        console.error('Failed to load vocab data:', err);
        // Fallback data
        setVocabData([
          { word: "accomplish", type: "verb", ipa: "/əˈkʌmplɪʃ/", meaning: "to succeed in doing something", example: "We need to accomplish our goals." },
          { word: "achievement", type: "noun", ipa: "/əˈtʃiːvmənt/", meaning: "something done successfully", example: "Winning the award was a great achievement." },
        ]);
      });
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
        // Handle transcription result
        window.dispatchEvent(new CustomEvent('transcription-result', { 
          detail: { result } 
        }));
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

  const handleTranscribe = useCallback(async (audioBlob, targetWord) => {
    if (!worker || aiStatus !== 'ready') {
      throw new Error('AI not ready');
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    worker.postMessage({
      type: 'transcribe',
      audioData: arrayBuffer,
      targetWord
    }, [arrayBuffer]);
  }, [worker, aiStatus]);

  const markMastered = useCallback((word) => {
    setMasteredWords(prev => new Set([...prev, word]));
  }, []);

  const progress = vocabData.length > 0 
    ? Math.round((masteredWords.size / vocabData.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header aiStatus={aiStatus} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back to Hub Link */}
        <div className="mb-4">
          <Link to="/" className="text-toeic-blue hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hub
          </Link>
        </div>

        <ProgressBar progress={progress} mastered={masteredWords.size} total={vocabData.length} />
        
        {/* Tab Navigation */}
        <div className="mt-8 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('vocab')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'vocab' 
                  ? 'text-toeic-blue border-b-2 border-toeic-blue' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Daily Vocabulary
              </span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'search' 
                  ? 'text-toeic-blue border-b-2 border-toeic-blue' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Smart Search
                <span className="px-2 py-0.5 bg-toeic-light text-white text-xs rounded-full">AI</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'vocab' ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's TOEIC Vocabulary</h2>
              
              {vocabData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-toeic-blue mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading vocabulary...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vocabData.map((item, index) => (
                    <VocabCard
                      key={`${item.word}-${index}`}
                      vocab={item}
                      isMastered={masteredWords.has(item.word)}
                      onMastered={() => markMastered(item.word)}
                      onTranscribe={handleTranscribe}
                      aiStatus={aiStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <SmartSearch vocabData={vocabData} />
          )}
        </div>
      </main>
    </div>
  );
}

export default ToeicApp;
