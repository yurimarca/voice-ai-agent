import asyncio
import json
import logging
import os
from typing import Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from services.openai_relay import OpenAIRelay
from models.websocket import MessageType, ErrorMessage, ConnectionMessage

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment validation
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("PORT", 3001))

if not OPENAI_API_KEY:
    logger.error("ERROR: OPENAI_API_KEY is not set in environment variables")
    exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting WebSocket server...")
    yield
    logger.info("Shutting down server...")


# FastAPI app
app = FastAPI(
    title="AI Voice Agent Server",
    description="FastAPI relay server for OpenAI Realtime API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Server is running"}


@app.get("/model-info")
async def model_info():
    """Model information endpoint"""
    return {
        "configured_model": "gpt-realtime",
        "websocket_url": "wss://api.openai.com/v1/realtime?model=gpt-realtime",
        "api_version": "realtime=v1",
        "upgrade_date": "2024-11-04",
        "previous_model": "gpt-4o-realtime-preview-2024-10-01"
    }


class ClientConnection:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.openai_relay = OpenAIRelay(OPENAI_API_KEY)
        self.is_alive = True
        self.heartbeat_task = None
        
    async def start_heartbeat(self):
        """Start heartbeat monitoring"""
        self.heartbeat_task = asyncio.create_task(self._heartbeat_monitor())
    
    async def _heartbeat_monitor(self):
        """Monitor client connection with periodic pings"""
        try:
            while self.is_alive:
                await asyncio.sleep(30)  # 30 second intervals
                if self.websocket.client_state.value == 1:  # OPEN state
                    try:
                        await self.websocket.ping()
                    except Exception:
                        logger.info("Client connection lost during ping")
                        self.is_alive = False
                        break
        except asyncio.CancelledError:
            pass
    
    async def cleanup(self):
        """Clean up resources"""
        self.is_alive = False
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        await self.openai_relay.disconnect()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for client connections"""
    await websocket.accept()
    logger.info("Client connected")
    
    client = ClientConnection(websocket)
    
    try:
        # Start heartbeat monitoring
        await client.start_heartbeat()
        
        # Connect to OpenAI
        await client.openai_relay.connect()
        
        # Send connection established message
        connection_msg = ConnectionMessage(
            type=MessageType.CONNECTION_ESTABLISHED,
            message="Connected to OpenAI Realtime API"
        )
        await websocket.send_text(connection_msg.model_dump_json())
        
        # Start listening to OpenAI messages in background
        openai_task = asyncio.create_task(
            client.openai_relay.listen_for_messages(
                lambda msg: _send_to_client(websocket, msg)
            )
        )
        
        # Listen for client messages
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                await _handle_client_message(client, data)
                
        except WebSocketDisconnect:
            logger.info("Client disconnected")
        finally:
            # Cancel OpenAI listening task
            openai_task.cancel()
            try:
                await openai_task
            except asyncio.CancelledError:
                pass
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        error_msg = ErrorMessage(
            type=MessageType.ERROR,
            message="Server error",
            error=str(e)
        )
        try:
            await websocket.send_text(error_msg.model_dump_json())
        except:
            pass
    finally:
        await client.cleanup()


async def _handle_client_message(client: ClientConnection, data: str):
    """Handle incoming messages from client"""
    try:
        message = json.loads(data)
        message_type = message.get("type")
        
        # Log important message types
        if message_type == "session.update":
            instructions = message.get("session", {}).get("instructions", "")
            preview = instructions[:100] + "..." if len(instructions) > 100 else instructions
            logger.info(f"Session update: {preview}")
            
            # Reconnect if OpenAI connection was closed
            if not client.openai_relay.is_connected:
                await client.openai_relay.reconnect_if_needed()
                
        elif message_type == "response.create":
            logger.info("Response requested")
            
        elif message_type == "session.disconnect":
            logger.info("Client requested session disconnect")
            await client.openai_relay.disconnect(intentional=True)
            return  # Don't forward this message to OpenAI
        
        # Forward message to OpenAI
        if client.openai_relay.is_connected:
            await client.openai_relay.send_message(data)
        else:
            logger.error("OpenAI WebSocket not available")
            error_msg = ErrorMessage(
                type=MessageType.ERROR,
                message="OpenAI connection not available"
            )
            await client.websocket.send_text(error_msg.model_dump_json())
            
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing client message: {e}")
        error_msg = ErrorMessage(
            type=MessageType.ERROR,
            message="Error parsing message",
            error=str(e)
        )
        await client.websocket.send_text(error_msg.model_dump_json())
    except Exception as e:
        logger.error(f"Error processing client message: {e}")
        error_msg = ErrorMessage(
            type=MessageType.ERROR,
            message="Error processing message", 
            error=str(e)
        )
        await client.websocket.send_text(error_msg.model_dump_json())


async def _send_to_client(websocket: WebSocket, message: Dict[str, Any]):
    """Send message to client WebSocket"""
    try:
        if isinstance(message, dict):
            await websocket.send_text(json.dumps(message))
        else:
            await websocket.send_text(str(message))
    except Exception as e:
        logger.error(f"Error sending message to client: {e}")


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Server running on port {PORT}")
    logger.info("WebSocket server ready for connections")
    logger.info(f"Health check: http://localhost:{PORT}/health")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=True,
        log_level="info"
    )