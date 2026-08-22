@echo off
cd /d "%~dp0"
start "Pixel Party Server" /min "C:\Users\qunwe\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 4174 --bind 127.0.0.1
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4174/"
