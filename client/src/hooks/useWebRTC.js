import { useRef, useCallback, useState } from 'react';
import { getErrorMessage, logError } from '../utils/errorHandler';

/**
 * Custom hook for WebRTC audio capture and processing
 * Handles microphone access, audio conversion to PCM16 format, and audio playback
 */
export function useWebRTC() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const audioWorkletNodeRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const playbackContextRef = useRef(null);
  const nextPlayTimeRef = useRef(0);

  /**
   * Initialize audio context and request microphone access
   */
  const startRecording = useCallback(async (onAudioData) => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      audioContextRef.current = audioContext;

      // Create audio source from stream
      const source = audioContext.createMediaStreamSource(stream);

      try {
        // Try to use AudioWorklet (modern approach)
        await audioContext.audioWorklet.addModule('/audio-processor.js');
        
        const workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor');
        audioWorkletNodeRef.current = workletNode;

        workletNode.port.onmessage = (event) => {
          if (!onAudioData || !event.data.audioData) return;

          const inputData = event.data.audioData;
          
          // Convert Float32Array to Int16Array (PCM16)
          const pcm16 = float32ToPCM16(inputData);
          
          // Send as base64
          const base64Audio = arrayBufferToBase64(pcm16.buffer);
          onAudioData(base64Audio);
        };

        // Connect audio nodes
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
        
        console.log('Using AudioWorkletNode for audio processing');
      } catch (workletError) {
        // Fallback to ScriptProcessorNode if AudioWorklet fails
        console.warn('AudioWorklet not available, falling back to ScriptProcessorNode:', workletError);
        
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (!onAudioData) return;

          const inputData = event.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (PCM16)
          const pcm16 = float32ToPCM16(inputData);
          
          // Send as base64
          const base64Audio = arrayBufferToBase64(pcm16.buffer);
          onAudioData(base64Audio);
        };

        // Connect audio nodes
        source.connect(processor);
        processor.connect(audioContext.destination);
      }

      setIsRecording(true);
      return true;
    } catch (err) {
      logError('startRecording', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Stop recording and clean up resources
   */
  const stopRecording = useCallback(() => {
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current.port.close();
      audioWorkletNodeRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
  }, []);

  /**
   * Initialize playback context
   */
  const initPlaybackContext = useCallback(() => {
    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000,
      });
      nextPlayTimeRef.current = 0;
    }
  }, []);

  /**
   * Play audio response from base64 PCM16 data
   */
  const playAudio = useCallback(async (base64Audio) => {
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Initialize playback context if needed
      initPlaybackContext();
      
      const playbackContext = playbackContextRef.current;
      if (!playbackContext) return;

      // Convert PCM16 to Float32
      const pcm16Data = new Int16Array(bytes.buffer);
      const float32Data = pcm16ToFloat32(pcm16Data);

      // Create audio buffer
      const audioBuffer = playbackContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      // Create source
      const source = playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackContext.destination);

      // Schedule playback to start immediately after the previous chunk
      const currentTime = playbackContext.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);
      
      source.start(startTime);
      
      // Update next play time to ensure seamless playback
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
      
      isPlayingRef.current = true;

      // Cleanup: reset when we're done with all audio
      source.onended = () => {
        // Check if we've caught up to real-time (no more scheduled audio)
        if (playbackContext.currentTime >= nextPlayTimeRef.current - 0.1) {
          isPlayingRef.current = false;
        }
      };
    } catch (err) {
      logError('playAudio', err);
    }
  }, [initPlaybackContext]);

  /**
   * Clear audio playback queue and reset playback
   */
  const clearAudioQueue = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    
    // Close playback context to stop all scheduled audio
    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
  }, []);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    playAudio,
    clearAudioQueue,
  };
}

/**
 * Convert Float32Array to PCM16 (Int16Array)
 */
function float32ToPCM16(float32Array) {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values to [-1, 1]
    let val = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer
    pcm16[i] = val < 0 ? val * 0x8000 : val * 0x7fff;
  }
  return pcm16;
}

/**
 * Convert PCM16 (Int16Array) to Float32Array
 */
function pcm16ToFloat32(pcm16Array) {
  const float32 = new Float32Array(pcm16Array.length);
  for (let i = 0; i < pcm16Array.length; i++) {
    float32[i] = pcm16Array[i] / (pcm16Array[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

