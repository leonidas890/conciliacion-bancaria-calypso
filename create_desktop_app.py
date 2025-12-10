"""
Script alternativo para crear aplicación de escritorio
Usa streamlit run con un wrapper para crear una app de escritorio
"""
import subprocess
import sys
import os

def create_desktop_launcher():
    """Crea un script launcher para la aplicación de escritorio"""
    
    # Script para Windows
    if sys.platform == 'win32':
        launcher_content = f"""@echo off
cd /d "%~dp0"
python -m streamlit run app.py --server.headless true --server.port 8501 --browser.gatherUsageStats false
pause
"""
        with open('launch_desktop.bat', 'w', encoding='utf-8') as f:
            f.write(launcher_content)
        print("Creado: launch_desktop.bat")
    
    # Script para Linux/Mac
    else:
        launcher_content = """#!/bin/bash
cd "$(dirname "$0")"
python3 -m streamlit run app.py --server.headless true --server.port 8501 --browser.gatherUsageStats false
"""
        with open('launch_desktop.sh', 'w', encoding='utf-8') as f:
            f.write(launcher_content)
        os.chmod('launch_desktop.sh', 0o755)
        print("Creado: launch_desktop.sh")
    
    print("\nPara ejecutar la aplicacion de escritorio:")
    if sys.platform == 'win32':
        print("   Doble clic en: launch_desktop.bat")
    else:
        print("   Ejecuta: ./launch_desktop.sh")

if __name__ == "__main__":
    create_desktop_launcher()

