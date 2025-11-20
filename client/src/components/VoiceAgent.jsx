import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import CostDisplay from './CostDisplay';
import './VoiceAgent.css';

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

    if (!isConnected) {
      connectWebSocket();
    }

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

    // Send disconnect signal to server to close OpenAI session
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'session.disconnect'
      }));
      console.log('Sent session disconnect signal to server');
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
    <div className="voice-agent">
      <div className="agent-controls">
        <div className="status-indicators">
          <div className={`status-badge ${connectionStatus}`}>
            <span className="status-dot"></span>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
          </div>
          
          {isRecording && (
            <div className={`agent-state ${agentStatus}`}>
              {agentStatus === 'listening' && '🎤 Listening'}
              {agentStatus === 'thinking' && '💭 Thinking'}
              {agentStatus === 'speaking' && '🔊 Speaking'}
              {agentStatus === 'idle' && '⏸️ Ready'}
            </div>
          )}
        </div>

        <button
          className={`main-control-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopConversation : startConversation}
          disabled={connectionStatus === 'connecting'}
        >
          {isRecording ? (
            <>
              <span className="btn-icon">⏹</span>
              Stop Conversation
            </>
          ) : (
            <>
              <span className="btn-icon">▶</span>
              Start Conversation
            </>
          )}
        </button>

        {audioError && (
          <div className="error-message">
            <strong>Error:</strong> {audioError}
          </div>
        )}
      </div>

      <CostDisplay cost={conversationCost} />

      <div className="conversation-container">
        <div className="conversation-header">
          <h3>Conversation</h3>
          {conversationItems.length > 0 && (
            <button
              className="clear-btn"
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

        <div className="conversation-transcript">
          {conversationItems.length === 0 && !currentTranscript && (
            <div className="empty-state">
              <p>Click "Start Conversation" to begin talking with the AI voice agent.</p>
              <p className="empty-state-hint">The AI will listen, process your speech, and respond with voice.</p>
            </div>
          )}

          {conversationItems.map((item, index) => (
            <div key={index} className={`conversation-item ${item.role}`}>
              <div className="item-header">
                <span className="item-role">
                  {item.role === 'user' ? '👤 You' : '🤖 Assistant'}
                </span>
                <span className="item-time">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="item-text">{item.text}</div>
            </div>
          ))}

          {currentTranscript && (
            <div className={`conversation-item ${agentStatus === 'listening' ? 'user' : 'assistant'} current`}>
              <div className="item-header">
                <span className="item-role">
                  {agentStatus === 'listening' || agentStatus === 'thinking' ? '👤 You' : '🤖 Assistant'}
                </span>
              </div>
              <div className="item-text">{currentTranscript}</div>
            </div>
          )}

          <div ref={conversationEndRef} />
        </div>
      </div>
    </div>
  );
}

export default VoiceAgent;

