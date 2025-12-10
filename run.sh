#!/bin/bash
echo "Instalando dependencias..."
pip install -r requirements.txt
echo ""
echo "Iniciando aplicacion..."
streamlit run app.py

