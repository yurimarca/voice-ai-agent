import { useState } from 'react';

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
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="system-prompt" className="font-semibold text-base text-text-primary">Customize AI Behavior</label>
        <button
          type="button"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? 'Hide' : 'Show'} Examples
        </button>
      </div>

      {showExamples && (
        <div className="bg-background border border-border rounded-lg p-4 mb-2">
          <p className="font-semibold mb-3 text-text-primary">Example Prompts:</p>
          {EXAMPLE_PROMPTS.map((example, index) => (
            <div key={index} className="flex gap-4 items-start p-3 bg-white border border-border rounded-md mb-2 last:mb-0 transition-colors hover:border-primary">
              <div className="flex-1">
                <strong className="block mb-1 text-text-primary">{example.name}</strong>
                <p className="text-sm text-text-secondary m-0">{example.prompt}</p>
              </div>
              <button
                className="bg-secondary text-white px-3.5 py-1.5 rounded text-sm font-medium whitespace-nowrap hover:bg-slate-700 transition-colors"
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
        className="w-full px-3 py-3 border-2 border-border rounded-lg text-[15px] resize-y min-h-[100px] transition-colors focus:border-primary focus:outline-none"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        placeholder="Enter system prompt to guide the AI's behavior..."
        rows={4}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="voice-select" className="font-semibold text-[15px] text-text-primary flex items-center gap-2">
          🔊 Voice Selection
        </label>
        <select
          id="voice-select"
          className="w-full px-3 py-3 border-2 border-border rounded-lg text-[15px] bg-white cursor-pointer transition-colors hover:border-primary focus:border-primary focus:outline-none"
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

      <div className="flex justify-between items-center md:flex-col md:gap-3 md:items-stretch">
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">{tempValue.length} characters</span>
        </div>
        <button
          className="bg-success text-white px-6 py-2.5 rounded-md font-semibold text-[15px] transition-all duration-200 hover:bg-emerald-600 hover:-translate-y-px disabled:bg-secondary disabled:cursor-not-allowed md:w-full"
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

