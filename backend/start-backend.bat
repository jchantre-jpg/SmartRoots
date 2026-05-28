@echo off
cd /d "%~dp0"
echo SmartRoots — iniciando API Flask en http://127.0.0.1:5000
echo Deja esta ventana abierta mientras uses la app.
python -m pip install -r requirements.txt -q
python app.py
pause
