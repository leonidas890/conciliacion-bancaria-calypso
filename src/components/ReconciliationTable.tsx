import { CheckCircle2, XCircle, QrCode, FileText, Building2, ClipboardList } from 'lucide-react';
import { ProcessedData } from '@/types/reconciliation';
import { Badge } from '@/components/ui/badge';

interface ReconciliationTableProps {
  data: ProcessedData;
}

const getOrigenIcon = (origen: string) => {
  if (origen === 'pdf') return <FileText className="w-3 h-3" />;
  if (origen === 'interno' || origen.toLowerCase().includes('interno')) return <ClipboardList className="w-3 h-3" />;
  return <Building2 className="w-3 h-3" />;
};

const getOrigenLabel = (origen: string) => {
  if (origen === 'pdf') return 'PDF';
  if (origen === 'interno') return 'Interno';
  if (origen === 'banco') return 'Banco';
  if (origen === 'exacto') return 'Exacto';
  if (origen === 'fecha_monto') return 'Fecha+Monto';
  return origen;
};

export const ReconciliationTable = ({ data }: ReconciliationTableProps) => {
  if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-card p-6">
        <p className="text-center text-muted-foreground">No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-border bg-accent/30">
        <div className="text-center">
          <p className="text-2xl font-bold text-success-foreground">{data.totalConciliados}</p>
          <p className="text-xs text-muted-foreground">Conciliados</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning-foreground">{data.totalNoConciliados}</p>
          <p className="text-xs text-muted-foreground">No conciliados</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            ${data.montoConciliado.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Monto conciliado</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            ${data.montoNoConciliado.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Monto pendiente</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Origen</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Hora</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Monto Banco</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Monto Interno</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Diferencia</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((row, index) => {
              const bancoMonto = row.banco?.monto || 0;
              const internoMonto = row.interno?.monto || 0;
              const diferencia = Math.abs(bancoMonto - internoMonto);
              const isReconciled = row.estado === 'Conciliado';
              const fecha = row.banco?.fecha || row.interno?.fecha || '-';
              const hora = row.banco?.hora || row.interno?.hora || '-';
              const descripcion = row.banco?.descripcion || row.interno?.descripcion || '-';

              return (
                <tr
                  key={`row-${index}-${fecha}-${bancoMonto}`}
                  className={`border-t border-border transition-colors hover:bg-accent/20 ${
                    isReconciled ? 'bg-success/5' : 'bg-warning/5'
                  }`}
                >
                  <td className="px-4 py-3">
                    <Badge
                      variant={isReconciled ? 'default' : 'secondary'}
                      className={`${
                        isReconciled 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-warning text-warning-foreground'
                      }`}
                    >
                      {isReconciled ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {row.estado}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="gap-1">
                      {getOrigenIcon(row.origen)}
                      {getOrigenLabel(row.origen)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {(row.banco?.esQR || row.interno?.esQR) && (
                      <Badge variant="outline" className="gap-1 bg-primary/10">
                        <QrCode className="w-3 h-3" />
                        QR
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {fecha}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {hora}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {row.banco?.monto ? `$${row.banco.monto.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {row.interno?.monto ? `$${row.interno.monto.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {isReconciled ? (
                      <span className="text-success-foreground">$0.00</span>
                    ) : (
                      <span className="text-warning-foreground">${diferencia.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {descripcion}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
