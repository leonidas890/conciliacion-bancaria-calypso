import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { PDFUploader } from '@/components/PDFUploader';
import { ReconciliationTable } from '@/components/ReconciliationTable';
import { StatCard } from '@/components/StatCard';
import { ReconciliationChart } from '@/components/ReconciliationChart';
import { ReconciliationBarChart } from '@/components/ReconciliationBarChart';
import { Button } from '@/components/ui/button';
import { Download, GitCompare, Loader2, CheckCircle2, AlertCircle, DollarSign, FileText, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { readExcelFile, reconcileData, downloadExcel, readExcelFileAllSheets, reconcileSheetsFromFile, MultiSheetData } from '@/utils/excelProcessor';
import { ProcessedData, ExcelRow } from '@/types/reconciliation';
import { toast } from 'sonner';
import calypsoLogo from '@/assets/calypso-logo.png';

const Index = () => {
  const [bancoFile, setBancoFile] = useState<File | null>(null);
  const [internoFile, setInternoFile] = useState<File | null>(null);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [pdfPayments, setPdfPayments] = useState<ExcelRow[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'two-files' | 'single-file'>('single-file');

  // Reconciliar un solo archivo con múltiples hojas
  const handleReconcileSingleFile = async () => {
    if (!singleFile) {
      toast.error('Por favor, carga un archivo Excel con dos hojas');
      return;
    }

    setIsProcessing(true);
    setProcessedData(null); // Limpiar datos previos
    
    try {
      const sheets = await readExcelFileAllSheets(singleFile);
      
      if (sheets.length < 2) {
        toast.error(`El archivo solo tiene ${sheets.length} hoja(s). Se necesitan al menos 2 hojas para reconciliar.`);
        setIsProcessing(false);
        return;
      }

      console.log('Hojas encontradas:', sheets.map(s => `${s.sheetName}: ${s.data.length} registros`));
      
      if (sheets[0].data.length === 0 || sheets[1].data.length === 0) {
        toast.error('Una o ambas hojas están vacías o no contienen datos válidos.');
        setIsProcessing(false);
        return;
      }
      
      const results = reconcileSheetsFromFile(sheets);
      
      // Validar que los resultados sean válidos
      if (!results || !results.results || !Array.isArray(results.results)) {
        throw new Error('Error al generar resultados de conciliación');
      }
      
      setProcessedData(results);
      
      toast.success(
        `Conciliación completada: ${results.totalConciliados} coincidencias exactas entre "${sheets[0].sheetName}" y "${sheets[1].sheetName}"`
      );
    } catch (error: any) {
      console.error('Error al procesar archivo:', error);
      const errorMessage = error?.message || 'Error desconocido al procesar el archivo';
      toast.error(`Error: ${errorMessage}. Verifica que sea un archivo Excel válido.`);
      setProcessedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reconciliar dos archivos separados
  const handleReconcileTwoFiles = async () => {
    if (!bancoFile || !internoFile) {
      toast.error('Por favor, carga ambos archivos Excel');
      return;
    }

    setIsProcessing(true);
    setProcessedData(null); // Limpiar datos previos
    
    try {
      const bancoData = await readExcelFile(bancoFile);
      const internoData = await readExcelFile(internoFile);

      if (!bancoData || !Array.isArray(bancoData) || !bancoData.length) {
        toast.error('El archivo bancario está vacío o no se detectaron columnas válidas de fecha/monto');
        setIsProcessing(false);
        return;
      }

      if (!internoData || !Array.isArray(internoData) || !internoData.length) {
        toast.error('El archivo interno está vacío o no se detectaron columnas válidas de fecha/monto');
        setIsProcessing(false);
        return;
      }

      console.log('Datos banco:', bancoData.slice(0, 3));
      console.log('Datos interno:', internoData.slice(0, 3));

      const results = reconcileData(bancoData, internoData, pdfPayments);
      
      // Validar que los resultados sean válidos
      if (!results || !results.results || !Array.isArray(results.results)) {
        throw new Error('Error al generar resultados de conciliación');
      }
      
      setProcessedData(results);
      
      const qrPayments = results.results.filter(r => r.banco?.esQR || r.interno?.esQR).length;
      const pdfConciliados = results.results.filter(r => r.origen === 'pdf' && r.estado === 'Conciliado').length;
      
      toast.success(
        `Conciliación completada: ${results.totalConciliados} coinciden${qrPayments > 0 ? ` (${qrPayments} QR)` : ''}${pdfConciliados > 0 ? `, ${pdfConciliados} vouchers PDF conciliados` : ''}`
      );
    } catch (error: any) {
      console.error('Error al procesar archivos:', error);
      const errorMessage = error?.message || 'Error desconocido al procesar los archivos';
      toast.error(`Error: ${errorMessage}. Verifica que sean archivos Excel válidos.`);
      setProcessedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedData) return;
    
    try {
      downloadExcel(processedData);
      toast.success('Excel descargado exitosamente');
    } catch (error) {
      toast.error('Error al generar el archivo Excel');
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg shadow-elegant">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Conciliación Bancaria Automática
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema profesional de conciliación por fecha y monto
                </p>
              </div>
            </div>
            <img src={calypsoLogo} alt="Calypso" className="h-12 object-contain" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Mode Selector */}
          <div className="flex gap-4 mb-4">
            <Button
              variant={mode === 'single-file' ? 'default' : 'outline'}
              onClick={() => setMode('single-file')}
              className={mode === 'single-file' ? 'gradient-primary text-white' : ''}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Un archivo (múltiples hojas)
            </Button>
            <Button
              variant={mode === 'two-files' ? 'default' : 'outline'}
              onClick={() => setMode('two-files')}
              className={mode === 'two-files' ? 'gradient-primary text-white' : ''}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Dos archivos separados
            </Button>
          </div>

          {/* File Upload Section */}
          <section className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-card border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              {mode === 'single-file' ? 'Cargar archivo Excel con dos hojas' : 'Cargar dos archivos'}
            </h2>
            
            {mode === 'single-file' ? (
              <div className="mb-6">
                <FileUploader
                  label="📊 Archivo Excel con dos hojas (SAP + Banco)"
                  onFileSelect={setSingleFile}
                  selectedFile={singleFile}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  El archivo debe tener al menos 2 hojas. La primera hoja se cruza contra la segunda.
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <FileUploader
                    label="📊 Archivo de Pagos Bancarios (Excel/CSV)"
                    onFileSelect={setBancoFile}
                    selectedFile={bancoFile}
                  />
                  <FileUploader
                    label="📝 Archivo de Pagos Internos (Excel/CSV)"
                    onFileSelect={setInternoFile}
                    selectedFile={internoFile}
                  />
                </div>

                <div className="mb-6">
                  <PDFUploader
                    label="📄 Archivo PDF con Vouchers (Opcional)"
                    onPDFProcessed={setPdfPayments}
                  />
                  {pdfPayments.length > 0 && (
                    <p className="text-sm text-success-foreground mt-2">
                      ✅ {pdfPayments.length} pagos extraídos del PDF
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={mode === 'single-file' ? handleReconcileSingleFile : handleReconcileTwoFiles}
                disabled={mode === 'single-file' ? !singleFile || isProcessing : !bancoFile || !internoFile || isProcessing}
                size="lg"
                className="gradient-primary text-white font-semibold shadow-elegant hover:scale-105 transition-transform"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <GitCompare className="w-5 h-5 mr-2" />
                    {mode === 'single-file' ? 'Cruzar Hojas del Archivo' : 'Conciliar Archivos'}
                  </>
                )}
              </Button>

              {processedData && (
                <Button
                  onClick={handleDownload}
                  size="lg"
                  variant="outline"
                  className="font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Descargar Excel Conciliado
                </Button>
              )}
            </div>
          </section>

          {/* Dashboard Section */}
          {processedData && (
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  📊 Panel de Control
                </h2>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <StatCard
                    title="Total Registros"
                    value={processedData.results.length}
                    icon={FileText}
                    color="primary"
                  />
                  <StatCard
                    title="Conciliados"
                    value={processedData.totalConciliados}
                    icon={CheckCircle2}
                    color="success"
                  />
                  <StatCard
                    title="No Conciliados"
                    value={processedData.totalNoConciliados}
                    icon={AlertCircle}
                    color="warning"
                  />
                  <StatCard
                    title="Monto Conciliado"
                    value={`$${processedData.montoConciliado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    color="accent"
                  />
                </div>

                {processedData && processedData.results && processedData.results.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6" key={`charts-${processedData.results.length}`}>
                    <ReconciliationChart key="pie-chart" data={processedData} />
                    <ReconciliationBarChart key="bar-chart" data={processedData} />
                  </div>
                )}
            </section>
          )}

          {/* Results Section */}
          {processedData && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                📋 Resultados de Conciliación
              </h2>
              <ReconciliationTable data={processedData} />
            </section>
          )}

          {/* Instructions */}
          {!processedData && (
            <section className="bg-accent/30 rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-3">📖 Instrucciones de uso:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span><strong>Un archivo con 2 hojas:</strong> Sube un Excel con la información SAP en la primera hoja y los datos del banco en la segunda</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span><strong>Dos archivos separados:</strong> Sube el archivo bancario y el archivo interno por separado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>El sistema detecta automáticamente las columnas: fecha, monto/valor, PV/referencia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>El cruce es exacto: primero por fecha+monto+PV, luego por fecha+monto</span>
                </li>
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/50 bg-card/30 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Sistema de Conciliación Bancaria Automática © 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
