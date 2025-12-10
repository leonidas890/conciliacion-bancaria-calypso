"""
Script de configuración completa automática
Configura la aplicación para escritorio y web en línea
"""
import os
import sys
import subprocess
import platform

def print_step(step, message):
    """Imprime un paso del proceso"""
    print(f"\n{'='*60}")
    print(f"PASO {step}: {message}")
    print('='*60)

def check_python():
    """Verifica que Python esté instalado"""
    print_step(1, "Verificando Python")
    version = sys.version_info
    print(f"Python {version.major}.{version.minor}.{version.micro} detectado")
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("ERROR: Se requiere Python 3.9 o superior")
        return False
    print("[OK] Python OK")
    return True

def install_dependencies():
    """Instala todas las dependencias"""
    print_step(2, "Instalando dependencias")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("[OK] Dependencias instaladas correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"ERROR al instalar dependencias: {e}")
        return False

def create_desktop_launcher():
    """Crea el launcher para escritorio"""
    print_step(3, "Creando launcher de escritorio")
    
    if platform.system() == "Windows":
        bat_content = """@echo off
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
"""
        with open('Iniciar_Aplicacion.bat', 'w', encoding='utf-8') as f:
            f.write(bat_content)
        print("[OK] Creado: Iniciar_Aplicacion.bat")
        
    else:
        sh_content = """#!/bin/bash
cd "$(dirname "$0")"
echo "========================================"
echo "  CONCILIACION BANCARIA CALYPSO"
echo "  UN MUNDO DE SOLUCIONES"
echo "========================================"
echo ""
echo "Iniciando aplicacion..."
echo ""
python3 -m streamlit run app.py --server.headless true --server.port 8501 --browser.gatherUsageStats false
"""
        with open('Iniciar_Aplicacion.sh', 'w', encoding='utf-8') as f:
            f.write(sh_content)
        os.chmod('Iniciar_Aplicacion.sh', 0o755)
        print("[OK] Creado: Iniciar_Aplicacion.sh")
    
    return True

def create_streamlit_config():
    """Crea configuración de Streamlit"""
    print_step(4, "Configurando Streamlit")
    
    config_dir = '.streamlit'
    if not os.path.exists(config_dir):
        os.makedirs(config_dir)
    
    config_content = """[server]
headless = true
port = 8501
enableCORS = false
enableXsrfProtection = false
maxUploadSize = 200

[browser]
gatherUsageStats = false
serverAddress = "localhost"

[theme]
primaryColor = "#667eea"
backgroundColor = "#ffffff"
secondaryBackgroundColor = "#f0f2f6"
textColor = "#262730"
font = "sans serif"
"""
    
    with open(os.path.join(config_dir, 'config.toml'), 'w', encoding='utf-8') as f:
        f.write(config_content)
    print("[OK] Configuracion de Streamlit creada")
    return True

def create_deployment_files():
    """Crea archivos para despliegue web"""
    print_step(5, "Creando archivos para despliegue web")
    
    # Verificar que existe requirements.txt
    if not os.path.exists('requirements.txt'):
        print("ERROR: No se encuentra requirements.txt")
        return False
    
    # Crear Dockerfile si no existe
    if not os.path.exists('Dockerfile'):
        dockerfile_content = """FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0", "--server.headless=true"]
"""
        with open('Dockerfile', 'w', encoding='utf-8') as f:
            f.write(dockerfile_content)
        print("[OK] Dockerfile creado")
    
    # Crear .dockerignore
    dockerignore_content = """__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
.DS_Store
*.swp
*.swo
*~
.vscode/
.idea/
*.iml
dist/
build/
*.egg-info/
"""
    with open('.dockerignore', 'w', encoding='utf-8') as f:
        f.write(dockerignore_content)
    print("[OK] .dockerignore creado")
    
    return True

def create_readme():
    """Crea README con instrucciones"""
    print_step(6, "Creando documentación")
    
    readme_content = """# 🏦 Conciliación Bancaria Automática - CALYPSO

## 🚀 Inicio Rápido

### Para usar como aplicación de escritorio:

**Windows:**
1. Doble clic en: `Iniciar_Aplicacion.bat`
2. La aplicación se abrirá automáticamente en tu navegador

**Linux/Mac:**
```bash
./Iniciar_Aplicacion.sh
```

### Para desplegar en línea (Streamlit Cloud):

1. Sube este proyecto a GitHub
2. Ve a: https://share.streamlit.io/
3. Conecta tu repositorio
4. Configura: Main file = `app.py`
5. ¡Listo! Tu app estará en línea

## 📋 Requisitos

- Python 3.9 o superior
- Dependencias: `pip install -r requirements.txt`

## 🎯 Funcionalidades

- ✅ Conciliación automática por Fecha y PV
- ✅ Soporte para múltiples hojas Excel
- ✅ Detección automática de columnas
- ✅ Exportación con formato preservado
- ✅ Indicadores visuales de cruces

## 📞 Soporte

Para más información, consulta los archivos:
- `DEPLOY.md` - Guía de despliegue detallada
- `STREAMLIT_CLOUD.md` - Instrucciones para Streamlit Cloud
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("[OK] README.md creado")
    return True

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("  CONFIGURACION AUTOMATICA")
    print("  CONCILIACION BANCARIA CALYPSO")
    print("="*60)
    
    steps = [
        ("Verificando Python", check_python),
        ("Instalando dependencias", install_dependencies),
        ("Creando launcher de escritorio", create_desktop_launcher),
        ("Configurando Streamlit", create_streamlit_config),
        ("Creando archivos de despliegue", create_deployment_files),
        ("Creando documentación", create_readme),
    ]
    
    for name, func in steps:
        try:
            if not func():
                print(f"\n[ERROR] Error en: {name}")
                return False
        except Exception as e:
            print(f"\n[ERROR] Error en {name}: {str(e)}")
            return False
    
    print("\n" + "="*60)
    print("  [COMPLETADO] CONFIGURACION COMPLETA")
    print("="*60)
    print("\nPROXIMOS PASOS:")
    print("\n1. APLICACION DE ESCRITORIO:")
    if platform.system() == "Windows":
        print("   -> Doble clic en: Iniciar_Aplicacion.bat")
    else:
        print("   -> Ejecuta: ./Iniciar_Aplicacion.sh")
    
    print("\n2. APLICACION WEB EN LINEA:")
    print("   -> Lee: STREAMLIT_CLOUD.md para instrucciones")
    print("   -> O ejecuta: streamlit run app.py")
    
    print("\n" + "="*60)
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

