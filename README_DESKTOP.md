# 🖥️ Aplicación de Escritorio - Conciliación Bancaria CALYPSO

## Instrucciones Rápidas

### Para Windows:

1. **Instalar Python** (si no lo tienes):
   - Descarga desde: https://www.python.org/downloads/
   - Asegúrate de marcar "Add Python to PATH" durante la instalación

2. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecutar la aplicación:**
   - Doble clic en: `launch_desktop.bat`
   - O ejecuta: `streamlit run app.py`

4. **La aplicación se abrirá automáticamente en tu navegador**

### Para Linux/Mac:

1. **Instalar dependencias:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Ejecutar la aplicación:**
   ```bash
   ./launch_desktop.sh
   ```
   O:
   ```bash
   streamlit run app.py
   ```

## 🌐 Aplicación Web en Línea

### Opción 1: Streamlit Cloud (Gratis)

1. Ve a: https://streamlit.io/cloud
2. Conecta tu repositorio de GitHub
3. Configura:
   - Main file: `app.py`
   - Python version: 3.9+
4. ¡Listo! Tu app estará en línea

### Opción 2: Tu Propio Servidor

1. **En tu servidor, ejecuta:**
   ```bash
   pip install -r requirements.txt
   streamlit run app.py --server.port 8501 --server.address 0.0.0.0
   ```

2. **Accede desde:** `http://tu-servidor:8501`

### Opción 3: Docker

1. **Construir imagen:**
   ```bash
   docker build -t conciliacion-bancaria .
   ```

2. **Ejecutar contenedor:**
   ```bash
   docker run -p 8501:8501 conciliacion-bancaria
   ```

3. **Acceder:** `http://localhost:8501`

## 📝 Notas

- La aplicación funciona tanto localmente como en línea
- Todos los datos se procesan localmente (privacidad garantizada)
- No se requiere conexión a internet para uso local
- Para uso en línea, necesitas un servidor o usar Streamlit Cloud

