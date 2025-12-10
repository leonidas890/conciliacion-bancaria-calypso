@echo off
title Conciliacion Bancaria CALYPSO
color 0A
echo.
echo ========================================
echo   CONCILIACION BANCARIA CALYPSO
echo   UN MUNDO DE SOLUCIONES
echo ========================================
echo.
echo Iniciando aplicacion...
echo.
cd /d "%~dp0"
python -m streamlit run app.py --server.headless true --server.port 8501 --browser.gatherUsageStats false
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo iniciar la aplicacion
    echo.
    echo Verifica que:
    echo 1. Python este instalado
    echo 2. Las dependencias esten instaladas: pip install -r requirements.txt
    echo.
    pause
)
