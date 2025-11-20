# AI Voice Agent Backend

Python FastAPI backend for the AI Voice Agent application with OpenAI Realtime API integration.

## Features

- 🚀 **FastAPI**: Modern Python web framework with automatic API documentation
- 🔄 **Async/Await**: Full async support with asyncio for better performance
- 🌐 **WebSocket Relay**: Secure relay between client and OpenAI Realtime API
- 💰 **Cost Tracking**: Real-time token usage and cost calculation
- 📝 **Type Safety**: Pydantic models for request/response validation
- 🏥 **Health Monitoring**: Connection health checks and automatic reconnection

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager
- OpenAI API key with Realtime API access

### Setup

1. **Install dependencies:**
   
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   
   ```bash
   # Create and configure .env file:
   OPENAI_API_KEY=your_openai_api_key_here## Running the Server
   ```

### Development Mode

```bash
# Option 1: Direct uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 3001

# Option 2: Using Python
python main.py

# Option 3: Using startup script
python start.py
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 3001 --workers 1
```

## API Endpoints

### HTTP Endpoints

- `GET /health` - Health check endpoint
- `GET /model-info` - OpenAI model configuration info
- `GET /docs` - Interactive API documentation (FastAPI auto-generated)

### WebSocket Endpoint

- `WS /ws` - Main WebSocket endpoint for client connections

## Architecture

```
┌──────────┐      WebSocket      ┌──────────────┐      WebSocket      ┌─────────────┐
│  React   │ ←─────────────────→ │  FastAPI     │ ←─────────────────→ │   OpenAI    │
│  Client  │   (localhost:3000)  │  Server      │   (Secure relay)    │  Realtime   │
└──────────┘                     └──────────────┘                     └─────────────┘
                                       ↓
                                 ┌──────────────┐
                                 │   asyncio    │
                                 │ Event Loop   │
                                 └──────────────┘
```

## Key Components

### `main.py`

- FastAPI application setup
- WebSocket endpoint implementation
- Client connection management
- HTTP route definitions

### `services/openai_relay.py`

- OpenAI WebSocket client
- Message routing and queueing
- Connection management and reconnection logic
- Cost tracking integration

### `models/`

- `websocket.py` - WebSocket message type definitions
- `cost.py` - Cost calculation and session tracking

## Message Flow

1. **Client connects** to `/ws` endpoint
2. **Server establishes** WebSocket connection to OpenAI Realtime API
3. **Messages flow** bidirectionally: Client ↔ FastAPI ↔ OpenAI
4. **Cost tracking** monitors token usage in real-time
5. **Health monitoring** maintains connection integrity

## Key Features

### Technical Advantages

- **Modern async/await syntax** for clean concurrent programming
- **Type safety** with Pydantic models for robust data validation
- **Automatic API docs** at `/docs` endpoint for easy development
- **Structured architecture** with separate services and models
- **Enhanced error handling** with Python's exception system

### Compatibility

- **WebSocket protocol** compatible with standard WebSocket clients
- **Standard message formats** for easy integration
- **Environment-based configuration** with .env file support
- **RESTful API endpoints** for health checks and configuration

## Development Notes

### Adding New Features

1. Define message types in `models/websocket.py`
2. Add business logic to appropriate service
3. Update WebSocket handler in `main.py`
4. FastAPI automatically updates `/docs` with new endpoints

### Cost Calculation

Cost tracking is handled by the `SessionCostTracker` class:

- Tracks incremental token usage to avoid double counting
- Calculates costs based on OpenAI's token-based pricing
- Sends real-time updates to client

### Connection Management

- Automatic reconnection on connection loss
- Message queueing during connection establishment
- Proper cleanup on client disconnect
- Heartbeat monitoring for connection health

## Troubleshooting

### Common Issues

**Import Errors:**

```bash
# Ensure you're in the correct directory
cd server
# Install missing dependencies
pip install -r requirements.txt
```

**WebSocket Connection Issues:**

- Check that OpenAI API key is valid
- Verify network connectivity
- Check server logs for detailed error messages

**Port Conflicts:**

- Ensure port 3001 is not in use by other applications
- Change PORT in .env file if needed

## Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test model info endpoint  
curl http://localhost:3001/model-info

# View API documentation
open http://localhost:3001/docs
```

## Frontend Integration

To connect your frontend application:

1. **Start the Python server** as described above
2. **Connect to WebSocket endpoint** at `ws://localhost:3001/ws`
3. **Use HTTP endpoints** for health checks and configuration
4. **View API documentation** at `http://localhost:3001/docs`