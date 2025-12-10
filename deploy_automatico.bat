@echo off
title Despliegue Automatico - CALYPSO
color 0B
echo.
echo ========================================
echo   DESPLIEGUE AUTOMATICO
echo   CONCILIACION BANCARIA CALYPSO
echo ========================================
echo.

echo [1/3] Configurando aplicacion...
python setup_completo.py
if errorlevel 1 (
    echo ERROR en la configuracion
    pause
    exit /b 1
)

echo.
echo [2/3] Verificando que todo funciona...
python -c "import streamlit; import pandas; import openpyxl; print('OK - Todas las dependencias estan instaladas')"
if errorlevel 1 (
    echo ERROR: Faltan dependencias
    echo Instalando...
    pip install -r requirements.txt
)

echo.
echo [3/3] Iniciando aplicacion de escritorio...
echo.
echo La aplicacion se abrira en tu navegador...
echo Para detenerla, presiona Ctrl+C en esta ventana
echo.
timeout /t 3 /nobreak >nul

start "" "Iniciar_Aplicacion.bat"

echo.
echo ========================================
echo   APLICACION INICIADA
echo ========================================
echo.
echo La aplicacion esta corriendo en: http://localhost:8501
echo.
echo Para desplegar en linea, lee: STREAMLIT_CLOUD.md
echo.
pause

