import React from 'react';
import { WeekData, WeekStatus } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useAppContext } from '../context/AppContext';

export default function DashboardIndicators({ weeksData }: { weeksData: WeekData[] }) {
  const { masterStock } = useAppContext();

  const getRealId = (id: string) => id.includes('-') ? id.substring(id.indexOf('-') + 1) : id;

  const calculateMetrics = (items: any[]) => {
      const total = items.length;
      const countedItems = items.filter((i: any) => i.quantity !== null);
      const counted = countedItems.length;
      const deviations = countedItems.filter((i: any) => i.quantity !== i.systemStock);
      const devCount = deviations.length;

      const compPct = total > 0 ? ((counted / total) * 100).toFixed(2) : '0.00';
      const devPct = counted > 0 ? ((devCount / counted) * 100).toFixed(2) : '0.00';

      const typeCounts: Record<string, number> = {};
      deviations.forEach((i: any) => {
          const realId = getRealId(i.id);
          const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
          typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
      });

      const breakdown = Object.entries(typeCounts)
          .map(([tipo, count]) => ({ tipo, pct: counted > 0 ? ((count / counted) * 100).toFixed(2) : '0.00' }))
          .sort((a,b) => a.tipo.localeCompare(b.tipo));

      return { total, counted, devCount, compPct, devPct, breakdown };
  };

  const currentWeek = weeksData.find(w => w.status === WeekStatus.EnProgreso) || weeksData.find(w => w.status === WeekStatus.Pendiente) || weeksData[weeksData.length - 1];
  const currentMetrics = calculateMetrics(currentWeek?.items ||[]);
  const generalMetrics = calculateMetrics(weeksData.flatMap(w => w.items));

  // DISEÑO MEJORADO: Letras más grandes y etiquetas para los tipos
  const renderBreakdown = (breakdown: any[]) => (
     <div className="flex flex-col ml-4 border-l pl-4 border-slate-200 justify-center min-w-[120px]">
         <span className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-wider">Apertura x Tipo</span>
         {breakdown.length === 0 ? (
             <span className="text-sm font-normal text-slate-400">Sin desvíos</span>
         ) : (
             <div className="flex flex-col gap-1.5">
                 {breakdown.map(b => (
                     <div key={b.tipo} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                         <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs min-w-[28px] text-center">
                             {b.tipo}
                         </span>
                         <span>{b.pct}%</span>
                     </div>
                 ))}
             </div>
         )}
     </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cumplimiento (Semana Actual)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-corporate-blue">{currentMetrics.compPct}%</div>
          <p className="text-xs text-slate-500">{currentMetrics.counted} de {currentMetrics.total} ítems contados.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Desvíos (Semana Actual)</CardTitle></CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="flex-1">
              <div className="text-3xl font-bold text-red-600">{currentMetrics.devPct}%</div>
              <p className="text-xs text-slate-500">{currentMetrics.devCount} ítems con diferencias.</p>
          </div>
          {renderBreakdown(currentMetrics.breakdown)}
        </CardContent>
      </Card>
      <Card className="bg-slate-50 border-corporate-blue/20">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cumplimiento (Conteo General)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-corporate-blue">{generalMetrics.compPct}%</div>
          <p className="text-xs text-slate-500">{generalMetrics.counted} de {generalMetrics.total} ítems en total.</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-50 border-red-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Desvíos (Conteo General)</CardTitle></CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="flex-1">
              <div className="text-3xl font-bold text-red-600">{generalMetrics.devPct}%</div>
              <p className="text-xs text-slate-500">{generalMetrics.devCount} ítems con diferencias en total.</p>
          </div>
          {renderBreakdown(generalMetrics.breakdown)}
        </CardContent>
      </Card>
    </div>
  );
}