import { useState } from 'react';
import './SystemPromptInput.css';

const EXAMPLE_PROMPTS = [
  {
    name: 'General Assistant',
    prompt: 'You are a helpful voice assistant. Respond naturally and conversationally.'
  },
  {
    name: 'Friendly Companion',
    prompt: 'You are a warm, friendly companion who loves to chat. Be enthusiastic and encouraging in your responses.'
  },
  {
    name: 'Professional Advisor',
    prompt: 'You are a professional advisor providing thoughtful guidance. Be clear, concise, and constructive in your responses.'
  },
  {
    name: 'Creative Partner',
    prompt: 'You are a creative brainstorming partner. Help explore ideas with imagination and enthusiasm.'
  },
  {
    name: 'Teacher',
    prompt: 'You are a patient and knowledgeable teacher. Explain concepts clearly and check for understanding.'
  }
];

const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'ash', name: 'Ash', description: 'Clear and articulate' },
  { id: 'ballad', name: 'Ballad', description: 'Smooth and melodic' },
  { id: 'coral', name: 'Coral', description: 'Warm and vibrant' },
  { id: 'echo', name: 'Echo', description: 'Friendly and conversational' },
  { id: 'sage', name: 'Sage', description: 'Calm and measured' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' },
  { id: 'verse', name: 'Verse', description: 'Expressive and dynamic' },
  { id: 'marin', name: 'Marin', description: 'Bright and engaging' },
  { id: 'cedar', name: 'Cedar', description: 'Deep and grounded' }
];

function SystemPromptInput({ value, onChange, voice, onVoiceChange }) {
  const [tempValue, setTempValue] = useState(value);
  const [tempVoice, setTempVoice] = useState(voice);
  const [showExamples, setShowExamples] = useState(false);

  const handleSave = () => {
    onChange(tempValue);
    onVoiceChange(tempVoice);
  };

  const handleUseExample = (prompt) => {
    setTempValue(prompt);
    onChange(prompt);
    setShowExamples(false);
  };

  return (
    <div className="system-prompt-input">
      <div className="prompt-header">
        <label htmlFor="system-prompt">Customize AI Behavior</label>
        <button
          type="button"
          className="examples-btn"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? 'Hide' : 'Show'} Examples
        </button>
      </div>

      {showExamples && (
        <div className="examples-list">
          <p className="examples-title">Example Prompts:</p>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <div key={index} className="example-item">
              <div className="example-content">
                <strong>{example.name}</strong>
                <p>{example.prompt}</p>
              </div>
              <button
                className="use-btn"
                onClick={() => handleUseExample(example.prompt)}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        id="system-prompt"
        className="prompt-textarea"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        placeholder="Enter system prompt to guide the AI's behavior..."
        rows={4}
      />

      <div className="voice-selector-section">
        <label htmlFor="voice-select" className="voice-label">
          🔊 Voice Selection
        </label>
        <select
          id="voice-select"
          className="voice-select"
          value={tempVoice}
          onChange={(e) => setTempVoice(e.target.value)}
        >
          {AVAILABLE_VOICES.map((voiceOption) => (
            <option key={voiceOption.id} value={voiceOption.id}>
              {voiceOption.name} - {voiceOption.description}
            </option>
          ))}
        </select>
      </div>

      <div className="prompt-actions">
        <div className="prompt-info">
          <span className="char-count">{tempValue.length} characters</span>
        </div>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={tempValue === value && tempVoice === voice}
        >
          {tempValue === value && tempVoice === voice ? 'Saved ✓' : 'Apply Changes'}
        </button>
      </div>

    </div>
  );
}

export default SystemPromptInput;

