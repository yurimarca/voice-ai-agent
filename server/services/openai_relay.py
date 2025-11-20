import asyncio
import json
import logging
import websockets
from typing import Optional, Dict, Any, Callable
from websockets.exceptions import ConnectionClosed, WebSocketException

from models.cost import SessionCostTracker
from models.websocket import MessageType

logger = logging.getLogger(__name__)


class OpenAIRelay:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.message_queue = asyncio.Queue()
        self.cost_tracker = SessionCostTracker()
        self.is_connecting = False
        self.is_intentional_disconnect = False
        
    async def connect(self):
        """Establish connection to OpenAI Realtime API"""
        if self.is_connecting:
            return
            
        self.is_connecting = True
        try:
            url = "wss://api.openai.com/v1/realtime?model=gpt-realtime"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "OpenAI-Beta": "realtime=v1"
            }
            
            self.websocket = await websockets.connect(url, extra_headers=headers)
            self.is_connecting = False
            self.is_intentional_disconnect = False
            logger.info("Connected to OpenAI Realtime API")
            
            # Process any queued messages
            await self._process_queued_messages()
            
        except Exception as e:
            self.is_connecting = False
            logger.error(f"Failed to connect to OpenAI: {e}")
            raise
    
    async def disconnect(self, intentional: bool = False):
        """Close connection to OpenAI API"""
        self.is_intentional_disconnect = intentional
        if self.websocket and not self.websocket.closed:
            await self.websocket.close()
            logger.info("Disconnected from OpenAI Realtime API")
        self.websocket = None
    
    async def send_message(self, message: str):
        """Send message to OpenAI API, queue if not connected"""
        if self.websocket and not self.websocket.closed:
            await self.websocket.send(message)
        elif not self.is_connecting:
            # Queue message if we're not connected and not currently connecting
            logger.info("Queueing message while establishing OpenAI connection")
            await self.message_queue.put(message)
        else:
            # Queue if we're connecting
            await self.message_queue.put(message)
    
    async def _process_queued_messages(self):
        """Process all queued messages once connected"""
        message_count = self.message_queue.qsize()
        logger.info(f"Processing {message_count} queued messages")
        
        while not self.message_queue.empty() and self.websocket and not self.websocket.closed:
            message = await self.message_queue.get()
            await self.websocket.send(message)
    
    async def listen_for_messages(self, message_handler: Callable[[Dict[str, Any]], None]):
        """Listen for messages from OpenAI and handle them"""
        if not self.websocket:
            raise RuntimeError("Not connected to OpenAI API")
        
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    await self._handle_openai_message(data, message_handler)
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing OpenAI message: {e}")
                    # Still forward the raw message
                    await message_handler({"type": "raw", "data": message})
        except ConnectionClosed:
            logger.info("OpenAI WebSocket connection closed")
        except WebSocketException as e:
            logger.error(f"OpenAI WebSocket error: {e}")
        finally:
            self.websocket = None
    
    async def _handle_openai_message(self, message: Dict[str, Any], message_handler: Callable):
        """Handle specific OpenAI message types"""
        message_type = message.get("type")
        
        if message_type == "error":
            logger.error(f"OpenAI Error: {message}")
        elif message_type == "session.created":
            logger.info(f"🔧 Session Created - Model: {message.get('session', {}).get('model', 'Unknown')}")
            logger.info(f"🔧 Session ID: {message.get('session', {}).get('id', 'Unknown')}")
            logger.info(f"🔧 Full Session Info: {json.dumps(message.get('session'), indent=2)}")
            
            # Reset cost tracking for new session
            self.cost_tracker.reset()
            logger.info("💰 Cost tracking reset for new session")
            
        elif message_type == "response.done":
            logger.info(f"✅ Response Done - Usage: {json.dumps(message.get('response', {}).get('usage'), indent=2)}")
            
            # Calculate and track cost
            response_usage = message.get("response", {}).get("usage")
            if response_usage:
                incremental_cost = self.cost_tracker.update_from_usage(response_usage)
                logger.info(f"💰 Cost Update - Incremental: ${incremental_cost:.6f}, Total: ${self.cost_tracker.session_cost:.6f}")
                
                # Send cost update through handler
                cost_update = {
                    "type": "cost.update",
                    "cost": self.cost_tracker.get_cost_data()
                }
                await message_handler(cost_update)
            
            logger.info(f"OpenAI Event: {message_type}")
            
        elif message_type == "conversation.item.created":
            logger.info(f"OpenAI Event: {message_type}")
        elif message_type == "response.created":
            logger.info(f"🎯 Response Created - Model: {message.get('response', {}).get('model', 'Unknown')}")
        
        # Forward all messages to client
        await message_handler(message)
    
    @property
    def is_connected(self) -> bool:
        """Check if currently connected to OpenAI API"""
        return self.websocket is not None and not self.websocket.closed
    
    async def reconnect_if_needed(self) -> bool:
        """Reconnect if connection was lost unintentionally"""
        if not self.is_connected and not self.is_intentional_disconnect:
            logger.info("Re-establishing OpenAI connection...")
            try:
                await self.connect()
                return True
            except Exception as e:
                logger.error(f"Failed to reconnect to OpenAI: {e}")
                return False
        return False