import React from 'react';
import { useAppContext } from '../context/AppContext';
import { WeekStatus, WeekData } from '../types';
import { Card, CardContent } from './ui/Card';
import { Check, Lock } from './ui/Icons';
import ConteoTable from './ConteoTable';
import { Button } from './ui/Button';

const getRealId = (id: string) => id.includes('-') ? id.substring(id.indexOf('-') + 1) : id;

export default function OperarioView() {
    const { weeksData, masterStock, logout } = useAppContext();
    const [selectedWeek, setSelectedWeek] = React.useState<WeekData | null>(null);

    if (selectedWeek) {
        return <ConteoTable week={selectedWeek} onBack={() => setSelectedWeek(null)} onPrint={() => {}} />;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard de Operario</h2>
                <Button onClick={logout} variant="outline">Cerrar Sesión</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {weeksData.map(week => {
                    const isLocked = week.status === WeekStatus.Bloqueado;
                    const isFinalized = week.status === WeekStatus.Finalizado;
                    const isCurrent = week.status === WeekStatus.EnProgreso || week.status === WeekStatus.Pendiente;

                    const weekTotal = week.items.length;
                    const weekCountedItems = week.items.filter(i => i.quantity !== null);
                    const weekCounted = weekCountedItems.length;
                    const progress = weekTotal > 0 ? Math.round((weekCounted / weekTotal) * 100) : 0;

                    const weekDeviations = weekCountedItems.filter(i => i.quantity !== i.systemStock);
                    const weekDevCount = weekDeviations.length;
                    const weekDevPct = weekCounted > 0 ? ((weekDevCount / weekCounted) * 100).toFixed(2) : '0.00';

                    const typeCounts: Record<string, number> = {};
                    weekDeviations.forEach(i => {
                        const realId = getRealId(i.id);
                        const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
                        typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
                    });
                    const breakdown = Object.entries(typeCounts)
                        .map(([tipo, count]) => ({ tipo, pct: weekCounted > 0 ? ((count / weekCounted) * 100).toFixed(2) : '0.00' }))
                        .sort((a,b) => a.tipo.localeCompare(b.tipo));

                    return (
                        <Card key={week.id} className={`cursor-pointer transition-all hover:shadow-md ${isLocked ? 'opacity-60 bg-slate-50' : isCurrent ? 'border-corporate-blue shadow-sm' : 'border-green-200 bg-green-50/30'}`} onClick={() => !isLocked && setSelectedWeek(week)}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className={`text-lg font-bold ${isCurrent ? 'text-corporate-blue' : isLocked ? 'text-slate-400' : 'text-green-700'}`}>{week.name}</h3>
                                    {isFinalized && <Check className="h-5 w-5 text-green-600" />}
                                    {isLocked && <Lock className="h-5 w-5 text-slate-400" />}
                                </div>
                                <p className="text-sm font-semibold mb-1 text-slate-700">{week.status}</p>
                                <p className="text-xs text-slate-500 mb-4">{week.startDate} - {week.endDate}</p>

                                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                                    <div className={`h-1.5 rounded-full ${isFinalized ? 'bg-green-500' : 'bg-corporate-blue'}`} style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mb-2">{progress}% Completado ({weekCounted} de {weekTotal})</p>

                                {/* INDICADORES DE DESVÍOS EN TARJETA */}
                                {weekCounted > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-500 tracking-wider">DESVÍOS</p>
                                                <p className="text-sm font-bold text-red-600">{weekDevPct}%</p>
                                            </div>
                                            <div className="text-[9px] flex flex-col items-end gap-0.5">
                                                {breakdown.length === 0 ? <span className="text-slate-400 mt-1">Sin desvíos</span> : breakdown.map(b => (
                                                    <div key={b.tipo} className="flex items-center gap-1 font-bold text-slate-700">
                                                        <span className="bg-white border border-slate-200 px-1 rounded text-[8px]">{b.tipo}</span>
                                                        <span>{b.pct}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}