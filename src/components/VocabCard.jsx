import React, { useState, useEffect, useCallback } from 'react';
import { levenshteinDistance, normalizeText } from '../utils/similarity';

function VocabCard({ vocab, isMastered, onMastered, onTranscribe, aiStatus }) {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null); // 'correct', 'incorrect', or null
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Listen for transcription results
  useEffect(() => {
    const handleResult = (e) => {
      const { result: transcribedText } = e.detail;
      checkPronunciation(transcribedText);
    };

    window.addEventListener('transcription-result', handleResult);
    return () => window.removeEventListener('transcription-result', handleResult);
  }, [vocab.word]);

  const speakWord = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocab.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [vocab.word]);

  const speakExample = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocab.example);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [vocab.example]);

  const startRecording = useCallback(async () => {
    if (aiStatus !== 'ready') {
      alert('AI model is still loading. Please wait a moment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const audioChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Send to AI for transcription
        try {
          await onTranscribe(audioBlob, vocab.word);
        } catch (err) {
          console.error('Transcription error:', err);
          setResult('incorrect');
        }
        
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setResult(null);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 5000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [aiStatus, onTranscribe, vocab.word]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  const checkPronunciation = useCallback((transcribedText) => {
    const normalizedTranscribed = normalizeText(transcribedText);
    const normalizedTarget = normalizeText(vocab.word);
    
    // Calculate similarity using Levenshtein distance
    const distance = levenshteinDistance(normalizedTranscribed, normalizedTarget);
    const maxLength = Math.max(normalizedTranscribed.length, normalizedTarget.length);
    const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;
    
    // Threshold: 70% similarity is considered correct
    const isCorrect = similarity >= 0.7 || 
                      normalizedTranscribed.includes(normalizedTarget) ||
                      normalizedTarget.includes(normalizedTranscribed);
    
    setResult(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect && !isMastered) {
      onMastered();
    }
  }, [vocab.word, isMastered, onMastered]);

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isMastered ? 'ring-2 ring-success' : ''
    }`}>
      <div className="p-6">
        {/* Word Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{vocab.word}</h3>
            <span className="text-sm text-gray-500">{vocab.type}</span>
          </div>
          {isMastered && (
            <div className="bg-success text-white px-2 py-1 rounded-full text-xs font-semibold">
              ✓ Mastered
            </div>
          )}
        </div>

        {/* IPA */}
        <p className="text-toeic-blue font-mono text-lg mb-3">{vocab.ipa}</p>

        {/* Meaning */}
        <p className="text-gray-700 mb-4">{vocab.meaning}</p>

        {/* Example */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-gray-600 text-sm italic">"{vocab.example}"</p>
          <button
            onClick={speakExample}
            className="mt-2 text-toeic-light hover:text-toeic-blue text-sm flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Listen
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Speaker Button */}
          <button
            onClick={speakWord}
            className="flex-1 flex items-center justify-center gap-2 bg-toeic-blue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Speak
          </button>

          {/* Microphone Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={aiStatus !== 'ready'}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : aiStatus === 'ready'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                isRecording 
                  ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              } />
            </svg>
            {isRecording ? 'Recording...' : 'Practice'}
          </button>
        </div>

        {/* Result Badge */}
        {result && (
          <div className={`mt-4 p-3 rounded-lg text-center font-semibold ${
            result === 'correct' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {result === 'correct' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Excellent pronunciation!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Try again! Listen and repeat.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VocabCard;
