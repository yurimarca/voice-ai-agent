from pydantic import BaseModel
from typing import Optional, Any, Dict
from enum import Enum


class MessageType(str, Enum):
    SESSION_UPDATE = "session.update"
    SESSION_CREATED = "session.created"
    SESSION_DISCONNECT = "session.disconnect"
    RESPONSE_CREATE = "response.create"
    RESPONSE_DONE = "response.done"
    RESPONSE_CREATED = "response.created"
    INPUT_AUDIO_BUFFER_APPEND = "input_audio_buffer.append"
    INPUT_AUDIO_BUFFER_SPEECH_STARTED = "input_audio_buffer.speech_started"
    INPUT_AUDIO_BUFFER_SPEECH_STOPPED = "input_audio_buffer.speech_stopped"
    RESPONSE_AUDIO_DELTA = "response.audio.delta"
    CONVERSATION_ITEM_CREATED = "conversation.item.created"
    CONNECTION_ESTABLISHED = "connection.established"
    CONNECTION_CLOSED = "connection.closed"
    COST_UPDATE = "cost.update"
    ERROR = "error"


class WebSocketMessage(BaseModel):
    type: str
    data: Optional[Dict[str, Any]] = None


class SessionUpdate(BaseModel):
    type: str = MessageType.SESSION_UPDATE
    session: Optional[Dict[str, Any]] = None


class ResponseCreate(BaseModel):
    type: str = MessageType.RESPONSE_CREATE
    response: Optional[Dict[str, Any]] = None


class ErrorMessage(BaseModel):
    type: str = MessageType.ERROR
    message: str
    error: Optional[str] = None


class ConnectionMessage(BaseModel):
    type: str
    message: str
    code: Optional[int] = None
    reason: Optional[str] = None


class CostData(BaseModel):
    total: float
    input_tokens: int
    output_tokens: int
    cached_tokens: int


class CostUpdate(BaseModel):
    type: str = MessageType.COST_UPDATE
    cost: CostData