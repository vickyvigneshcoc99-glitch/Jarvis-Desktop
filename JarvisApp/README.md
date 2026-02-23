# Jarvis AI Assistant (Desktop)

A futuristic, voice-activated AI assistant built with React, Vite, and Python.

## Features
- **Voice Activated**: Uses browser-native Speech Recognition.
- **Mechanical Voice**: Paul Bettany style British voice synthesis.
- **Futuristic UI**: High-end animations and mechanical "core" design.
- **Standalone App**: Runs as a native PC application.
- **System Scan**: Real-time monitoring of CPU and RAM.
- **Combat Mode**: Aggressive red HUD for critical operations.

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- Python 3.10+

### Installation
1. Install UI dependencies:
   ```bash
   npm install
   ```
2. Install Python Brain dependencies:
   ```bash
   pip install flask flask-cors pyttsx3 speechrecognition psutil
   ```

### Run the System
1. Open PowerShell and run the boot script:
   ```powershell
   .\START.bat
   ```
2. Open your browser to: `http://localhost:7475` (if it doesn't open automatically).

## Voice Commands
- **"Jarvis, are you there?"** -> Response: "For you, sir, always."
- **"System Scan"** -> Scans CPU and RAM usage.
- **"Combat Mode"** -> Switches HUD to Red Alert.
- **"Stand Down"** -> Returns HUD to Normal Blue.
- **"What time is it?"** -> Announces current time.
