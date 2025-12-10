import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  label: string;
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  className?: string;
}

export const FileUploader = ({ label, onFileSelect, selectedFile, className }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')
    );
    
    if (excelFile) {
      onFileSelect(excelFile);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const removeFile = () => {
    onFileSelect(null as any);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      
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
          isDragging ? "border-primary bg-accent/70 scale-105" : "border-border bg-card",
          selectedFile && "border-success bg-success/10"
        )}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success text-success-foreground">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <X className="w-5 h-5" />
              </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-4 rounded-full bg-accent">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                Arrastra tu archivo Excel aquí
              </p>
              <p className="text-sm text-muted-foreground">
                o haz clic para seleccionar (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
