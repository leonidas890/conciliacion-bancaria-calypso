import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedData } from '@/types/reconciliation';

interface ReconciliationBarChartProps {
  data: ProcessedData;
}

export const ReconciliationBarChart = ({ data }: ReconciliationBarChartProps) => {
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChart(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const maxValue = Math.max(data.totalConciliados || 0, data.totalNoConciliados || 0);
  const conciliadosWidth = maxValue > 0 ? ((data.totalConciliados || 0) / maxValue * 100) : 0;
  const noConciliadosWidth = maxValue > 0 ? ((data.totalNoConciliados || 0) / maxValue * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparativa de Conciliación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex flex-col items-center justify-center gap-6 p-4">
          {showChart ? (
            <>
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Conciliados</span>
                    <span className="text-muted-foreground">{data.totalConciliados || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full bg-success transition-all duration-500 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${conciliadosWidth}%` }}
                    >
                      {conciliadosWidth > 10 && (
                        <span className="text-xs text-success-foreground font-medium">
                          {conciliadosWidth.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">No Conciliados</span>
                    <span className="text-muted-foreground">{data.totalNoConciliados || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full bg-warning transition-all duration-500 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${noConciliadosWidth}%` }}
                    >
                      {noConciliadosWidth > 10 && (
                        <span className="text-xs text-warning-foreground font-medium">
                          {noConciliadosWidth.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Total: {(data.totalConciliados || 0) + (data.totalNoConciliados || 0)} registros
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
