#!/usr/bin/env python3

"""
Startup script for the Python FastAPI server
"""

import subprocess
import sys
import os

def check_python_version():
    """Check if Python version is >= 3.8"""
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)

def install_requirements():
    """Install required packages"""
    print("Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        sys.exit(1)

def check_env_file():
    """Check if .env file exists"""
    if not os.path.exists(".env"):
        print("❌ .env file not found. Please create it with your OPENAI_API_KEY")
        print("Example:")
        print("OPENAI_API_KEY=sk-your-key-here")
        print("PORT=3001")
        sys.exit(1)
    print("✅ .env file found")

def start_server():
    """Start the FastAPI server"""
    print("Starting FastAPI server...")
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0", 
            port=int(os.getenv("PORT", 3001)),
            reload=True,
            log_level="info"
        )
    except ImportError:
        print("❌ uvicorn not installed. Running pip install first...")
        install_requirements()
        start_server()
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Starting AI Voice Agent Python Server")
    check_python_version()
    check_env_file()
    install_requirements()
    start_server()