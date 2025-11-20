import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import CostDisplay from './CostDisplay';

const WS_URL = 'ws://localhost:3001/ws';

function VoiceAgent({ systemPrompt, voice = 'alloy' }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [conversationItems, setConversationItems] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, listening, thinking, speaking
  const [conversationCost, setConversationCost] = useState({
    total: 0,
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0
  });

  const wsRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const conversationEndRef = useRef(null);
  const openaiConnectedRef = useRef(false);

  const {
    isRecording,
    error: audioError,
    startRecording,
    stopRecording,
    playAudio,
    clearAudioQueue,
  } = useWebRTC();

  /**
   * Handle audio data from microphone
   */
  const handleAudioData = useCallback((base64Audio) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      }));
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      sessionStartedRef.current = false;
      openaiConnectedRef.current = false; // Reset on new connection
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      wsRef.current = null;
    };
  }, []);

  /**
   * Handle messages from server/OpenAI
   */
  const handleServerMessage = useCallback((message) => {
    console.log('Received:', message.type);

    switch (message.type) {
      case 'connection.established':
        console.log('Connected to OpenAI API');
        openaiConnectedRef.current = true;
        break;

      case 'session.created':
      case 'session.updated':
        console.log('Session ready');
        sessionStartedRef.current = true;
        break;

      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        setAgentStatus('listening');
        setCurrentTranscript('🎤 Listening to you...');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        setAgentStatus('thinking');
        setCurrentTranscript('💭 Processing your speech...');
        break;

      case 'conversation.item.created':
        if (message.item) {
          handleConversationItem(message.item);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcription completed
        if (message.transcript) {
          console.log('User said:', message.transcript);
          addConversationItem('user', message.transcript);
        }
        break;

      case 'conversation.item.input_audio_transcription.failed':
        console.error('Transcription failed:', message);
        break;

      case 'response.audio.delta':
        if (message.delta) {
          playAudio(message.delta);
          setAgentStatus('speaking');
        }
        break;

      case 'response.audio_transcript.delta':
        if (message.delta) {
          setCurrentTranscript((prev) => {
            // If it's the first delta, clear the "Processing..." message
            if (prev === '💭 Processing your speech...' || prev === 'Processing...') {
              return message.delta;
            }
            return prev + message.delta;
          });
        }
        break;

      case 'response.audio_transcript.done':
        // Assistant speech transcription completed
        if (message.transcript) {
          console.log('Assistant said:', message.transcript);
          addConversationItem('assistant', message.transcript);
        }
        break;

      case 'response.done':
        setAgentStatus('idle');
        setCurrentTranscript('');
        break;

      case 'cost.update':
        if (message.cost) {
          setConversationCost(message.cost);
        }
        break;

      case 'error':
        console.error('Server error:', message);
        setConnectionStatus('error');
        break;
    }
  }, [playAudio]);

  /**
   * Handle conversation items from OpenAI
   */
  const handleConversationItem = useCallback((item) => {
    console.log('Conversation item created:', item.type, item.role);
    
    if (item.type === 'message') {
      const role = item.role;
      const content = item.content?.[0];

      // Handle text content
      if (content?.type === 'text' && content.text) {
        addConversationItem(role, content.text);
      }
      
      // Handle audio content with transcript
      if (content?.type === 'audio' && content.transcript) {
        addConversationItem(role, content.transcript);
      }
      
      // Fallback: handle transcript directly in content
      if (content?.transcript) {
        addConversationItem(role, content.transcript);
      }
    }
  }, []);

  /**
   * Add item to conversation history
   */
  const addConversationItem = useCallback((role, text) => {
    if (!text || text.trim().length === 0) {
      return; // Don't add empty messages
    }
    
    // Check if this exact message was just added (prevent duplicates)
    setConversationItems((prev) => {
      const lastItem = prev[prev.length - 1];
      if (lastItem && lastItem.role === role && lastItem.text === text) {
        return prev; // Skip duplicate
      }
      
      return [...prev, {
        role,
        text,
        timestamp: new Date(),
      }];
    });
  }, []);

  /**
   * Start conversation session
   */
  const startConversation = async () => {
    // Clear conversation history and cost tracking for new session
    setConversationItems([]);
    setConversationCost({
      total: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0
    });

    // Always establish a fresh WebSocket connection for new conversations
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }

    // Establish new connection
    connectWebSocket();

    // Wait for both WebSocket and OpenAI connection to be ready
    const maxWaitTime = 5000; // 5 seconds max
    const startTime = Date.now();
    
    while ((!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !openaiConnectedRef.current) 
           && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket connection failed');
      setConnectionStatus('error');
      return;
    }

    if (!openaiConnectedRef.current) {
      console.warn('OpenAI connection not confirmed, but proceeding...');
    }

    // Configure session with system prompt and selected voice
    wsRef.current.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: systemPrompt,
        voice: voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    }));

    // Start recording
    await startRecording(handleAudioData);
    setAgentStatus('listening');
  };

  /**
   * Stop conversation session
   */
  const stopConversation = () => {
    stopRecording();
    clearAudioQueue();
    setAgentStatus('idle');
    setCurrentTranscript('');

    // Send disconnect signal to server to close OpenAI session, then close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'session.disconnect'
      }));
      console.log('Sent session disconnect signal to server');
      
      // Close the WebSocket connection after sending disconnect signal
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.close();
          console.log('Closed client WebSocket connection');
        }
      }, 100); // Small delay to ensure disconnect message is sent
    }
  };

  /**
   * Scroll to bottom of conversation
   */
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationItems, currentTranscript]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopRecording();
      clearAudioQueue();
    };
  }, [stopRecording, clearAudioQueue]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface border border-border rounded-xl p-6 shadow-custom flex flex-col items-center gap-4">
        <div className="flex gap-4 flex-wrap justify-center w-full">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-background border ${
            connectionStatus === 'connected' ? 'bg-success/10 border-success text-success' :
            connectionStatus === 'connecting' ? 'bg-primary/10 border-primary text-primary' :
            connectionStatus === 'error' ? 'bg-danger/10 border-danger text-danger' :
            'bg-danger/10 border-danger text-danger'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse-slow ${
              connectionStatus === 'connected' ? 'bg-success' :
              connectionStatus === 'connecting' ? 'bg-primary' :
              'bg-danger'
            }`}></span>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
          </div>
          
          {isRecording && (
            <div className={`px-4 py-2 rounded-full text-sm font-medium bg-background border ${
              agentStatus === 'listening' ? 'bg-primary/10 border-primary text-primary' :
              agentStatus === 'thinking' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-700' :
              agentStatus === 'speaking' ? 'bg-success/10 border-success text-success' :
              'bg-gray-100 border-border text-text-primary'
            }`}>
              {agentStatus === 'listening' && '🎤 Listening'}
              {agentStatus === 'thinking' && '💭 Thinking'}
              {agentStatus === 'speaking' && '🔊 Speaking'}
              {agentStatus === 'idle' && '⏸️ Ready'}
            </div>
          )}
        </div>

        <button
          className={`flex items-center justify-center gap-3 px-10 py-4 text-lg font-semibold rounded-full text-white transition-all duration-300 min-w-[250px] md:min-w-auto md:w-full ${
            isRecording
              ? 'bg-danger hover:bg-danger/90 animate-recording-pulse'
              : connectionStatus === 'connecting'
              ? 'bg-secondary cursor-not-allowed'
              : 'bg-success hover:bg-success/90 hover:-translate-y-0.5 hover:shadow-custom-lg'
          }`}
          onClick={isRecording ? stopConversation : startConversation}
          disabled={connectionStatus === 'connecting'}
        >
          {isRecording ? (
            <>
              <span className="text-xl">⏹</span>
              Stop Conversation
            </>
          ) : (
            <>
              <span className="text-xl">▶</span>
              Start Conversation
            </>
          )}
        </button>

        {audioError && (
          <div className="px-3 py-3 bg-danger/10 text-danger rounded-lg border border-danger text-sm text-center">
            <strong>Error:</strong> {audioError}
          </div>
        )}
      </div>

      <CostDisplay cost={conversationCost} />

      <div className="bg-surface rounded-xl shadow-custom border border-border overflow-hidden flex flex-col max-h-[600px] md:max-h-[500px]">
        <div className="px-6 py-4 bg-background border-b border-border flex justify-between items-center">
          <h3 className="m-0 text-lg font-semibold text-text-primary">Conversation</h3>
          {conversationItems.length > 0 && (
            <button
              className="bg-transparent text-danger px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:bg-danger/10"
              onClick={() => {
                setConversationItems([]);
                setConversationCost({
                  total: 0,
                  inputTokens: 0,
                  outputTokens: 0,
                  cachedTokens: 0
                });
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {conversationItems.length === 0 && !currentTranscript && (
            <div className="text-center py-12 px-4 text-text-secondary">
              <p className="mb-2">Click "Start Conversation" to begin talking with the AI voice agent.</p>
              <p className="text-sm text-text-secondary">The AI will listen, process your speech, and respond with voice.</p>
            </div>
          )}

          {conversationItems.map((item, index) => (
            <div key={index} className={`p-4 rounded-xl max-w-[80%] md:max-w-[90%] animate-slide-in ${
              item.role === 'user'
                ? 'self-end bg-primary/10 border border-primary'
                : 'self-start bg-background border border-border'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-text-primary">
                  {item.role === 'user' ? '👤 You' : '🤖 Assistant'}
                </span>
                <span className="text-xs text-text-secondary">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-text-primary leading-6 break-words">{item.text}</div>
            </div>
          ))}

          {currentTranscript && (
            <div className={`p-4 rounded-xl max-w-[80%] md:max-w-[90%] opacity-80 animate-fade-in ${
              agentStatus === 'listening' ? 'self-end bg-primary/10 border border-primary' : 'self-start bg-background border border-border'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-text-primary">
                  {agentStatus === 'listening' || agentStatus === 'thinking' ? '👤 You' : '🤖 Assistant'}
                </span>
              </div>
              <div className="text-text-primary leading-6 break-words">{currentTranscript}</div>
            </div>
          )}

          <div ref={conversationEndRef} />
        </div>
      </div>
    </div>
  );
}

export default VoiceAgent;

