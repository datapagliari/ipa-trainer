@echo off
cd /d "%~dp0"
echo IPA Lab: open http://localhost:8765 in your browser.
echo Press Ctrl+C to stop the server.
python -m http.server 8765 --bind 127.0.0.1
