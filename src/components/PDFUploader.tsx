import { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2, Check, Eye, Image as ImageIcon, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface PDFUploaderProps {
  label: string;
  onPDFProcessed: (payments: any[]) => void;
  className?: string;
}

interface ProcessingFile {
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  payments?: any[];
  error?: string;
}

const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.webp';
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const PDFUploader = ({ label, onPDFProcessed, className }: PDFUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const { toast } = useToast();

  const handleFilesSelection = async (files: File[]) => {
    const validFiles = files.filter(f => ACCEPTED_MIME_TYPES.includes(f.type));
    
    if (validFiles.length === 0) {
      toast({
        title: "Archivos inválidos",
        description: 'Por favor selecciona PDFs o imágenes válidas',
        variant: "destructive",
      });
      return;
    }

    if (validFiles.length !== files.length) {
      toast({
        title: "Algunos archivos fueron ignorados",
        description: `${files.length - validFiles.length} archivos no son del tipo correcto`,
        variant: "destructive",
      });
    }

    // Prepare processing files
    const newProcessingFiles: ProcessingFile[] = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      status: 'pending' as const,
    }));

    setProcessingFiles(newProcessingFiles);
    setShowBatchProcessor(true);

    // Start processing files one by one
    await processBatchFiles(newProcessingFiles);
  };

  const processBatchFiles = async (files: ProcessingFile[]) => {
    const allPayments: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      
      // Update status to processing
      setProcessingFiles(prev => 
        prev.map((f, idx) => idx === i ? { ...f, status: 'processing' as const } : f)
      );

      try {
        const formData = new FormData();
        formData.append('file', fileData.file);

        const { data, error } = await supabase.functions.invoke('process-pdf', {
          body: formData,
        });

        if (error) throw error;

        if (data.success && data.payments) {
          // Update status to completed with payments
          setProcessingFiles(prev => 
            prev.map((f, idx) => idx === i ? { 
              ...f, 
              status: 'completed' as const,
              payments: data.payments 
            } : f)
          );
          
          allPayments.push(...data.payments);
        } else {
          throw new Error(data.error || 'Error al procesar el archivo');
        }
      } catch (error) {
        console.error('Error processing file:', error);
        
        // Update status to error
        setProcessingFiles(prev => 
          prev.map((f, idx) => idx === i ? { 
            ...f, 
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Error desconocido'
          } : f)
        );
      }
    }

    // Notify parent with all collected payments
    onPDFProcessed(allPayments);
    
    toast({
      title: "Procesamiento completado",
      description: `Se procesaron ${files.length} archivos. Total de pagos: ${allPayments.length}`,
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFilesSelection(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFilesSelection(files);
    }
  };

  const closeBatchProcessor = () => {
    setShowBatchProcessor(false);
    setProcessingFiles([]);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>

      {/* Batch Processor Modal */}
      {showBatchProcessor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
          <div className="relative max-w-6xl w-full max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-accent/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Procesamiento de Vouchers</h3>
                    <p className="text-sm text-muted-foreground">
                      {processingFiles.filter(f => f.status === 'completed').length} de {processingFiles.length} procesados
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeBatchProcessor}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  disabled={processingFiles.some(f => f.status === 'processing')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Files Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processingFiles.map((fileData, index) => (
                    <Card key={index} className="p-4 animate-fade-in">
                      <div className="flex gap-4">
                        {/* Image Preview */}
                        {fileData.preview && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-accent">
                            <img 
                              src={fileData.preview} 
                              alt={fileData.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{fileData.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(fileData.file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Badge variant={
                              fileData.status === 'completed' ? 'default' :
                              fileData.status === 'processing' ? 'secondary' :
                              fileData.status === 'error' ? 'destructive' : 'outline'
                            } className="flex-shrink-0">
                              {fileData.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {fileData.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              {fileData.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {fileData.status === 'completed' ? 'Completado' :
                               fileData.status === 'processing' ? 'Procesando' :
                               fileData.status === 'error' ? 'Error' : 'Pendiente'}
                            </Badge>
                          </div>

                          {/* Extracted Data */}
                          {fileData.status === 'processing' && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Extrayendo información del voucher...
                              </p>
                            </div>
                          )}

                          {fileData.payments && fileData.payments.length > 0 && (
                            <div className="mt-3 space-y-2 border-t pt-2">
                              <p className="text-xs font-semibold text-primary">
                                {fileData.payments.length} pago(s) extraído(s):
                              </p>
                              {fileData.payments.map((payment, pIdx) => (
                                <div key={pIdx} className="text-xs space-y-1 bg-accent/30 p-2 rounded">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span className="font-medium">{payment.fecha}</span>
                                  </div>
                                  {payment.hora && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Hora:</span>
                                      <span className="font-medium">{payment.hora}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Monto:</span>
                                    <span className="font-bold text-primary">${payment.monto.toFixed(2)}</span>
                                  </div>
                                  {payment.descripcion && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Descripción:</span>
                                      <span className="font-medium truncate max-w-[150px]" title={payment.descripcion}>
                                        {payment.descripcion}
                                      </span>
                                    </div>
                                  )}
                                  {payment.referencia && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Ref:</span>
                                      <span className="font-mono text-xs">{payment.referencia}</span>
                                    </div>
                                  )}
                                  {payment.esQR && (
                                    <Badge variant="secondary" className="text-xs">QR</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {fileData.error && (
                            <p className="text-xs text-destructive mt-2">{fileData.error}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border bg-accent/30">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total de pagos extraídos: </span>
                    <span className="font-bold text-primary">
                      {processingFiles.reduce((acc, f) => acc + (f.payments?.length || 0), 0)}
                    </span>
                  </div>
                  <Button
                    onClick={closeBatchProcessor}
                    disabled={processingFiles.some(f => f.status === 'processing')}
                  >
                    {processingFiles.some(f => f.status === 'processing') ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Cerrar'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer",
          "hover:border-primary hover:bg-accent/50",
          isDragging ? "border-primary bg-accent/70 scale-[1.02]" : "border-border bg-card"
        )}
      >
        <input
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileInput}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-4 rounded-full bg-accent">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">
              Arrastra tus vouchers aquí
            </p>
            <p className="text-sm text-muted-foreground">
              o haz clic para seleccionar múltiples archivos
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Soporta: PDF, JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
