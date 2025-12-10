"""
Script para crear repositorio automáticamente usando diferentes métodos
"""
import subprocess
import os
import sys

GITHUB_USER = "leonidas890"
GITHUB_EMAIL = "leonidasdiaz82@gmail.com"
REPO_NAME = "conciliacion-bancaria-calypso"

def check_gh_cli():
    """Verifica si GitHub CLI está instalado"""
    try:
        result = subprocess.run(['gh', '--version'], capture_output=True, check=True)
        return True
    except:
        return False

def create_repo_with_gh_cli():
    """Crea repositorio usando GitHub CLI"""
    print("\nIntentando crear repositorio con GitHub CLI...")
    try:
        # Verificar autenticación
        result = subprocess.run(['gh', 'auth', 'status'], capture_output=True, text=True)
        if result.returncode != 0:
            print("[INFO] GitHub CLI no está autenticado")
            print("Ejecuta: gh auth login")
            return False
        
        # Crear repositorio
        result = subprocess.run([
            'gh', 'repo', 'create', REPO_NAME,
            '--public',
            '--description', 'Aplicación de Conciliación Bancaria Automática - CALYPSO - UN MUNDO DE SOLUCIONES',
            '--source', '.',
            '--remote', 'origin',
            '--push'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"[OK] Repositorio creado: https://github.com/{GITHUB_USER}/{REPO_NAME}")
            return True
        else:
            print(f"[INFO] {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

def init_and_configure_git():
    """Inicializa y configura git"""
    print("\nConfigurando git...")
    try:
        # Configurar git si no está configurado
        subprocess.run(['git', 'config', 'user.email', GITHUB_EMAIL], 
                      capture_output=True, check=True)
        subprocess.run(['git', 'config', 'user.name', GITHUB_USER], 
                      capture_output=True, check=True)
        
        # Inicializar repositorio si no existe
        if not os.path.exists('.git'):
            subprocess.run(['git', 'init'], check=True, capture_output=True)
            print("[OK] Repositorio git inicializado")
        
        print(f"[OK] Git configurado: {GITHUB_EMAIL}")
        return True
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

def create_gitignore():
    """Crea .gitignore si no existe"""
    if os.path.exists('.gitignore'):
        return
    
    gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
pip-log.txt
pip-delete-this-directory.txt

# Streamlit
.streamlit/secrets.toml

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.egg-info/

# Logs
*.log

# Node (si hay)
node_modules/
"""
    
    with open('.gitignore', 'w', encoding='utf-8') as f:
        f.write(gitignore_content)
    print("[OK] .gitignore creado")

def prepare_repo():
    """Prepara el repositorio local"""
    print("\nPreparando repositorio local...")
    
    # Configurar git
    if not init_and_configure_git():
        return False
    
    # Crear .gitignore
    create_gitignore()
    
    # Agregar archivos
    try:
        subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
        
        # Verificar si hay cambios para commit
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            subprocess.run(['git', 'commit', '-m', 
                          'Initial commit: Conciliacion Bancaria CALYPSO'], 
                         check=True, capture_output=True)
            print("[OK] Archivos agregados y commit realizado")
        else:
            print("[INFO] No hay cambios para commit")
        
        return True
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

def create_repo_instructions():
    """Proporciona instrucciones para crear el repositorio manualmente"""
    print("\n" + "="*60)
    print("  INSTRUCCIONES PARA CREAR EL REPOSITORIO")
    print("="*60)
    print(f"\n1. Ve a: https://github.com/new")
    print(f"2. Nombre: {REPO_NAME}")
    print(f"3. Descripción: Aplicación de Conciliación Bancaria Automática - CALYPSO")
    print(f"4. Público")
    print(f"5. NO marques 'Initialize with README'")
    print(f"6. Click 'Create repository'")
    print(f"\n7. Luego ejecuta estos comandos:")
    print(f"   git remote add origin https://github.com/{GITHUB_USER}/{REPO_NAME}.git")
    print(f"   git branch -M main")
    print(f"   git push -u origin main")
    print("\n" + "="*60)

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("  CREACION AUTOMATICA DE REPOSITORIO")
    print(f"  Usuario: {GITHUB_USER}")
    print(f"  Correo: {GITHUB_EMAIL}")
    print("="*60)
    
    # Preparar repositorio local
    if not prepare_repo():
        print("\n[ERROR] No se pudo preparar el repositorio local")
        return False
    
    # Intentar con GitHub CLI
    if check_gh_cli():
        print("\n[INFO] GitHub CLI detectado")
        if create_repo_with_gh_cli():
            print("\n[COMPLETADO] Repositorio creado exitosamente!")
            print(f"URL: https://github.com/{GITHUB_USER}/{REPO_NAME}")
            return True
        else:
            print("\n[INFO] No se pudo crear con GitHub CLI")
            print("Verifica que estés autenticado: gh auth login")
    else:
        print("\n[INFO] GitHub CLI no está instalado")
    
    # Si no se pudo crear automáticamente, dar instrucciones
    create_repo_instructions()
    
    # Intentar conectar con repositorio remoto si ya existe
    try:
        result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                              capture_output=True)
        if result.returncode == 0:
            print(f"\n[INFO] Repositorio remoto ya configurado: {result.stdout.decode().strip()}")
            print("Puedes hacer push con: git push -u origin main")
        else:
            print(f"\n[INFO] Configura el remoto con:")
            print(f"git remote add origin https://github.com/{GITHUB_USER}/{REPO_NAME}.git")
    except:
        pass
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nOperacion cancelada")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

