@echo off
title Crear Repositorio GitHub - CALYPSO
color 0B
echo.
echo ========================================
echo   CREAR REPOSITORIO EN GITHUB
echo   Usuario: leonidas890
echo ========================================
echo.
echo Este script creara automaticamente el repositorio en GitHub
echo.
pause

python crear_repositorio_github.py

if errorlevel 1 (
    echo.
    echo ERROR: No se pudo crear el repositorio
    echo.
    echo Verifica que:
    echo 1. Git este instalado
    echo 2. Tengas un token de GitHub valido
    echo 3. Tengas permisos para crear repositorios
    echo.
    pause
)

