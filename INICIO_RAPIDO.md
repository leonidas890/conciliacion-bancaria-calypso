# 🚀 INICIO RÁPIDO - Conciliación Bancaria CALYPSO

## ⚡ Configuración Automática (1 Click)

**Ejecuta este comando para configurar todo automáticamente:**

```bash
python setup_completo.py
```

Esto instalará dependencias, creará launchers y configurará todo lo necesario.

---

## 🖥️ USAR COMO APLICACIÓN DE ESCRITORIO

### Windows:
1. **Doble clic en:** `Iniciar_Aplicacion.bat`
2. La aplicación se abrirá automáticamente en tu navegador
3. ¡Listo para usar!

### Linux/Mac:
```bash
./Iniciar_Aplicacion.sh
```

---

## 🌐 DESPLEGAR EN LÍNEA (Con Link Público)

### Opción 1: Streamlit Cloud (Más Fácil - GRATIS)

1. **Sube tu código a GitHub:**
   - Crea un repositorio en GitHub
   - Sube todos los archivos del proyecto

2. **Conecta con Streamlit Cloud:**
   - Ve a: https://share.streamlit.io/
   - Inicia sesión con GitHub
   - Click en "New app"
   - Selecciona tu repositorio
   - Main file: `app.py`
   - Click "Deploy"

3. **¡Listo!** Tu app estará en línea con un link como:
   `https://tu-usuario-conciliacion.streamlit.app`

### Opción 2: Tu Propio Servidor

```bash
streamlit run app.py --server.port 8501 --server.address 0.0.0.0
```

Accede desde: `http://tu-servidor:8501`

---

## 📦 Crear Ejecutable Standalone (Opcional)

Si quieres crear un .exe que no requiera Python:

```bash
pip install pyinstaller
python build_desktop.py
```

El ejecutable estará en: `dist/ConciliacionBancaria.exe`

---

## ✅ Verificación

Para verificar que todo funciona:

```bash
streamlit run app.py
```

Si se abre en el navegador, ¡todo está correcto!

---

## 📞 Ayuda

- **Problemas con dependencias:** `pip install -r requirements.txt`
- **Puerto ocupado:** Cambia el puerto en `Iniciar_Aplicacion.bat`
- **Más información:** Lee `DEPLOY.md` y `STREAMLIT_CLOUD.md`

