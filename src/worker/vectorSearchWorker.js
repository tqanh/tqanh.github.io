import { pipeline } from '@xenova/transformers';

let embeddingModel = null;
let isModelLoading = false;

// Model configuration
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const MODEL_OPTIONS = {
  device: 'webgpu',
  dtype: 'fp32',
  revision: 'main'
};

// IndexedDB configuration
const DB_NAME = 'TOEIC_VectorDB';
const DB_VERSION = 1;
const STORE_NAME = 'embeddings';

// Send status updates to main thread
function sendStatus(status) {
  self.postMessage({ type: 'status', status });
}

// Send error to main thread
function sendError(error) {
  self.postMessage({ type: 'error', error: error.message || String(error) });
}

// Send result to main thread
function sendResult(type, data) {
  self.postMessage({ type: 'result', resultType: type, data });
}

// Initialize IndexedDB
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'word' });
        store.createIndex('word', 'word', { unique: true });
      }
    };
  });
}

// Save embedding to IndexedDB
async function saveEmbedding(word, text, embedding) {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const data = {
      word,
      text,
      embedding: Array.from(embedding),
      timestamp: Date.now()
    };
    
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all embeddings from IndexedDB
async function getAllEmbeddings() {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Clear all embeddings
async function clearEmbeddings() {
  const db = await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Initialize the embedding model
async function initializeModel() {
  if (embeddingModel || isModelLoading) return;
  
  isModelLoading = true;
  sendStatus('loading');
  
  try {
    // Try WebGPU first, fallback to WASM
    try {
      embeddingModel = await pipeline('feature-extraction', MODEL_NAME, MODEL_OPTIONS);
    } catch (webgpuError) {
      console.warn('WebGPU not available, falling back to WASM:', webgpuError);
      embeddingModel = await pipeline('feature-extraction', MODEL_NAME, {
        device: 'wasm',
        dtype: 'fp32'
      });
    }
    
    sendStatus('ready');
  } catch (error) {
    console.error('Failed to load model:', error);
    sendError(error);
    sendStatus('error');
  } finally {
    isModelLoading = false;
  }
}

// Generate embedding for text
async function generateEmbedding(text) {
  if (!embeddingModel) {
    await initializeModel();
  }
  
  try {
    const result = await embeddingModel(text, {
      pooling: 'mean',
      normalize: true
    });
    
    return result.data;
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

// Index vocabulary (generate and store embeddings)
async function indexVocabulary(vocabData) {
  try {
    await clearEmbeddings();
    
    for (const item of vocabData) {
      const text = `${item.word}. ${item.meaning}. ${item.example}`;
      const embedding = await generateEmbedding(text);
      await saveEmbedding(item.word, text, embedding);
    }
    
    sendResult('indexed', { count: vocabData.length });
  } catch (error) {
    sendError(error);
  }
}

// Search vocabulary by query
async function searchVocabulary(query, topK = 3) {
  try {
    if (!embeddingModel) {
      await initializeModel();
    }
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Get all stored embeddings
    const allEmbeddings = await getAllEmbeddings();
    
    if (allEmbeddings.length === 0) {
      sendResult('search', { results: [], message: 'No vocabulary indexed yet' });
      return;
    }
    
    // Calculate similarity for each word
    const similarities = allEmbeddings.map(item => ({
      word: item.word,
      text: item.text,
      similarity: cosineSimilarity(queryEmbedding, item.embedding)
    }));
    
    // Sort by similarity (descending) and get top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, topK);
    
    sendResult('search', { results: topResults });
  } catch (error) {
    sendError(error);
  }
}

// Handle messages from main thread
self.onmessage = async (e) => {
  const { type, vocabData, query, topK } = e.data;
  
  if (type === 'init') {
    await initializeModel();
  } else if (type === 'index') {
    await indexVocabulary(vocabData);
  } else if (type === 'search') {
    await searchVocabulary(query, topK);
  }
};

// Auto-initialize when worker loads
initializeModel();
