import { pipeline } from '@xenova/transformers';

let transcriber = null;
let isModelLoading = false;

// Model configuration
const MODEL_NAME = 'Xenova/whisper-tiny';
const MODEL_OPTIONS = {
  device: 'webgpu',
  dtype: 'q8',  // quantized 8-bit for faster inference
  revision: 'main'
};

// Send status updates to main thread
function sendStatus(status) {
  self.postMessage({ type: 'status', status });
}

// Send error to main thread
function sendError(error) {
  self.postMessage({ type: 'error', error: error.message || String(error) });
}

// Send transcription result to main thread
function sendResult(result) {
  self.postMessage({ type: 'result', result });
}

// Initialize the model
async function initializeModel() {
  if (transcriber || isModelLoading) return;
  
  isModelLoading = true;
  sendStatus('loading');
  
  try {
    // Try WebGPU first, fallback to WASM
    try {
      transcriber = await pipeline('automatic-speech-recognition', MODEL_NAME, MODEL_OPTIONS);
    } catch (webgpuError) {
      console.warn('WebGPU not available, falling back to WASM:', webgpuError);
      transcriber = await pipeline('automatic-speech-recognition', MODEL_NAME, {
        device: 'wasm',
        dtype: 'q8'
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

// Convert audio blob to float32 array
async function audioBlobToFloat32Array(arrayBuffer) {
  try {
    // Create audio context
    const audioContext = new (self.AudioContext || self.webkitAudioContext)({
      sampleRate: 16000  // Whisper expects 16kHz
    });
    
    // Decode audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get the first channel and convert to float32
    const channelData = audioBuffer.getChannelData(0);
    
    // Resample to 16kHz if necessary
    if (audioBuffer.sampleRate !== 16000) {
      const ratio = 16000 / audioBuffer.sampleRate;
      const newLength = Math.round(channelData.length * ratio);
      const resampled = new Float32Array(newLength);
      
      for (let i = 0; i < newLength; i++) {
        const index = i / ratio;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        
        if (upper >= channelData.length) {
          resampled[i] = channelData[lower];
        } else {
          resampled[i] = channelData[lower] * (1 - weight) + channelData[upper] * weight;
        }
      }
      
      return resampled;
    }
    
    return channelData;
  } catch (error) {
    throw new Error(`Audio conversion failed: ${error.message}`);
  }
}

// Transcribe audio
async function transcribeAudio(audioData) {
  if (!transcriber) {
    throw new Error('Model not initialized');
  }
  
  try {
    // Convert audio data to format expected by Whisper
    const audioArray = await audioBlobToFloat32Array(audioData);
    
    // Run inference
    const result = await transcriber(audioArray, {
      language: 'english',
      task: 'transcribe',
      return_timestamps: false
    });
    
    return result.text || '';
  } catch (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

// Handle messages from main thread
self.onmessage = async (e) => {
  const { type, audioData } = e.data;
  
  if (type === 'init') {
    await initializeModel();
  } else if (type === 'transcribe') {
    try {
      if (!transcriber) {
        await initializeModel();
      }
      
      const text = await transcribeAudio(audioData);
      sendResult(text);
    } catch (error) {
      sendError(error);
    }
  }
};

// Auto-initialize when worker loads
initializeModel();
