import React, { useState, useEffect, useCallback, useRef } from 'react';

function SmartSearch({ vocabData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [vectorStatus, setVectorStatus] = useState('loading');
  const [isIndexed, setIsIndexed] = useState(false);
  const workerRef = useRef(null);

  // Initialize vector search worker
  useEffect(() => {
    const vectorWorker = new Worker(new URL('../worker/vectorSearchWorker.js', import.meta.url), {
      type: 'module'
    });

    vectorWorker.onmessage = (e) => {
      const { type, status, resultType, data, error } = e.data;
      
      if (type === 'status') {
        setVectorStatus(status);
      } else if (type === 'result') {
        if (resultType === 'indexed') {
          setIsIndexed(true);
          console.log(`Indexed ${data.count} words`);
        } else if (resultType === 'search') {
          setSearchResults(data.results || []);
          setIsSearching(false);
        }
      } else if (type === 'error') {
        console.error('Vector worker error:', error);
        setVectorStatus('error');
        setIsSearching(false);
      }
    };

    workerRef.current = vectorWorker;

    return () => {
      vectorWorker.terminate();
    };
  }, []);

  // Index vocabulary when data changes
  useEffect(() => {
    if (workerRef.current && vocabData.length > 0 && vectorStatus === 'ready') {
      workerRef.current.postMessage({
        type: 'index',
        vocabData
      });
    }
  }, [vocabData, vectorStatus]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || !workerRef.current || vectorStatus !== 'ready') {
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    workerRef.current.postMessage({
      type: 'search',
      query: searchQuery,
      topK: 3
    });
  }, [searchQuery, vectorStatus]);

  const handleExampleClick = (example) => {
    setSearchQuery(example);
    // Auto trigger search after a short delay
    setTimeout(() => {
      if (workerRef.current && vectorStatus === 'ready') {
        setIsSearching(true);
        setSearchResults([]);
        workerRef.current.postMessage({
          type: 'search',
          query: example,
          topK: 3
        });
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-toeic-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Smart Search
          </h2>
          <p className="text-gray-600 mt-1">Search TOEIC words by meaning or context using AI</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            vectorStatus === 'ready' ? 'bg-green-500' : 
            vectorStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {vectorStatus === 'ready' ? 'AI Ready' : 
             vectorStatus === 'loading' ? 'Loading AI...' : 'AI Error'}
          </span>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Describe the word you're looking for..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-toeic-blue focus:border-toeic-blue outline-none transition-all"
              disabled={vectorStatus !== 'ready' || isSearching}
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || vectorStatus !== 'ready' || isSearching}
            className="px-6 py-3 bg-toeic-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : 'Search'}
          </button>
        </div>
      </form>

      {/* Example searches */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "a formal public statement",
            "money for work",
            "to leave a job",
            "company rules",
            "selling goods"
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-toeic-light hover:text-white transition-colors"
              disabled={vectorStatus !== 'ready'}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Top Matches</h3>
          {searchResults.map((result, index) => (
            <div 
              key={result.word}
              className="p-4 border border-gray-200 rounded-lg hover:border-toeic-blue hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <h4 className="text-xl font-bold text-toeic-blue">{result.word}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-toeic-light h-2 rounded-full transition-all"
                      style={{ width: `${Math.round(result.similarity * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {Math.round(result.similarity * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2">{result.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {!isSearching && searchQuery && searchResults.length === 0 && vectorStatus === 'ready' && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No matching words found. Try a different description.</p>
        </div>
      )}

      {/* Not indexed warning */}
      {vectorStatus === 'ready' && !isIndexed && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 text-sm">Indexing vocabulary database... Please wait a moment before searching.</p>
        </div>
      )}
    </div>
  );
}

export default SmartSearch;
