# 🚀 Guía de Despliegue - Conciliación Bancaria CALYPSO

Esta guía te ayudará a desplegar la aplicación tanto como aplicación de escritorio como aplicación web en línea.

## 📦 Opción 1: Aplicación de Escritorio

### Método A: Usando el Launcher (Recomendado - Más Simple)

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Crear el launcher:**
   ```bash
   python create_desktop_app.py
   ```

3. **Ejecutar la aplicación:**
   - **Windows:** Doble clic en `launch_desktop.bat`
   - **Linux/Mac:** Ejecutar `./launch_desktop.sh`

4. **La aplicación se abrirá automáticamente en tu navegador en:** `http://localhost:8501`

### Método B: Crear Ejecutable Standalone (Windows)

1. **Instalar PyInstaller:**
   ```bash
   pip install pyinstaller
   ```

2. **Crear el ejecutable:**
   ```bash
   python build_desktop.py
   ```

3. **El ejecutable estará en:** `dist/ConciliacionBancaria.exe`

4. **Distribuir:** Puedes compartir el archivo `.exe` con otros usuarios (no necesitan instalar Python)

## 🌐 Opción 2: Aplicación Web en Línea

### Opción A: Streamlit Cloud (Gratis y Fácil)

1. **Crear cuenta en:** https://streamlit.io/cloud

2. **Conectar tu repositorio:**
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket
   - O sube los archivos directamente

3. **Configurar:**
   - Archivo principal: `app.py`
   - Versión de Python: 3.9 o superior
   - Comando: `streamlit run app.py`

4. **Tu aplicación estará disponible en:** `https://tu-app.streamlit.app`

### Opción B: Desplegar en tu propio servidor

1. **Instalar dependencias en el servidor:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ejecutar Streamlit:**
   ```bash
   streamlit run app.py --server.port 8501 --server.address 0.0.0.0
   ```

3. **Configurar firewall:** Abrir puerto 8501

4. **Acceso:** `http://tu-servidor:8501`

### Opción C: Usar Docker

1. **Crear Dockerfile:**
   ```dockerfile
   FROM python:3.9-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   EXPOSE 8501
   CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
   ```

2. **Construir y ejecutar:**
   ```bash
   docker build -t conciliacion-bancaria .
   docker run -p 8501:8501 conciliacion-bancaria
   ```

## 📋 Requisitos del Sistema

- **Python:** 3.9 o superior
- **RAM:** Mínimo 2GB (recomendado 4GB)
- **Espacio:** ~500MB para instalación
- **Navegador:** Chrome, Firefox, Edge, Safari (versiones recientes)

## 🔧 Solución de Problemas

### Error: "No module named 'streamlit'"
```bash
pip install -r requirements.txt
```

### Error: "Port already in use"
```bash
# Cambiar el puerto en launch_desktop.bat o .sh
# Cambiar 8501 por otro puerto (ej: 8502)
```

### La aplicación no se abre automáticamente
- Abre manualmente tu navegador y ve a: `http://localhost:8501`

## 📞 Soporte

Para más ayuda, consulta la documentación de Streamlit:
https://docs.streamlit.io/

