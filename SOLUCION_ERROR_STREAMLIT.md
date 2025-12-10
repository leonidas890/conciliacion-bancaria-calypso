# 🔧 Solución: Error ModuleNotFoundError en Streamlit Cloud

## ❌ Problema
```
ModuleNotFoundError: No module named 'openpyxl'
```

## ✅ Solución

### Paso 1: Verificar requirements.txt

Asegúrate de que `requirements.txt` esté en la **raíz del repositorio** y contenga:

```
streamlit>=1.28.0
pandas>=2.0.0
openpyxl>=3.1.0
xlrd>=2.0.1
requests>=2.27.0
python-dateutil>=2.8.2
```

### Paso 2: Subir cambios a GitHub

```bash
git add requirements.txt
git commit -m "Fix: Actualizar requirements.txt"
git push origin main
```

### Paso 3: Reiniciar la app en Streamlit Cloud

1. Ve a tu app en Streamlit Cloud
2. Click en **"Manage app"** (esquina inferior derecha)
3. Click en **"Reboot app"** o **"Redeploy"**
4. Espera a que se reinicie

### Paso 4: Verificar instalación

Si el error persiste:

1. En Streamlit Cloud, ve a **"Manage app"**
2. Click en **"Logs"**
3. Verifica que `openpyxl` se esté instalando correctamente
4. Si no aparece, verifica que `requirements.txt` esté en la raíz

## 🔍 Verificación

El archivo `requirements.txt` debe estar en:
```
/conciliacion-bancaria-calypso/requirements.txt
```

NO en:
```
/conciliacion-bancaria-calypso/src/requirements.txt
/conciliacion-bancaria-calypso/otra-carpeta/requirements.txt
```

## 📝 Notas

- Streamlit Cloud lee automáticamente `requirements.txt` de la raíz
- Después de hacer push, la app se actualiza automáticamente
- Si el error persiste, reinicia manualmente desde "Manage app"

