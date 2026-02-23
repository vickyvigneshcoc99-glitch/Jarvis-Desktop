import pyttsx3
import speech_recognition as sr
import os
import json
import time
import psutil
import pyautogui
from flask import Flask, render_template_string, jsonify, request
from flask_cors import CORS
import threading

app = Flask(__name__)
CORS(app)

# --- STARK INDUSTRIES VOICE ENGINE ---
engine = pyttsx3.init()
voices = engine.getProperty('voices')

# Set to British Male voice (Paul Bettany Style)
# Typical Windows voices: "George", "Hazel", "United Kingdom"
british_voice_found = False
for voice in voices:
    if "United Kingdom" in voice.name or "Great Britain" in voice.name or "British" in voice.name:
        engine.setProperty('voice', voice.id)
        british_voice_found = True
        break

if not british_voice_found:
    # Fallback to David (Male)
    for voice in voices:
        if "David" in voice.name:
            engine.setProperty('voice', voice.id)
            break

engine.setProperty('rate', 185)   # Snappy British professional speed
engine.setProperty('volume', 1.0) # Full system volume

def speak(text):
    print(f"J.A.R.V.I.S.: {text}")
    engine.say(text)
    engine.runAndWait()

def welcome_sequence():
    time.sleep(3)
    speak("Systems online. Welcome home, sir. All core protocols are operational.")

@app.route('/api/ask', methods=['POST'])
def ask():
    data = request.json
    text = data.get('text', '').lower()
    
    response = "I am processing that now, sir."
    mode = "normal"
    
    if "are you there" in text:
        response = "For you, sir, always."
    elif "hello" in text:
        response = "Hello Sir. All systems are fully functional. How can I assist you today?"
    elif "combat mode" in text or "engage combat" in text:
        response = "Combat mode engaged. All systems at maximum capacity. Switching HUD to tactical view."
        mode = "combat"
    elif "stand down" in text or "return to standby" in text:
        response = "Standing down, sir. Normal UI restored."
        mode = "normal"
    elif "status" in text or "system scan" in text:
        cpu = psutil.cpu_percent()
        ram = psutil.virtual_memory().percent
        response = f"Scanning system core. CPU is at {cpu} percent. Memory usage is {ram} percent. Connection is stable."
    elif "time" in text:
        response = f"The current time is {time.strftime('%I:%M %p')}."
    elif "screenshot" in text:
        pyautogui.screenshot("screenshot.png")
        response = "Snapshot captured and saved to your project folder, sir."
    elif "open chrome" in text or "google chrome" in text:
        os.system("start chrome")
        response = "Opening Google Chrome for you now."

    # Run speak in a thread so API responds instantly
    threading.Thread(target=speak, args=(response,)).start()
    
    return jsonify({"response": response, "mode": mode})

# Legacy HUD support for port 7475
@app.route('/')
def index():
    return "<h1>J.A.R.V.I.S. BACKEND ONLINE</h1><p>PC Control Active. Please use the HUD on port 5173.</p>"

if __name__ == '__main__':
    print("► Stark Industries - J.A.R.V.I.S. Systems Booting...")
    threading.Thread(target=welcome_sequence).start()
    app.run(port=7475, debug=False)
