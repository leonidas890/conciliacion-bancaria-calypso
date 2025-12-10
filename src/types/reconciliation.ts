export interface ExcelRow {
  fecha: string;
  monto: number;
  hora?: string;
  descripcion?: string;
  referencia?: string;
  esQR?: boolean;
  pagina?: number;
  origen?: string;
  [key: string]: any;
}

export interface ReconciliationResult {
  banco: ExcelRow;
  interno: ExcelRow | null;
  estado: 'Conciliado' | 'No conciliado';
  origen: string;
}

export interface ProcessedData {
  results: ReconciliationResult[];
  totalConciliados: number;
  totalNoConciliados: number;
  montoConciliado: number;
  montoNoConciliado: number;
}
