@echo off
cd /d "%~dp0"
echo IPA Lab: abre http://localhost:8765 en tu navegador.
echo Para detener el servidor, presiona Ctrl+C.
python -m http.server 8765 --bind 127.0.0.1
