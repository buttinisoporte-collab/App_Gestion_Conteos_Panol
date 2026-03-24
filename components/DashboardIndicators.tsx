import React from 'react';
import { WeekData, WeekStatus } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export default function DashboardIndicators({ weeksData }: { weeksData: WeekData[] }) {
  // --- SEMANA ACTUAL ---
  const currentWeek = weeksData.find(w => w.status === WeekStatus.EnProgreso) || weeksData.find(w => w.status === WeekStatus.Pendiente) || weeksData[weeksData.length - 1];
  const currentItems = currentWeek?.items ||[];
  const currentTotal = currentItems.length;
  const currentCounted = currentItems.filter(i => i.quantity !== null).length;
  const currentDeviations = currentItems.filter(i => i.quantity !== null && i.quantity !== i.systemStock).length;
  const currentCompPct = currentTotal > 0 ? ((currentCounted / currentTotal) * 100).toFixed(2) : '0.00';
  const currentDevPct = currentCounted > 0 ? ((currentDeviations / currentCounted) * 100).toFixed(2) : '0.00';

  // --- CONTEO GENERAL (Todas las semanas) ---
  const allItems = weeksData.flatMap(w => w.items);
  const generalTotal = allItems.length;
  const generalCounted = allItems.filter(i => i.quantity !== null).length;
  const generalDeviations = allItems.filter(i => i.quantity !== null && i.quantity !== i.systemStock).length;
  const generalCompPct = generalTotal > 0 ? ((generalCounted / generalTotal) * 100).toFixed(2) : '0.00';
  const generalDevPct = generalCounted > 0 ? ((generalDeviations / generalCounted) * 100).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cumplimiento (Semana Actual)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-corporate-blue">{currentCompPct}%</div>
          <p className="text-xs text-slate-500">{currentCounted} de {currentTotal} ítems contados.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Desvíos (Semana Actual)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{currentDevPct}%</div>
          <p className="text-xs text-slate-500">{currentDeviations} ítems con diferencias.</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-50 border-corporate-blue/20">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cumplimiento (Conteo General)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-corporate-blue">{generalCompPct}%</div>
          <p className="text-xs text-slate-500">{generalCounted} de {generalTotal} ítems en total.</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-50 border-red-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Desvíos (Conteo General)</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{generalDevPct}%</div>
          <p className="text-xs text-slate-500">{generalDeviations} ítems con diferencias en total.</p>
        </CardContent>
      </Card>
    </div>
  );
}