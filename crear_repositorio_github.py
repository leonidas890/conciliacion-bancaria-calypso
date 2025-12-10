"""
Script para crear repositorio en GitHub automáticamente
Usuario: leonidas890
Correo: leonidasdiaz82@gmail.com
"""
import requests
import json
import os
import subprocess
import sys

GITHUB_USER = "leonidas890"  # Username de GitHub
GITHUB_EMAIL = "leonidasdiaz82@gmail.com"  # Correo de GitHub
REPO_NAME = "conciliacion-bancaria-calypso"
REPO_DESCRIPTION = "Aplicación de Conciliación Bancaria Automática - CALYPSO - UN MUNDO DE SOLUCIONES"

def check_git_installed():
    """Verifica que git esté instalado"""
    try:
        subprocess.run(['git', '--version'], capture_output=True, check=True)
        return True
    except:
        return False

def get_github_token():
    """Obtiene el token de GitHub desde variable de entorno o input"""
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("\n" + "="*60)
        print("  CONFIGURACION DE GITHUB")
        print("="*60)
        print("\nPara crear el repositorio necesitas un token de GitHub.")
        print("\nComo obtener un token:")
        print("1. Ve a: https://github.com/settings/tokens")
        print("2. Click en 'Generate new token (classic)'")
        print("3. Selecciona el scope 'repo' (acceso completo a repositorios)")
        print("4. Genera el token y copialo")
        print("\n" + "-"*60)
        token = input("\nIngresa tu token de GitHub (o presiona Enter para usar variable GITHUB_TOKEN): ").strip()
    
    return token

def create_github_repo(token):
    """Crea el repositorio en GitHub usando la API"""
    url = f"https://api.github.com/user/repos"
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    data = {
        "name": REPO_NAME,
        "description": REPO_DESCRIPTION,
        "private": False,
        "auto_init": False,
        "license_template": "mit"
    }
    
    print(f"\nCreando repositorio '{REPO_NAME}' en GitHub...")
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 201:
        repo_data = response.json()
        repo_url = repo_data['html_url']
        print(f"[OK] Repositorio creado exitosamente!")
        print(f"URL: {repo_url}")
        return repo_url, repo_data['clone_url']
    elif response.status_code == 422:
        # El repositorio ya existe
        repo_url = f"https://github.com/{GITHUB_USER}/{REPO_NAME}"
        clone_url = f"https://github.com/{GITHUB_USER}/{REPO_NAME}.git"
        print(f"[INFO] El repositorio ya existe: {repo_url}")
        return repo_url, clone_url
    else:
        print(f"[ERROR] No se pudo crear el repositorio")
        print(f"Codigo de error: {response.status_code}")
        print(f"Respuesta: {response.text}")
        return None, None

def configure_git():
    """Configura git con el correo y nombre de usuario"""
    print("\nConfigurando git...")
    try:
        # Configurar correo
        subprocess.run(['git', 'config', 'user.email', GITHUB_EMAIL], 
                      check=True, capture_output=True)
        # Configurar nombre (usar username como nombre)
        subprocess.run(['git', 'config', 'user.name', GITHUB_USER], 
                      check=True, capture_output=True)
        print(f"[OK] Git configurado con correo: {GITHUB_EMAIL}")
        return True
    except Exception as e:
        print(f"[ERROR] No se pudo configurar git: {e}")
        return False

def init_git_repo():
    """Inicializa el repositorio git local"""
    if os.path.exists('.git'):
        print("[INFO] Repositorio git ya inicializado")
        # Configurar git de todas formas
        configure_git()
        return True
    
    print("\nInicializando repositorio git local...")
    try:
        subprocess.run(['git', 'init'], check=True, capture_output=True)
        print("[OK] Repositorio git inicializado")
        # Configurar git
        configure_git()
        return True
    except Exception as e:
        print(f"[ERROR] No se pudo inicializar git: {e}")
        return False

def create_gitignore():
    """Crea archivo .gitignore si no existe"""
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

def add_and_commit_files():
    """Agrega y hace commit de los archivos"""
    print("\nAgregando archivos al repositorio...")
    try:
        subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
        subprocess.run(['git', 'commit', '-m', 'Initial commit: Conciliacion Bancaria CALYPSO'], 
                      check=True, capture_output=True)
        print("[OK] Archivos agregados y commit realizado")
        return True
    except Exception as e:
        print(f"[ERROR] No se pudieron agregar archivos: {e}")
        return False

def connect_to_github(clone_url):
    """Conecta el repositorio local con GitHub"""
    print(f"\nConectando con GitHub...")
    try:
        # Verificar si ya existe el remote
        result = subprocess.run(['git', 'remote', 'get-url', 'origin'], 
                              capture_output=True)
        if result.returncode == 0:
            print("[INFO] Remote 'origin' ya existe, actualizando...")
            subprocess.run(['git', 'remote', 'set-url', 'origin', clone_url], 
                          check=True, capture_output=True)
        else:
            subprocess.run(['git', 'remote', 'add', 'origin', clone_url], 
                          check=True, capture_output=True)
        
        print("[OK] Repositorio conectado con GitHub")
        return True
    except Exception as e:
        print(f"[ERROR] No se pudo conectar con GitHub: {e}")
        return False

def push_to_github():
    """Hace push del código a GitHub"""
    print("\nSubiendo codigo a GitHub...")
    try:
        # Intentar push
        result = subprocess.run(['git', 'push', '-u', 'origin', 'main'], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            # Intentar con master si main falla
            result = subprocess.run(['git', 'branch', '-M', 'main'], 
                                  capture_output=True)
            result = subprocess.run(['git', 'push', '-u', 'origin', 'main'], 
                                  capture_output=True, text=True)
        
        if result.returncode == 0:
            print("[OK] Codigo subido exitosamente a GitHub")
            return True
        else:
            print("[INFO] No se pudo hacer push automaticamente")
            print("Ejecuta manualmente: git push -u origin main")
            return False
    except Exception as e:
        print(f"[ERROR] Error al hacer push: {e}")
        return False

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("  CREACION AUTOMATICA DE REPOSITORIO GITHUB")
    print(f"  Usuario: {GITHUB_USER}")
    print(f"  Correo: {GITHUB_EMAIL}")
    print("="*60)
    
    # Verificar git
    if not check_git_installed():
        print("\n[ERROR] Git no esta instalado")
        print("Instala Git desde: https://git-scm.com/downloads")
        return False
    
    # Obtener token
    token = get_github_token()
    if not token:
        print("\n[ERROR] Se requiere un token de GitHub")
        return False
    
    # Crear repositorio en GitHub
    repo_url, clone_url = create_github_repo(token)
    if not repo_url:
        return False
    
    # Inicializar git local
    if not init_git_repo():
        return False
    
    # Crear .gitignore
    create_gitignore()
    
    # Agregar y commit
    if not add_and_commit_files():
        return False
    
    # Conectar con GitHub
    if not connect_to_github(clone_url):
        return False
    
    # Push (opcional, puede requerir autenticación adicional)
    push_to_github()
    
    print("\n" + "="*60)
    print("  [COMPLETADO] REPOSITORIO CREADO")
    print("="*60)
    print(f"\nRepositorio: {repo_url}")
    print(f"\nPara desplegar en Streamlit Cloud:")
    print(f"1. Ve a: https://share.streamlit.io/")
    print(f"2. Conecta el repositorio: {GITHUB_USER}/{REPO_NAME}")
    print(f"3. Main file: app.py")
    print(f"4. Click 'Deploy'")
    print("\n" + "="*60)
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nOperacion cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

