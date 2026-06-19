import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../context/AppContext';
import { CountCycle, WeekData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Button } from './ui/Button';

const getRealId = (id: string) => id.includes('-') ? id.substring(id.indexOf('-') + 1) : id;

export default function HistoryDashboard({ onBack }: { onBack: () => void }) {
  const { historicalCounts, masterStock } = useAppContext();
  const [selectedCycle, setSelectedCycle] = useState<CountCycle | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);

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

  const renderBreakdown = (breakdown: any[]) => (
    <div className="flex flex-col justify-center ml-3 pl-3 border-l border-slate-200 gap-1.5 min-w-[140px]">
       <span className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Apertura x Tipo</span>
       {breakdown.length === 0 ? <span className="text-xs text-slate-400">-</span> : breakdown.map(b => (
          <div key={b.tipo} className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] min-w-[24px] text-center">{b.tipo}</span>
              <span>{b.pct}%</span>
          </div>
       ))}
    </div>
  );

  const handleExportRankingExcel = (cycle: CountCycle) => {
    const allDeviations: any[] = [];
    
    cycle.weeks.forEach(week => {
      week.items.forEach(item => {
        if (item.quantity !== null && item.quantity !== item.systemStock) {
          const realId = getRealId(item.id);
          const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
          const absDiff = Math.abs(item.quantity - item.systemStock);
          
          allDeviations.push({
            'Tipo (ABC)': tipo,
            'Semana': week.name,
            'ID Material': item.id,
            'Descripción': item.description,
            'Stock Sistema': item.systemStock,
            'Cantidad Contada': item.quantity,
            'Diferencia (Real)': item.quantity - item.systemStock,
            'Diferencia (Absoluta)': absDiff,
            'Contado Por': item.countedBy || 'Desconocido',
            'Fecha de Conteo': item.countedDate ? new Date(item.countedDate).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '',
            'Observación Operario': item.operatorObservation || '',
            'Comentario Admin': item.adminComment || ''
          });
        }
      });
    });

    allDeviations.sort((a, b) => {
      if (a['Tipo (ABC)'] < b['Tipo (ABC)']) return -1;
      if (a['Tipo (ABC)'] > b['Tipo (ABC)']) return 1;
      return b['Diferencia (Absoluta)'] - a['Diferencia (Absoluta)'];
    });

    const ws = XLSX.utils.json_to_sheet(allDeviations);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking Desvíos');
    XLSX.writeFile(wb, `Ranking_Desvios_${cycle.name.replace(/ /g, '_')}.xlsx`);
  };

  // VISTA 3: DETALLE DE LOS ÍTEMS DE UNA SEMANA HISTÓRICA
  if (selectedWeek) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button onClick={() => setSelectedWeek(null)} variant="secondary" className="mb-4">&larr; Volver al Ciclo</Button>
        <Card>
            <CardHeader>
                <CardTitle>Detalle Histórico: {selectedWeek.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-[70vh] overflow-y-auto relative border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-slate-100 z-20 shadow-sm outline outline-1 outline-slate-200">
                            <TableRow>
                                <TableHead>ID Material</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-center">Tipo</TableHead>
                                <TableHead className="text-center">Stock / Contado</TableHead>
                                <TableHead className="text-center">Dif.</TableHead>
                                <TableHead>Operario / Fecha</TableHead>
                                <TableHead>Observación</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedWeek.items.map(item => {
                                const realId = getRealId(item.id);
                                const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
                                const hasDiff = item.quantity !== null && item.systemStock !== item.quantity;
                                return (
                                    <TableRow key={item.id} className={hasDiff ? 'bg-red-50' : ''}>
                                        <TableCell className="font-mono text-sm">{item.id}</TableCell>
                                        <TableCell className="font-medium text-sm">{item.description}</TableCell>
                                        <TableCell className="text-center font-bold text-slate-500">{tipo}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-slate-500">{item.systemStock}</span> / <span className="font-bold text-corporate-blue">{item.quantity ?? '-'}</span>
                                        </TableCell>
                                        <TableCell className={`text-center font-bold ${hasDiff ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.quantity !== null ? item.quantity - item.systemStock : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-semibold text-slate-700">
                                                {item.countedBy || '-'}
                                            </div>
                                            {item.countedDate && (
                                                <div className="text-xs text-slate-500 font-normal mt-0.5">
                                                    {new Date(item.countedDate).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm italic text-slate-600">
                                            {item.operatorObservation || '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

    // VISTA 2: DETALLE DEL CICLO (Con botón de Excel y Detalles semanales)
  if (selectedCycle) {
    const allItems = selectedCycle.weeks.flatMap(w => w.items);
    const generalMetrics = calculateMetrics(allItems);

    // Lógica para rankings globales del ciclo
    const obsCount: Record<string, number> = {};
    const matDeviations: Record<string, number> = {};

    allItems.forEach((item: any) => {
      if (item.quantity !== null && item.quantity !== item.systemStock) {
        const obs = item.operatorObservation?.trim() || 'Sin observación';
        obsCount[obs] = (obsCount[obs] || 0) + 1;

        const diff = Math.abs(item.systemStock - item.quantity);
          if (diff > 0) {
            const realId = item.id.includes('-') ? item.id.substring(item.id.indexOf('-') + 1) : item.id;
            const desc = item.description ? item.description.trim() : 'Sin descripción';
            const matName = `${realId} - ${desc}`;
            matDeviations[matName] = (matDeviations[matName] || 0) + diff;
          }
      }
    });

    const obsRanking = Object.entries(obsCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    const top10Materials = Object.entries(matDeviations).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <Button onClick={() => setSelectedCycle(null)} variant="secondary" className="mb-4">&larr; Volver al Historial</Button>
                <h2 className="text-3xl font-bold text-slate-800">Detalle: {selectedCycle.name}</h2>
            </div>
            <Button onClick={() => handleExportRankingExcel(selectedCycle)} className="bg-green-700 text-white hover:bg-green-800 font-bold">
                Descargar Ranking de Desvíos (Excel)
            </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
            <Card className="col-span-1 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Cumplimiento Total del Ciclo</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-corporate-blue">{generalMetrics.compPct}%</div>
                    <p className="text-xs text-slate-500">{generalMetrics.counted} de {generalMetrics.total} ítems contados en total.</p>
                </CardContent>
            </Card>
            <Card className="col-span-1 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Desvíos Totales del Ciclo</CardTitle></CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div className="flex-1">
                        <div className="text-3xl font-bold text-red-600">{generalMetrics.devPct}%</div>
                        <p className="text-xs text-slate-500">{generalMetrics.devCount} ítems con diferencias en todo el ciclo.</p>
                    </div>
                    {renderBreakdown(generalMetrics.breakdown)}
                </CardContent>
            </Card>
            
            <Card className="col-span-1 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Observaciones Detectadas del ciclo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                        {obsRanking.length > 0 ? (
                            <ul className="text-xs text-slate-700 space-y-1">
                                {obsRanking.map((o, idx) => (
                                    <li key={idx} className="flex justify-between border-b border-slate-100 last:border-0 pb-1">
                                        <span className="truncate pr-2">{o.name}</span>
                                        <span className="font-semibold">{o.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400">No hay observaciones.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-1 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top 10 Materiales con desvíos del ciclo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                        {top10Materials.length > 0 ? (
                            <ul className="text-xs text-slate-700 space-y-1">
                                {top10Materials.map((m, idx) => (
                                    <li key={idx} className="flex justify-between border-b border-slate-100 last:border-0 pb-1">
                                        <span className="truncate pr-2" title={m.name}>{m.name}</span>
                                        <span className="font-semibold">{m.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400">No hay desvíos.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Desglose por Semanas</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Semana</TableHead>
                            <TableHead>Fechas</TableHead>
                            <TableHead className="min-w-[390px]">INDICADORES SEMANALES</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedCycle.weeks.map(week => {
                            const weekMetrics = calculateMetrics(week.items);
                            return (
                                <TableRow key={week.id}>
                                    <TableCell className="font-bold text-corporate-blue">{week.name}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{week.startDate} al {week.endDate}</TableCell>
                                    <TableCell className="p-2">
                                        <div className="flex gap-2 justify-start w-full">
                                            <div className="bg-white border border-slate-200 rounded p-2 shadow-sm min-w-[130px] flex flex-col justify-center">
                                                <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-wider">CUMPLIMIENTO</p>
                                                <div className="text-xl font-bold text-corporate-blue leading-none">{weekMetrics.compPct}%</div>
                                                <p className="text-[10px] text-slate-400 mt-1">{weekMetrics.counted} de {weekMetrics.total} ítems.</p>
                                            </div>
                                            <div className="bg-white border border-slate-200 rounded p-2 shadow-sm flex justify-between min-w-[240px]">
                                                <div className="flex flex-col justify-center">
                                                    <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-wider">DESVÍOS</p>
                                                    <div className="text-xl font-bold text-red-600 leading-none">{weekMetrics.devPct}%</div>
                                                    <p className="text-[10px] text-slate-400 mt-1">{weekMetrics.devCount} con dif.</p>
                                                </div>
                                                {renderBreakdown(weekMetrics.breakdown)}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button onClick={() => setSelectedWeek(week)} variant="outline" className="text-sm border-corporate-blue text-corporate-blue">
                                            Ver Detalle de Ítems
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    );
  }

  // VISTA 1: LISTADO DE CICLOS HISTÓRICOS
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver al Dashboard</Button>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Conteos Cerrados</CardTitle>
        </CardHeader>
        <CardContent>
          {historicalCounts.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay conteos en el historial.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Conteo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Semanas</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalCounts.map(cycle => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-bold">{cycle.name}</TableCell>
                    <TableCell>{cycle.startDate} al {cycle.endDate}</TableCell>
                    <TableCell>{cycle.weeks.length}</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => setSelectedCycle(cycle)} variant="outline" className="border-corporate-blue text-corporate-blue">
                        Ver Detalles y Desvíos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}