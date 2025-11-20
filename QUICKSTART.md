# Quick Start Guide

Get your AI Voice Agent running in 5 minutes!

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed (for React frontend)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Modern browser (Chrome, Firefox, or Edge)

## Setup Steps

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
pip install -r requirements.txt

# Install client dependencies
cd ../client
npm install
```

### 2. Configure OpenAI API Key

```bash
# In the server directory
cd ../server
touch .env
```

Edit `server/.env` and add your API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
```

### 3. Start the Application

**Terminal 1 - Server:**
```bash
cd server
python main.py
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### 4. Open Your Browser

Navigate to: `http://localhost:3000`

## First Conversation

1. Click **"Start Conversation"** button
2. Allow microphone access when prompted
3. Start speaking naturally
4. The AI will respond with voice
5. Continue the conversation naturally
6. Click **"Stop Conversation"** when done

## Customize AI Behavior

1. Expand **"System Prompt Configuration"**
2. Choose an example prompt or write your own
3. Click **"Apply Changes"**
4. Start a new conversation to see the changes

## Troubleshooting

**Can't connect?**
- Check that both server and client are running
- Server should show: "Server running on port 3001"
- Client should open automatically at localhost:3000
- Ensure Python dependencies are installed: `pip install -r requirements.txt`

**Microphone issues?**
- Click the microphone icon in your browser's address bar
- Grant permission and refresh the page

**OpenAI errors?**
- Verify your API key is correct
- Check you have available credits
- Ensure your account has Realtime API access

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Experiment with different system prompts
- Monitor your usage on [OpenAI Dashboard](https://platform.openai.com/usage)

---

Enjoy your AI Voice Agent! 🎤🤖

