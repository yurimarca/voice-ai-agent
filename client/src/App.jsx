import { useState } from 'react';
import VoiceAgent from './components/VoiceAgent';
import SystemPromptInput from './components/SystemPromptInput';
import BrowserCheck from './components/BrowserCheck';
import './App.css';

function App() {
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful voice assistant. Respond naturally and conversationally.'
  );
  const [voice, setVoice] = useState('alloy');
  const [isPromptVisible, setIsPromptVisible] = useState(true);

  return (
    <BrowserCheck>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1>AI Voice Agent</h1>
            <p className="subtitle">Real-time voice conversation powered by OpenAI</p>
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <div className="content-wrapper">
              <div className="prompt-section">
                <button
                  className="toggle-prompt-btn"
                  onClick={() => setIsPromptVisible(!isPromptVisible)}
                >
                  {isPromptVisible ? '▼' : '▶'} System Prompt Configuration
                </button>

                {isPromptVisible && (
                  <SystemPromptInput
                    value={systemPrompt}
                    onChange={setSystemPrompt}
                    voice={voice}
                    onVoiceChange={setVoice}
                  />
                )}
              </div>

              <VoiceAgent systemPrompt={systemPrompt} voice={voice} />
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>Built with OpenAI Realtime API</p>
          </div>
        </footer>
      </div>
    </BrowserCheck>
  );
}

export default App;

