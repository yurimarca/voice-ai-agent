# Voice AI Agent with OpenAI Realtime API

A real-time voice conversation application built with React and Python FastAPI that connects to OpenAI's Realtime API for speech-to-speech interactions. Features continuous conversation flow with user-configurable system prompts.

## Features

- 🎤 **Real-time Speech Recognition**: Capture and transcribe speech using WebRTC and OpenAI's Realtime API
- 🔊 **Natural Voice Responses**: Get AI responses in natural-sounding voice
- 💬 **Continuous Conversation**: Keep talking without pressing buttons between exchanges
- ⚙️ **Configurable AI Behavior**: Customize the AI's personality and behavior with system prompts
- 🔒 **Secure Architecture**: API keys kept safe on the server side with relay pattern
- 🎨 **Clean Modern UI**: Simple, intuitive interface focused on the conversation experience
- 📝 **Full Conversation Transcript**: View both your speech and AI responses with timestamps in real-time

## Architecture

The application consists of three main components:

1. **Frontend (React + Vite)**: Handles WebRTC audio capture, UI, and playback
2. **Backend (Python + FastAPI)**: Async relay server managing WebSocket connections to OpenAI
3. **OpenAI Realtime API**: Processes speech and generates voice responses using `gpt-realtime`

```
┌──────────┐      WebSocket      ┌──────────────┐      WebSocket      ┌─────────────┐
│  React   │ ←─────────────────→ │  FastAPI     │ ←─────────────────→ │   OpenAI    │
│  Client  │   (localhost:3000)  │  Server      │   (Secure relay)    │  Realtime   │
└──────────┘                     └──────────────┘                     └─────────────┘
    ↑                                   ↓                                      
    └─ WebRTC Audio Capture        asyncio Event Loop
```

## Prerequisites

- **Python** 3.8 or higher
- **pip** package manager
- **Node.js** 18.x or higher (for React frontend)
- **npm** or **yarn** (for React frontend)
- **OpenAI API Key** with access to Realtime API
  - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Modern Browser** (Chrome, Firefox, or Edge recommended)
  - Must support WebRTC and Web Audio API

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd voice-ai-agent
```

### 2. Install Server Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd ../server
touch .env
```

Edit `server/.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Never commit your `.env` file or expose your API key.

## Running the Application

### Development Mode

You need to run both the server and client in separate terminals.

#### Terminal 1 - Start the Server

```bash
cd server
python main.py
```

The server will start on `http://localhost:3001`

You can verify the server is running by visiting the health check endpoint: `http://localhost:3001/health`

#### Terminal 2 - Start the Client

```bash
cd client
npm run dev
```

The client will start on `http://localhost:3000`

### Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Usage

### Starting a Conversation

1. **Configure System Prompt and Voice** (Optional)
   
   - Click the "System Prompt Configuration" section
   - Choose an example prompt or write your own
   - Select your preferred AI voice from the dropdown
   - Click "Apply Changes"

2. **Start Talking**
   
   - Click the "Start Conversation" button
   - Allow microphone access when prompted
   - Start speaking naturally
   - The AI will listen, process, and respond with voice

3. **Watch the Conversation Unfold**
   
   - Your speech is transcribed and displayed in blue bubbles (👤 You)
   - AI responses appear in gray bubbles (🤖 Assistant)
   - All messages include timestamps
   - Live status indicators show: listening 🎤, thinking 💭, or speaking 🔊

4. **Continuous Conversation**
   
   - Keep talking after the AI responds
   - No need to press buttons between exchanges
   - The system uses voice activity detection (VAD)

5. **Stop Conversation**
   
   - Click the "Stop Conversation" button when done
   - Use "Clear" to remove conversation history

### System Prompt Examples

The application includes several pre-configured prompts:

- **General Assistant**: Helpful and conversational
- **Friendly Companion**: Warm and encouraging
- **Professional Advisor**: Clear and constructive guidance
- **Creative Partner**: Imaginative brainstorming
- **Teacher**: Patient explanations with understanding checks

You can also create custom prompts to define specific behaviors or personas.

## Project Structure

```
ai-voice-agent-openai/
├── server/
│   ├── main.py               # FastAPI server with WebSocket relay
│   ├── models/               # Pydantic models and message types
│   ├── services/             # Business logic and OpenAI integration
│   ├── requirements.txt      # Python dependencies
│   ├── start.py              # Startup script
│   └── .env                  # Environment variables
├── client/
│   ├── public/
│   │   ├── audio-processor.js        # AudioWorklet processor
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Main app component
│   │   ├── App.css           # App styles
│   │   ├── index.css         # Global styles
│   │   ├── components/
│   │   │   ├── VoiceAgent.jsx         # Main voice interface
│   │   │   ├── VoiceAgent.css
│   │   │   ├── SystemPromptInput.jsx  # Prompt configuration
│   │   │   ├── SystemPromptInput.css
│   │   │   ├── BrowserCheck.jsx       # Compatibility check
│   │   │   └── BrowserCheck.css
│   │   ├── hooks/
│   │   │   └── useWebRTC.js           # WebRTC audio handling
│   │   └── utils/
│   │       └── errorHandler.js        # Error handling utilities
│   ├── index.html            # HTML template
│   ├── vite.config.js        # Vite configuration
│   └── package.json          # Client dependencies
├── .gitignore
├── QUICKSTART.md
└── README.md
```

## Technical Details

### Backend Architecture

- **Framework**: FastAPI with async/await support
- **WebSocket**: Native FastAPI WebSocket implementation
- **Type Safety**: Pydantic models for all message types
- **Session Management**: Async connection handling and cleanup
- **Cost Tracking**: Real-time token usage calculation
- **Health Monitoring**: Automatic reconnection and heartbeat

### Audio Processing

- **Format**: PCM16 (16-bit Linear PCM)
- **Sample Rate**: 24kHz
- **Channels**: Mono
- **Processing**: Real-time conversion between Float32 and PCM16
- **Capture Method**: AudioWorklet (modern approach) with ScriptProcessorNode fallback for older browsers

### WebSocket Communication

The application uses WebSocket for bidirectional communication:

**Client → Server → OpenAI:**

- `session.update`: Configure AI behavior and settings
- `input_audio_buffer.append`: Stream audio chunks
- `session.disconnect`: Clean session termination

**OpenAI → Server → Client:**

- `response.output_audio.delta`: Receive audio response chunks
- `conversation.item.created`: Track conversation items
- `input_audio_buffer.speech_started/stopped`: Voice activity detection
- `response.done`: Response completion with usage data
- `cost.update`: Real-time cost tracking updates

### Voice Activity Detection (VAD)

Server-side VAD automatically detects:

- When you start speaking
- When you stop speaking
- Appropriate moments to generate responses

Configuration:

- Threshold: 0.5
- Prefix padding: 300ms
- Silence duration: 500ms

### Voice Settings

The application includes a voice selection UI in the System Prompt Configuration section. Available voices include:

- `alloy` - Neutral and balanced (default)
- `ash` - Clear and articulate
- `ballad` - Smooth and melodic
- `coral` - Warm and vibrant
- `echo` - Friendly and conversational
- `sage` - Calm and measured
- `shimmer` - Soft and gentle
- `verse` - Expressive and dynamic
- `marin` - Bright and engaging
- `cedar` - Deep and grounded

You can change the voice anytime from the UI. The new voice will take effect when you start the next conversation session.

## Troubleshooting

### Microphone Issues

**"Microphone access denied"**

- Check browser permissions for microphone
- Look for microphone icon in address bar
- On Windows: Check Windows Privacy Settings → Microphone

**"No microphone found"**

- Ensure microphone is connected
- Check system settings to verify device is recognized
- Try refreshing the page

**"Microphone already in use"**

- Close other applications using the microphone
- Close other browser tabs that might be using the microphone

### Connection Issues

**"Failed to connect to server"**

- Ensure the Python server is running on port 3001
- Check for firewall blocking local connections
- Verify the server started without errors
- Check Python dependencies are installed: `pip install -r requirements.txt`

**"Import/Module Errors"**

- Ensure you're in the correct directory: `cd server`
- Install missing Python dependencies: `pip install -r requirements.txt`
- Verify Python version is 3.8 or higher: `python --version`

**"OpenAI connection error"**

- Verify your API key is correct in `server/.env`
- Check that your OpenAI account has access to Realtime API
- Ensure you have available credits

### Audio Issues

**No audio playback from AI**

- Check browser audio is not muted
- Verify system volume is up
- Check browser console for audio errors
- Try using headphones instead of speakers

**Choppy or distorted audio**

- Check your internet connection
- Close other applications using significant bandwidth
- Try refreshing the page

## Security Considerations

- ✅ API keys are stored server-side only
- ✅ Client never receives or stores API keys
- ✅ CORS configured for local development
- ⚠️ For production: Configure proper CORS origins
- ⚠️ For production: Use HTTPS/WSS instead of HTTP/WS
- ⚠️ For production: Add rate limiting and authentication

## API Costs

OpenAI Realtime API pricing (as of October 2025):

**Current Model**: `gpt-realtime` (production model)

**Updated Audio Model Pricing** (token-based):

**gpt-realtime-audio** (standard):

- Audio Input: $40.00 per million tokens
- Audio Output: $160.00 per million tokens
- Cached Input: $4.00 per million tokens (90% discount)

**gpt-realtime-audio-mini** (cost-effective alternative):

- Audio Input: $6.00 per million tokens
- Audio Output: $24.00 per million tokens
- Cached Input: $0.60 per million tokens (90% discount)

**Note**: OpenAI has transitioned from per-minute to per-token pricing. Consider upgrading to the newer model versions for optimal performance and pricing. The mini variant offers significant cost savings while maintaining good quality.

Monitor your usage in the [OpenAI dashboard](https://platform.openai.com/usage).

## Future Enhancements

Potential improvements:

- [ ] Support for multiple languages
- [ ] Conversation export/save functionality
- [ ] Enhanced background noise cancellation
- [ ] Function calling / tool use integration

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check OpenAI's [Realtime API documentation](https://platform.openai.com/docs/guides/realtime)
- Review the [WebRTC documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
