import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedData } from '@/types/reconciliation';

interface ReconciliationChartProps {
  data: ProcessedData;
}

export const ReconciliationChart = ({ data }: ReconciliationChartProps) => {
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    // Renderizar el gráfico después de que todo el componente esté montado
    const timer = setTimeout(() => {
      setShowChart(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const total = (data.totalConciliados || 0) + (data.totalNoConciliados || 0);
  const conciliadosPercent = total > 0 ? ((data.totalConciliados || 0) / total * 100).toFixed(1) : '0';
  const noConciliadosPercent = total > 0 ? ((data.totalNoConciliados || 0) / total * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estado de Conciliación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex flex-col items-center justify-center gap-4">
          {showChart ? (
            <>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ 
                      background: `conic-gradient(
                        hsl(var(--success)) 0% ${conciliadosPercent}%,
                        hsl(var(--warning)) ${conciliadosPercent}% 100%
                      )`
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                      <span className="text-foreground text-sm">{conciliadosPercent}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Conciliados</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ 
                      background: `conic-gradient(
                        hsl(var(--warning)) 0% ${noConciliadosPercent}%,
                        hsl(var(--muted)) ${noConciliadosPercent}% 100%
                      )`
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                      <span className="text-foreground text-sm">{noConciliadosPercent}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">No Conciliados</span>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-success"></div>
                  <span>Conciliados: {data.totalConciliados || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-warning"></div>
                  <span>No Conciliados: {data.totalNoConciliados || 0}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">Cargando gráfico...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
