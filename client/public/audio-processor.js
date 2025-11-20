/**
 * AudioWorklet processor for capturing and processing audio data
 * This replaces the deprecated ScriptProcessorNode
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    // If no input, return true to keep processor alive
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0];

    // Accumulate samples in buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Send a copy of the buffer
        this.port.postMessage({
          audioData: this.buffer.slice(0, this.bufferSize),
        });
        
        // Reset buffer
        this.bufferIndex = 0;
      }
    }

    // Keep the processor alive
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);

