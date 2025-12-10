@echo off
cd /d "%~dp0"
echo Iniciando aplicacion de Conciliacion Bancaria CALYPSO...
echo.
python -m streamlit run app.py --server.headless true --server.port 8501 --browser.gatherUsageStats false
if errorlevel 1 (
    echo.
    echo Error al iniciar la aplicacion.
    echo Asegurate de tener Python instalado y las dependencias:
    echo pip install -r requirements.txt
    pause
)
