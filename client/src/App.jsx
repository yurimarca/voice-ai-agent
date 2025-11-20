import { useState } from 'react';
import VoiceAgent from './components/VoiceAgent';
import SystemPromptInput from './components/SystemPromptInput';
import BrowserCheck from './components/BrowserCheck';

function App() {
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful voice assistant. Respond naturally and conversationally.'
  );
  const [voice, setVoice] = useState('alloy');
  const [isPromptVisible, setIsPromptVisible] = useState(true);

  return (
    <BrowserCheck>
      <div className="flex flex-col min-h-screen">
        <header className="bg-gradient-to-br from-primary to-blue-700 text-white py-8 shadow-custom-lg">
          <div className="container">
            <h1 className="text-4xl md:text-2xl mb-2 font-bold">AI Voice Agent</h1>
            <p className="text-lg md:text-base opacity-90 font-normal">Real-time voice conversation powered by OpenAI</p>
          </div>
        </header>

        <main className="flex-1 py-8">
          <div className="container">
            <div className="flex flex-col gap-8">
              <div className="bg-surface rounded-xl p-6 shadow-custom border border-border">
                <button
                  className="bg-none text-text-primary text-base font-semibold py-2 flex items-center gap-2 w-full text-left transition-colors duration-200 hover:text-primary"
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

        <footer className="bg-surface border-t border-border py-6 mt-8 text-center text-text-secondary text-sm">
          <div className="container">
            <p>Built with OpenAI Realtime API</p>
          </div>
        </footer>
      </div>
    </BrowserCheck>
  );
}

export default App;

