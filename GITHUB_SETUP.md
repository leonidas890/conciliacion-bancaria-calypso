# 🔗 Configuración Automática de GitHub

## Crear Repositorio Automáticamente

### Opción 1: Script Automático (Recomendado)

1. **Obtener Token de GitHub:**
   - Ve a: https://github.com/settings/tokens
   - Click en "Generate new token (classic)"
   - Nombre: "Conciliacion Bancaria"
   - Selecciona scope: `repo` (acceso completo)
   - Genera y copia el token

2. **Ejecutar script:**
   ```bash
   python crear_repositorio_github.py
   ```
   O en Windows:
   ```bash
   crear_repo_github.bat
   ```

3. **Ingresar token cuando se solicite**

4. **¡Listo!** El repositorio se creará automáticamente en:
   `https://github.com/leonidas890/conciliacion-bancaria-calypso`

### Opción 2: Manual

1. **Crear repositorio en GitHub:**
   - Ve a: https://github.com/new
   - Nombre: `conciliacion-bancaria-calypso`
   - Descripción: "Aplicación de Conciliación Bancaria Automática - CALYPSO"
   - Público
   - No inicializar con README

2. **Conectar repositorio local:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Conciliacion Bancaria CALYPSO"
   git branch -M main
   git remote add origin https://github.com/leonidas890/conciliacion-bancaria-calypso.git
   git push -u origin main
   ```

## Desplegar en Streamlit Cloud

Una vez que el repositorio esté en GitHub:

1. Ve a: https://share.streamlit.io/
2. Inicia sesión con GitHub
3. Click "New app"
4. Repositorio: `leonidas890/conciliacion-bancaria-calypso`
5. Main file: `app.py`
6. Click "Deploy"

Tu app estará en línea en minutos!

