"""
Script para crear aplicación de escritorio usando PyInstaller
Ejecutar: python build_desktop.py
"""
import PyInstaller.__main__
import os
import sys

# Configuración
app_name = "ConciliacionBancaria"
app_icon = None  # Puedes agregar un archivo .ico aquí si tienes uno
main_script = "app.py"

# Verificar que existe el archivo principal
if not os.path.exists(main_script):
    print(f"Error: No se encuentra el archivo {main_script}")
    sys.exit(1)

# Opciones de PyInstaller
options = [
    main_script,
    '--name', app_name,
    '--onefile',  # Crear un solo archivo ejecutable
    '--windowed',  # Sin consola (para Windows)
    '--clean',  # Limpiar archivos temporales
    '--noconfirm',  # Sobrescribir sin preguntar
    '--add-data', 'static;static',  # Incluir carpeta static si existe
    '--hidden-import', 'streamlit',
    '--hidden-import', 'pandas',
    '--hidden-import', 'openpyxl',
    '--hidden-import', 'xlrd',
    '--hidden-import', 'PIL',
    '--collect-all', 'streamlit',
    '--collect-all', 'pandas',
]

# Agregar icono si existe
if app_icon and os.path.exists(app_icon):
    options.extend(['--icon', app_icon])

print("🔨 Construyendo aplicación de escritorio...")
print("⏳ Esto puede tardar varios minutos...")

try:
    PyInstaller.__main__.run(options)
    print("\n✅ ¡Aplicación de escritorio creada exitosamente!")
    print(f"📁 El ejecutable se encuentra en: dist/{app_name}.exe")
except Exception as e:
    print(f"\n❌ Error al crear la aplicación: {str(e)}")
    print("\n💡 Asegúrate de tener PyInstaller instalado:")
    print("   pip install pyinstaller")
    sys.exit(1)

