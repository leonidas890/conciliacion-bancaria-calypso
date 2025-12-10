# Conciliación Bancaria Automática - Versión Python

Aplicación web para conciliación bancaria automática desarrollada en Python con Streamlit.

## Características

- ✅ Procesamiento de archivos Excel (.xlsx, .xls)
- ✅ Detección automática de columnas (fecha, monto, PV/referencia)
- ✅ Cruce exacto por fecha + PV + monto
- ✅ Cruce por fecha + PV o fecha + monto
- ✅ Interfaz web moderna y responsive
- ✅ Descarga de resultados en Excel
- ✅ Sin errores de compatibilidad

## Instalación

1. Instala Python 3.8 o superior

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

## Ejecución

Ejecuta la aplicación:
```bash
streamlit run app.py
```

La aplicación se abrirá automáticamente en tu navegador en `http://localhost:8501`

## Uso

### Modo 1: Un archivo con múltiples hojas
1. Selecciona "Un archivo (múltiples hojas)" en el sidebar
2. Sube un archivo Excel con al menos 2 hojas
3. La primera hoja se cruzará contra la segunda
4. Haz clic en "Procesar y Conciliar"

### Modo 2: Dos archivos separados
1. Selecciona "Dos archivos separados" en el sidebar
2. Sube el archivo de pagos bancarios
3. Sube el archivo de pagos internos
4. Haz clic en "Procesar y Conciliar"

## Algoritmo de Conciliación

El sistema cruza los datos en este orden de prioridad:

1. **Coincidencia exacta**: Fecha + PV + Monto
2. **Coincidencia por fecha + PV**: Sin importar el monto
3. **Coincidencia por fecha + monto**: Sin importar el PV

## Requisitos

- Python 3.8+
- pandas
- openpyxl
- streamlit

## Ventajas sobre la versión TypeScript

- ✅ Sin problemas de compatibilidad entre librerías
- ✅ Más simple de mantener
- ✅ Ejecución directa sin compilación
- ✅ Mejor manejo de archivos Excel
- ✅ Interfaz más estable

