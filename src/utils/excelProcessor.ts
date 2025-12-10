import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ExcelRow, ReconciliationResult, ProcessedData } from '@/types/reconciliation';
import { format } from 'date-fns';

// Mapeo flexible de nombres de columnas
const COLUMN_MAPPINGS = {
  fecha: ['fecha', 'date', 'fec', 'dia', 'day', 'fecha_pago', 'fecha_operacion', 'f_operacion', 'f_pago', 'fecha de contabilización', 'fecha de vencimiento'],
  monto: ['monto', 'amount', 'importe', 'valor', 'total', 'cantidad', 'pago', 'abono', 'cargo', 'credito', 'debito', 'value', 'cargo/abono (ml)', 'cargo/abono'],
  referencia: ['referencia', 'ref', 'reference', 'pv', 'punto_venta', 'puntoventa', 'numero', 'num', 'id', 'codigo', 'code', 'nro', 'no', 'voucher', 'comprobante', 'ticket', 'folio', 'numero_operacion', 'nro_operacion', 'comentarios', 'cod. pv'],
  descripcion: ['descripcion', 'description', 'desc', 'concepto', 'detalle', 'observacion', 'nota', 'comentario', 'memo', 'nombre de la cuenta de contrapartida', 'nombre pv']
};

// Interfaz para resultado de lectura de hojas múltiples
export interface MultiSheetData {
  sheetName: string;
  data: ExcelRow[];
}

// Función para leer todas las hojas de un archivo Excel
export const readExcelFileAllSheets = (file: File): Promise<MultiSheetData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        const allSheetsData: MultiSheetData[] = [];
        
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          });
          
          if (jsonData.length === 0) return;
          
          // Detectar columnas automáticamente
          const columns = detectColumns(jsonData);
          
          // Normalizar datos al formato esperado
          const normalizedData: ExcelRow[] = jsonData.map((row, idx) => {
            const fechaValue = columns.fecha ? (row as any)[columns.fecha] : '';
            const montoValue = columns.monto ? (row as any)[columns.monto] : 0;
            const referenciaValue = columns.referencia ? (row as any)[columns.referencia] : '';
            const descripcionValue = columns.descripcion ? (row as any)[columns.descripcion] : '';
            
            const fechaNormalizada = normalizeDate(String(fechaValue || ''));
            const montoNormalizado = normalizeMonto(montoValue);
            const pvExtraido = extractPV(String(referenciaValue || ''));
            
            // Validar que tenga fecha y monto válidos
            if (!fechaNormalizada || fechaNormalizada.trim() === '') {
              console.warn(`Fila ${idx + 2} en hoja "${sheetName}": fecha inválida o vacía, se omite`);
              return null;
            }
            
            if (!montoNormalizado || montoNormalizado <= 0) {
              console.warn(`Fila ${idx + 2} en hoja "${sheetName}": monto inválido (${montoValue}), se omite`);
              return null;
            }
            
            const excelRow: ExcelRow = {
              fecha: fechaNormalizada,
              monto: Math.round(montoNormalizado * 100) / 100, // Redondear a 2 decimales
              referencia: pvExtraido,
              descripcion: String(descripcionValue || ''),
              _original: row
            };
            return excelRow;
          }).filter((row): row is ExcelRow => row !== null && row.monto > 0);
          
          if (normalizedData.length > 0) {
            allSheetsData.push({
              sheetName,
              data: normalizedData
            });
          }
        });
        
        resolve(allSheetsData);
      } catch (error) {
        console.error('Error reading file:', error);
        reject(new Error('Error al leer el archivo'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al cargar el archivo'));
    reader.readAsBinaryString(file);
  });
};

// Extraer código PV de un texto (ej: "PV047", "pv007", "VENTA PV049")
const extractPV = (text: string): string => {
  if (!text) return '';
  const str = text.toString().trim();
  if (!str) return '';
  
  // Convertir a mayúsculas para normalización
  const upperStr = str.toUpperCase();
  
  // Buscar patrón PV seguido de números (con o sin espacios)
  // Ejemplos: "PV047", "PV 047", "PV-047", "P.V.047", "punto venta 047"
  const pvPatterns = [
    /PV[\s\-\.]*0*(\d+)/i,           // PV047, PV 047, PV-047, P.V.047
    /PUNTO[\s\-]*VENTA[\s\-]*0*(\d+)/i, // PUNTO VENTA 047
    /P\.?V\.?[\s\-]*0*(\d+)/i,       // P.V.047, P V 047
  ];
  
  for (const pattern of pvPatterns) {
    const match = upperStr.match(pattern);
    if (match && match[1]) {
      const num = match[1].replace(/^0+/, '') || '0'; // Remover ceros a la izquierda pero mantener al menos un dígito
      return `PV${num.padStart(3, '0')}`;
    }
  }
  
  // Si es solo un número, puede ser un código PV
  const numOnlyMatch = str.match(/^0*(\d+)$/);
  if (numOnlyMatch) {
    const num = numOnlyMatch[1].replace(/^0+/, '') || '0';
    return `PV${num.padStart(3, '0')}`;
  }
  
  // Si contiene números, intentar extraer el último número significativo
  const lastNumberMatch = upperStr.match(/(\d{2,})/);
  if (lastNumberMatch) {
    const num = lastNumberMatch[1].replace(/^0+/, '') || '0';
    return `PV${num.padStart(3, '0')}`;
  }
  
  // Normalizar referencia general: quitar espacios y caracteres especiales, mantener solo alfanuméricos
  const cleaned = upperStr.replace(/[^A-Z0-9]/g, '');
  return cleaned || '';
};

// Reconciliar automáticamente las hojas de un mismo archivo
export const reconcileSheetsFromFile = (sheets: MultiSheetData[]): ProcessedData => {
  if (sheets.length < 2) {
    console.log('Se necesitan al menos 2 hojas para reconciliar');
    return {
      results: [],
      totalConciliados: 0,
      totalNoConciliados: 0,
      montoConciliado: 0,
      montoNoConciliado: 0
    };
  }
  
  // Usar la primera hoja como "interno" (SAP) y la segunda como "banco"
  const sheet1 = sheets[0];
  const sheet2 = sheets[1];
  
  console.log(`=== Reconciliando hojas ===`);
  console.log(`Hoja 1 (${sheet1.sheetName}): ${sheet1.data.length} registros`);
  console.log(`Hoja 2 (${sheet2.sheetName}): ${sheet2.data.length} registros`);
  
  return reconcileDataExact(sheet1.data, sheet2.data, sheet1.sheetName, sheet2.sheetName);
};

// Reconciliación exacta entre dos conjuntos de datos
// Prioriza: 1) Fecha + PV + Monto, 2) Fecha + PV, 3) Fecha + Monto
const reconcileDataExact = (
  data1: ExcelRow[],
  data2: ExcelRow[],
  name1: string,
  name2: string
): ProcessedData => {
  const results: ReconciliationResult[] = [];
  const matched1 = new Set<number>();
  const matched2 = new Set<number>();
  
  // Normalizar y validar datos antes de cruzar
  const normalizeRow = (row: ExcelRow, idx: number): ExcelRow | null => {
    if (!row.fecha || row.fecha.trim() === '') {
      console.warn(`Fila ${idx + 1}: fecha vacía, se omite`);
      return null;
    }
    if (!row.monto || row.monto <= 0) {
      console.warn(`Fila ${idx + 1}: monto inválido (${row.monto}), se omite`);
      return null;
    }
    return {
      ...row,
      fecha: normalizeDate(row.fecha),
      referencia: extractPV(row.referencia || ''),
      monto: Math.round(row.monto * 100) / 100 // Redondear a 2 decimales para evitar errores de precisión
    };
  };
  
  const normalizedData1 = data1
    .map((row, idx) => normalizeRow(row, idx))
    .filter((row): row is ExcelRow => row !== null);
  
  const normalizedData2 = data2
    .map((row, idx) => normalizeRow(row, idx))
    .filter((row): row is ExcelRow => row !== null);
  
  console.log(`Datos normalizados - Hoja 1: ${normalizedData1.length}, Hoja 2: ${normalizedData2.length}`);
  
  // Crear índices para búsqueda rápida en data2
  // Prioridad 1: Fecha + PV + Monto (coincidencia exacta)
  const data2ByDatePVAmount = new Map<string, number[]>();
  // Prioridad 2: Fecha + PV (sin importar monto)
  const data2ByDatePV = new Map<string, number[]>();
  // Prioridad 3: Fecha + Monto (sin importar PV)
  const data2ByDateAmount = new Map<string, number[]>();
  
  normalizedData2.forEach((row, idx) => {
    const fecha = row.fecha || '';
    const pv = row.referencia || '';
    const monto = row.monto.toFixed(2);
    
    // Clave exacta: fecha + PV + monto
    const datePVAmountKey = `${fecha}|${pv}|${monto}`;
    if (!data2ByDatePVAmount.has(datePVAmountKey)) {
      data2ByDatePVAmount.set(datePVAmountKey, []);
    }
    data2ByDatePVAmount.get(datePVAmountKey)!.push(idx);
    
    // Clave por fecha + PV (sin monto)
    if (fecha && pv) {
      const datePVKey = `${fecha}|${pv}`;
      if (!data2ByDatePV.has(datePVKey)) {
        data2ByDatePV.set(datePVKey, []);
      }
      data2ByDatePV.get(datePVKey)!.push(idx);
    }
    
    // Clave por fecha + monto (sin PV)
    const dateAmountKey = `${fecha}|${monto}`;
    if (!data2ByDateAmount.has(dateAmountKey)) {
      data2ByDateAmount.set(dateAmountKey, []);
    }
    data2ByDateAmount.get(dateAmountKey)!.push(idx);
  });
  
  // PASO 1: Buscar coincidencias exactas (fecha + PV + monto)
  normalizedData1.forEach((row1, idx1) => {
    if (matched1.has(idx1)) return;
    
    const fecha = row1.fecha || '';
    const pv = row1.referencia || '';
    const monto = row1.monto.toFixed(2);
    
    const exactKey = `${fecha}|${pv}|${monto}`;
    const candidates = data2ByDatePVAmount.get(exactKey) || [];
    
    for (const idx2 of candidates) {
      if (matched2.has(idx2)) continue;
      
      const row2 = normalizedData2[idx2];
      // Verificación adicional para asegurar coincidencia exacta
      if (row2.fecha === fecha && row2.referencia === pv && Math.abs(row2.monto - row1.monto) < 0.01) {
        results.push({
          banco: { ...row1, origen: name1 as any },
          interno: { ...row2, origen: name2 as any },
          estado: 'Conciliado',
          origen: 'exacto_fecha_pv_monto'
        });
        
        matched1.add(idx1);
        matched2.add(idx2);
        break;
      }
    }
  });
  
  // PASO 2: Buscar coincidencias por fecha + PV (sin importar monto)
  normalizedData1.forEach((row1, idx1) => {
    if (matched1.has(idx1)) return;
    
    const fecha = row1.fecha || '';
    const pv = row1.referencia || '';
    
    if (!fecha || !pv) return; // Solo si ambos tienen valor
    
    const datePVKey = `${fecha}|${pv}`;
    const candidates = data2ByDatePV.get(datePVKey) || [];
    
    for (const idx2 of candidates) {
      if (matched2.has(idx2)) continue;
      
      const row2 = normalizedData2[idx2];
      // Verificar que fecha y PV coincidan exactamente
      if (row2.fecha === fecha && row2.referencia === pv) {
        results.push({
          banco: { ...row1, origen: name1 as any },
          interno: { ...row2, origen: name2 as any },
          estado: 'Conciliado',
          origen: 'fecha_pv'
        });
        
        matched1.add(idx1);
        matched2.add(idx2);
        break;
      }
    }
  });
  
  // PASO 3: Buscar coincidencias por fecha + monto (sin importar PV)
  normalizedData1.forEach((row1, idx1) => {
    if (matched1.has(idx1)) return;
    
    const fecha = row1.fecha || '';
    const monto = row1.monto.toFixed(2);
    
    const dateAmountKey = `${fecha}|${monto}`;
    const candidates = data2ByDateAmount.get(dateAmountKey) || [];
    
    for (const idx2 of candidates) {
      if (matched2.has(idx2)) continue;
      
      const row2 = normalizedData2[idx2];
      // Verificar que fecha y monto coincidan exactamente
      if (row2.fecha === fecha && Math.abs(row2.monto - row1.monto) < 0.01) {
        results.push({
          banco: { ...row1, origen: name1 as any },
          interno: { ...row2, origen: name2 as any },
          estado: 'Conciliado',
          origen: 'fecha_monto'
        });
        
        matched1.add(idx1);
        matched2.add(idx2);
        break;
      }
    }
  });
  
  // PASO 4: Agregar registros de hoja 1 no conciliados
  normalizedData1.forEach((row1, idx) => {
    if (!matched1.has(idx)) {
      results.push({
        banco: { ...row1, origen: name1 as any },
        interno: null,
        estado: 'No conciliado',
        origen: name1
      });
    }
  });
  
  // PASO 5: Agregar registros de hoja 2 no conciliados
  normalizedData2.forEach((row2, idx) => {
    if (!matched2.has(idx)) {
      results.push({
        banco: {
          fecha: '',
          monto: 0,
          referencia: '',
          descripcion: ''
        } as ExcelRow,
        interno: { ...row2, origen: name2 as any },
        estado: 'No conciliado',
        origen: name2
      });
    }
  });
  
  // Ordenar resultados: primero conciliados, luego por fecha descendente
  results.sort((a, b) => {
    if (a.estado !== b.estado) {
      return a.estado === 'Conciliado' ? -1 : 1;
    }
    const dateA = a.banco?.fecha || a.interno?.fecha || '';
    const dateB = b.banco?.fecha || b.interno?.fecha || '';
    return dateB.localeCompare(dateA);
  });
  
  // Calcular totales
  const conciliados = results.filter(r => r.estado === 'Conciliado');
  const noConciliados = results.filter(r => r.estado === 'No conciliado');
  
  const exactos = conciliados.filter(r => r.origen === 'exacto_fecha_pv_monto').length;
  const fechaPV = conciliados.filter(r => r.origen === 'fecha_pv').length;
  const fechaMonto = conciliados.filter(r => r.origen === 'fecha_monto').length;
  
  console.log(`=== Resultado de Conciliación ===`);
  console.log(`Total conciliados: ${conciliados.length}`);
  console.log(`  - Exactos (fecha+PV+monto): ${exactos}`);
  console.log(`  - Por fecha+PV: ${fechaPV}`);
  console.log(`  - Por fecha+monto: ${fechaMonto}`);
  console.log(`No conciliados: ${noConciliados.length}`);
  
  return {
    results,
    totalConciliados: conciliados.length,
    totalNoConciliados: noConciliados.length,
    montoConciliado: conciliados.reduce((sum, r) => sum + (r.banco?.monto || r.interno?.monto || 0), 0),
    montoNoConciliado: noConciliados.reduce((sum, r) => sum + (r.banco?.monto || r.interno?.monto || 0), 0)
  };
};

// Función para encontrar la columna correspondiente
const findColumnName = (headers: string[], mappingType: keyof typeof COLUMN_MAPPINGS): string | null => {
  const mappings = COLUMN_MAPPINGS[mappingType];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[_\s-]/g, ''));
  
  for (const mapping of mappings) {
    const normalizedMapping = mapping.toLowerCase().replace(/[_\s-]/g, '');
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedMapping) || normalizedMapping.includes(h));
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
};

// Detectar automáticamente las columnas del archivo
const detectColumns = (data: any[]): { fecha: string | null; monto: string | null; referencia: string | null; descripcion: string | null } => {
  if (data.length === 0) return { fecha: null, monto: null, referencia: null, descripcion: null };
  
  const headers = Object.keys(data[0]);
  
  return {
    fecha: findColumnName(headers, 'fecha'),
    monto: findColumnName(headers, 'monto'),
    referencia: findColumnName(headers, 'referencia'),
    descripcion: findColumnName(headers, 'descripcion')
  };
};

export const readExcelFile = (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        
        let jsonData: any[];
        
        if (isCsv) {
          const text = data as string;
          const workbook = XLSX.read(text, { type: 'string', raw: false });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          });
        } else {
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          });
        }
        
        // Detectar columnas automáticamente
        const columns = detectColumns(jsonData);
        
        // Normalizar datos al formato esperado
        const normalizedData: ExcelRow[] = jsonData.map((row, idx) => {
          const fechaValue = columns.fecha ? row[columns.fecha] : '';
          const montoValue = columns.monto ? row[columns.monto] : 0;
          const referenciaValue = columns.referencia ? row[columns.referencia] : '';
          const descripcionValue = columns.descripcion ? row[columns.descripcion] : '';
          
          const fechaNormalizada = normalizeDate(String(fechaValue || ''));
          const montoNormalizado = normalizeMonto(montoValue);
          const pvExtraido = extractPV(String(referenciaValue || ''));
          
          // Validar que tenga fecha y monto válidos
          if (!fechaNormalizada || fechaNormalizada.trim() === '') {
            console.warn(`Fila ${idx + 2}: fecha inválida o vacía, se omite`);
            return null;
          }
          
          if (!montoNormalizado || montoNormalizado <= 0) {
            console.warn(`Fila ${idx + 2}: monto inválido (${montoValue}), se omite`);
            return null;
          }
          
          const excelRow: ExcelRow = {
            fecha: fechaNormalizada,
            monto: Math.round(montoNormalizado * 100) / 100, // Redondear a 2 decimales
            referencia: pvExtraido,
            descripcion: String(descripcionValue || ''),
            // Mantener datos originales para referencia
            _original: row
          };
          return excelRow;
        }).filter((row): row is ExcelRow => row !== null && row.monto > 0); // Filtrar filas sin monto válido
        
        resolve(normalizedData);
      } catch (error) {
        console.error('Error reading file:', error);
        reject(new Error('Error al leer el archivo'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al cargar el archivo'));
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
};

const normalizeDate = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  
  try {
    let str = dateStr.toString().trim();
    if (!str) return '';
    
    // Si es un número (serial de Excel), convertirlo a fecha
    if (/^\d+\.?\d*$/.test(str)) {
      const excelSerial = parseFloat(str);
      // Excel serial dates start from 1900-01-01 (pero hay un bug conocido, así que ajustamos)
      const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
      const date = new Date(excelEpoch.getTime() + excelSerial * 86400000);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    }
    
    // Si es un objeto Date serializado (ISO string)
    if (str.includes('T') || str.includes('Z')) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    }
    
    // Limpiar espacios extra y caracteres no deseados
    str = str.replace(/\s+/g, ' ').trim();
    
    // Formatos comunes con separadores
    const patterns = [
      // DD/MM/YYYY o D/M/YYYY
      { 
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, 
        parse: (m: string[]) => {
          const day = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          const year = parseInt(m[3], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
            return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
          }
          return null;
        }
      },
      // DD-MM-YYYY o D-M-YYYY
      { 
        regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, 
        parse: (m: string[]) => {
          const day = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          const year = parseInt(m[3], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
            return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
          }
          return null;
        }
      },
      // YYYY-MM-DD
      { 
        regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, 
        parse: (m: string[]) => {
          const year = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          const day = parseInt(m[3], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
            return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
          }
          return null;
        }
      },
      // YYYY/MM/DD
      { 
        regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, 
        parse: (m: string[]) => {
          const year = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          const day = parseInt(m[3], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
            return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
          }
          return null;
        }
      },
      // DD.MM.YYYY
      { 
        regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, 
        parse: (m: string[]) => {
          const day = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          const year = parseInt(m[3], 10);
          if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
            return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
          }
          return null;
        }
      },
    ];
    
    for (const pattern of patterns) {
      const match = str.match(pattern.regex);
      if (match) {
        const result = pattern.parse(match);
        if (result) return result;
      }
    }
    
    // Intentar parsear como fecha genérica (último recurso)
    const date = new Date(str);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
      return format(date, 'yyyy-MM-dd');
    }
    
    // Si no se pudo parsear, devolver el string original limpio
    return str;
  } catch (error) {
    console.warn('Error normalizando fecha:', dateStr, error);
    return dateStr;
  }
};

const normalizeMonto = (monto: any): number => {
  // Si es número, devolver valor absoluto redondeado
  if (typeof monto === 'number') {
    if (isNaN(monto) || !isFinite(monto)) return 0;
    return Math.abs(Math.round(monto * 100) / 100);
  }
  
  // Si es string, parsear
  if (typeof monto === 'string') {
    // Limpiar el string de moneda y separadores
    let cleaned = monto
      .replace(/[$€£¥₱₹¢]/g, '') // Remover símbolos de moneda
      .replace(/\s/g, '') // Remover espacios
      .trim();
    
    if (!cleaned || cleaned === '') return 0;
    
    // Detectar formato: 1,234.56 vs 1.234,56
    const hasCommaDecimal = /,\d{1,2}$/.test(cleaned);
    const hasDotDecimal = /\.\d{1,2}$/.test(cleaned);
    
    // Contar separadores de miles
    const commaCount = (cleaned.match(/,/g) || []).length;
    const dotCount = (cleaned.match(/\./g) || []).length;
    
    if (hasCommaDecimal && !hasDotDecimal && commaCount === 1) {
      // Formato europeo: 1.234,56 o 1234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasCommaDecimal && dotCount > 0) {
      // Formato mixto: determinar por posición del último separador
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      if (lastComma > lastDot) {
        // Formato europeo: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato americano: 1,234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    } else {
      // Formato americano o sin decimales: 1,234.56 o 1234.56
      cleaned = cleaned.replace(/,/g, '');
    }
    
    // Remover cualquier carácter no numérico excepto punto y signo menos
    cleaned = cleaned.replace(/[^0-9.-]/g, '');
    
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || !isFinite(parsed)) return 0;
    
    return Math.abs(Math.round(parsed * 100) / 100);
  }
  
  // Si es boolean, convertir
  if (typeof monto === 'boolean') {
    return monto ? 1 : 0;
  }
  
  return 0;
};

const normalizeReferencia = (ref: string): string => {
  if (!ref) return '';
  // Normalizar referencia: quitar espacios, convertir a mayúsculas, quitar caracteres especiales
  return ref.toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// Crear clave única para coincidencia exacta
const createMatchKey = (row: ExcelRow): string => {
  const fecha = row.fecha || '';
  const monto = row.monto.toFixed(2);
  const ref = row.referencia || '';
  return `${fecha}|${monto}|${ref}`;
};

// Crear clave sin referencia para coincidencia por fecha+monto
const createMatchKeyNoRef = (row: ExcelRow): string => {
  const fecha = row.fecha || '';
  const monto = row.monto.toFixed(2);
  return `${fecha}|${monto}`;
};

export const reconcileData = (
  bancoData: ExcelRow[],
  internoData: ExcelRow[],
  pdfData: ExcelRow[] = []
): ProcessedData => {
  const results: ReconciliationResult[] = [];
  const matchedBanco = new Set<number>();
  const matchedInterno = new Set<number>();
  const matchedPdf = new Set<number>();
  
  // Normalizar orígenes
  const normalizedBanco = bancoData.map((row, idx) => ({
    ...row,
    origen: 'banco' as const,
    _idx: idx
  }));
  
  const normalizedInterno = internoData.map((row, idx) => ({
    ...row,
    origen: 'interno' as const,
    _idx: idx
  }));
  
  const normalizedPdf = pdfData.map((row, idx) => ({
    ...row,
    origen: 'pdf' as const,
    _idx: idx
  }));
  
  // PASO 1: Coincidencias exactas (fecha + monto + referencia)
  console.log('=== Iniciando reconciliación ===');
  console.log(`Banco: ${normalizedBanco.length} registros`);
  console.log(`Interno: ${normalizedInterno.length} registros`);
  console.log(`PDF: ${normalizedPdf.length} registros`);
  
  // Crear índices para búsqueda rápida
  const internoByFullKey = new Map<string, number[]>();
  const internoByPartialKey = new Map<string, number[]>();
  
  normalizedInterno.forEach((row, idx) => {
    const fullKey = createMatchKey(row);
    const partialKey = createMatchKeyNoRef(row);
    
    if (!internoByFullKey.has(fullKey)) internoByFullKey.set(fullKey, []);
    internoByFullKey.get(fullKey)!.push(idx);
    
    if (!internoByPartialKey.has(partialKey)) internoByPartialKey.set(partialKey, []);
    internoByPartialKey.get(partialKey)!.push(idx);
  });
  
  // Primero: buscar coincidencias exactas con referencia
  normalizedBanco.forEach((bancoRow, bancoIdx) => {
    if (matchedBanco.has(bancoIdx)) return;
    
    const fullKey = createMatchKey(bancoRow);
    const candidates = internoByFullKey.get(fullKey) || [];
    
    for (const internoIdx of candidates) {
      if (matchedInterno.has(internoIdx)) continue;
      
      // Coincidencia exacta encontrada
      const internoRow = normalizedInterno[internoIdx];
      
      // Buscar si hay un PDF que coincida
      let matchingPdfRow = null;
      for (let pdfIdx = 0; pdfIdx < normalizedPdf.length; pdfIdx++) {
        if (matchedPdf.has(pdfIdx)) continue;
        const pdfRow = normalizedPdf[pdfIdx];
        const pdfKey = createMatchKey(pdfRow);
        if (pdfKey === fullKey || createMatchKeyNoRef(pdfRow) === createMatchKeyNoRef(bancoRow)) {
          matchingPdfRow = pdfRow;
          matchedPdf.add(pdfIdx);
          break;
        }
      }
      
      results.push({
        banco: matchingPdfRow || bancoRow,
        interno: internoRow,
        estado: 'Conciliado',
        origen: matchingPdfRow ? 'pdf' : 'banco'
      });
      
      matchedBanco.add(bancoIdx);
      matchedInterno.add(internoIdx);
      break;
    }
  });
  
  // Segundo: buscar coincidencias por fecha + monto (sin referencia)
  normalizedBanco.forEach((bancoRow, bancoIdx) => {
    if (matchedBanco.has(bancoIdx)) return;
    
    const partialKey = createMatchKeyNoRef(bancoRow);
    const candidates = internoByPartialKey.get(partialKey) || [];
    
    for (const internoIdx of candidates) {
      if (matchedInterno.has(internoIdx)) continue;
      
      const internoRow = normalizedInterno[internoIdx];
      
      // Buscar si hay un PDF que coincida
      let matchingPdfRow = null;
      for (let pdfIdx = 0; pdfIdx < normalizedPdf.length; pdfIdx++) {
        if (matchedPdf.has(pdfIdx)) continue;
        const pdfRow = normalizedPdf[pdfIdx];
        if (createMatchKeyNoRef(pdfRow) === partialKey) {
          matchingPdfRow = pdfRow;
          matchedPdf.add(pdfIdx);
          break;
        }
      }
      
      results.push({
        banco: matchingPdfRow || bancoRow,
        interno: internoRow,
        estado: 'Conciliado',
        origen: matchingPdfRow ? 'pdf' : 'banco'
      });
      
      matchedBanco.add(bancoIdx);
      matchedInterno.add(internoIdx);
      break;
    }
  });
  
  // PASO 2: Agregar registros de banco no conciliados
  normalizedBanco.forEach((bancoRow, idx) => {
    if (!matchedBanco.has(idx)) {
      results.push({
        banco: bancoRow,
        interno: null,
        estado: 'No conciliado',
        origen: 'banco'
      });
    }
  });
  
  // PASO 3: Agregar registros internos no conciliados
  normalizedInterno.forEach((internoRow, idx) => {
    if (!matchedInterno.has(idx)) {
      results.push({
        banco: {
          fecha: '',
          monto: 0,
          referencia: '',
          descripcion: ''
        } as ExcelRow,
        interno: internoRow,
        estado: 'No conciliado',
        origen: 'interno'
      });
    }
  });
  
  // PASO 4: Agregar PDFs no conciliados
  normalizedPdf.forEach((pdfRow, idx) => {
    if (!matchedPdf.has(idx)) {
      results.push({
        banco: pdfRow,
        interno: null,
        estado: 'No conciliado',
        origen: 'pdf'
      });
    }
  });
  
  // Ordenar resultados
  results.sort((a, b) => {
    if (a.estado !== b.estado) {
      return a.estado === 'Conciliado' ? -1 : 1;
    }
    const dateA = a.banco?.fecha || a.interno?.fecha || '';
    const dateB = b.banco?.fecha || b.interno?.fecha || '';
    return dateB.localeCompare(dateA);
  });
  
  // Calcular totales
  const conciliados = results.filter(r => r.estado === 'Conciliado');
  const noConciliados = results.filter(r => r.estado === 'No conciliado');
  
  console.log(`=== Resultado ===`);
  console.log(`Conciliados: ${conciliados.length}`);
  console.log(`No conciliados: ${noConciliados.length}`);
  
  return {
    results,
    totalConciliados: conciliados.length,
    totalNoConciliados: noConciliados.length,
    montoConciliado: conciliados.reduce((sum, r) => sum + (r.banco?.monto || r.interno?.monto || 0), 0),
    montoNoConciliado: noConciliados.reduce((sum, r) => sum + (r.banco?.monto || r.interno?.monto || 0), 0)
  };
};

export const downloadExcel = (data: ProcessedData) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.results.map(result => ({
      'Estado': result.estado,
      'Origen': result.origen,
      'Fecha Banco/PDF': result.banco?.fecha || '-',
      'Monto Banco/PDF': result.banco?.monto || '-',
      'Referencia Banco/PDF': result.banco?.referencia || '-',
      'Descripción Banco/PDF': result.banco?.descripcion || '-',
      'Fecha Interno': result.interno?.fecha || '-',
      'Monto Interno': result.interno?.monto || '-',
      'Referencia Interno': result.interno?.referencia || '-',
      'Descripción Interno': result.interno?.descripcion || '-',
      'Diferencia': result.estado === 'Conciliado' ? 0 : 
        Math.abs((result.banco?.monto || 0) - (result.interno?.monto || 0))
    }))
  );
  
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }
  
  const maxWidth = 25;
  const colWidths = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxLen = 10;
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        const len = cell.v.toString().length;
        if (len > maxLen) maxLen = len;
      }
    }
    colWidths.push({ wch: Math.min(maxLen + 2, maxWidth) });
  }
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Conciliación');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const fileName = `conciliacion_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  saveAs(blob, fileName);
};
