import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import VocabCard from './components/VocabCard';
import ProgressBar from './components/ProgressBar';

function App() {
  const [vocabData, setVocabData] = useState([]);
  const [masteredWords, setMasteredWords] = useState(new Set());
  const [aiStatus, setAiStatus] = useState('loading');
  const [worker, setWorker] = useState(null);

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
    const speechWorker = new Worker(new URL('./worker/speechWorker.js', import.meta.url), {
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
        <ProgressBar progress={progress} mastered={masteredWords.size} total={vocabData.length} />
        
        <div className="mt-8">
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
      </main>
    </div>
  );
}

export default App;
