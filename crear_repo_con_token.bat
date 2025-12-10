@echo off
title Crear Repositorio GitHub con Token - CALYPSO
color 0B
echo.
echo ========================================
echo   CREAR REPOSITORIO EN GITHUB
echo   Usuario: leonidas890
echo   Correo: leonidasdiaz82@gmail.com
echo ========================================
echo.
echo Este script creara automaticamente el repositorio en GitHub
echo.
echo IMPORTANTE: Necesitas un token de GitHub
echo.
echo Si ya tienes el token, puedes:
echo 1. Ejecutar: set GITHUB_TOKEN=tu_token_aqui
echo 2. Luego ejecutar este script nuevamente
echo.
echo O ejecuta directamente:
echo python crear_repositorio_github.py
echo.
pause

if defined GITHUB_TOKEN (
    echo Token encontrado en variable de entorno
    python crear_repositorio_github.py
) else (
    echo.
    echo No se encontro token en variable de entorno.
    echo El script te pedira el token interactivamente.
    echo.
    python crear_repositorio_github.py
)

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

