import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import DashboardIndicators from './DashboardIndicators';
import { useAppContext } from '../context/AppContext';
import { WeekStatus, WeekData, User } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { PieChart, Activity, Check, Printer, RefreshCw } from './ui/Icons';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Modal from './ui/Modal';
import AlertDialog from './ui/AlertDialog';
import CrearConteo from './CrearConteo';
import PrintView from './PrintView';
import HistoryDashboard from './HistoryDashboard';
import UserManagement from './UserManagement';
import OperatorChart from './OperatorChart';
import Settings from './Settings';
import MasterStockManager from './MasterStockManager';

const WeekRankings = ({ items }: { items: any[] }) => {
  const [isObsExpanded, setIsObsExpanded] = React.useState(false);
  const [isTopExpanded, setIsTopExpanded] = React.useState(false);

  const obsCount: Record<string, number> = {};
  const matDeviations: Record<string, number> = {};

  items.forEach((item: any) => {
    if (item.quantity !== null && item.quantity !== item.systemStock) {
      const obs = item.operatorObservation?.trim() || 'Sin observación';
      obsCount[obs] = (obsCount[obs] || 0) + 1;

      const diff = Math.abs(item.systemStock - item.quantity);
      if (diff > 0) {
        const desc = item.description ? item.description.trim() : 'Sin descripción';
        const matName = item.manufacturerCode ? `${item.manufacturerCode} - ${desc}` : desc;
        matDeviations[matName] = (matDeviations[matName] || 0) + diff;
      }
    }
  });

  const obsRanking = Object.entries(obsCount).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  const top10Materials = Object.entries(matDeviations).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

  // Si no hay observaciones ni desvíos, no mostramos nada
  if (obsRanking.length === 0 && top10Materials.length === 0) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-2 mt-2 w-full">
      {obsRanking.length > 0 && (
        <div className="border border-gray-200 rounded-md p-2 bg-white flex-1 min-w-[250px] shadow-sm">
          <div 
            className="flex justify-between items-center cursor-pointer mb-1"
            onClick={() => setIsObsExpanded(!isObsExpanded)}
          >
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Observaciones Detectadas</span>
            <span className="text-red-500 text-xs">{isObsExpanded ? '▲' : '▼'}</span>
          </div>
          {isObsExpanded && (
            <ul className="text-xs text-gray-700 mt-2 space-y-1">
              {obsRanking.map((o, idx) => (
                <li key={idx} className="flex justify-between border-b border-gray-100 last:border-0 pb-1">
                  <span className="truncate pr-2">{o.name}</span>
                  <span className="font-semibold">{o.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {top10Materials.length > 0 && (
        <div className="border border-gray-200 rounded-md p-2 bg-white flex-1 min-w-[250px] shadow-sm">
          <div 
            className="flex justify-between items-center cursor-pointer mb-1"
            onClick={() => setIsTopExpanded(!isTopExpanded)}
          >
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Top 10 Materiales con Desvíos</span>
            <span className="text-red-500 text-xs">{isTopExpanded ? '▲' : '▼'}</span>
          </div>
          {isTopExpanded && (
            <ul className="text-xs text-gray-700 mt-2 space-y-1">
              {top10Materials.map((m, idx) => (
                <li key={idx} className="flex justify-between border-b border-gray-100 last:border-0 pb-1">
                  <span className="truncate pr-2 max-w-[220px]" title={m.name}>{m.name}</span>
                  <span className="font-semibold">{m.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const getRealId = (id: string) => id.includes('-') ? id.substring(id.indexOf('-') + 1) : id;

export const getStatusBadge = (status: WeekStatus) => {
  const styles = { [WeekStatus.Bloqueado]: 'bg-slate-200 text-slate-700',[WeekStatus.Pendiente]: 'bg-yellow-200 text-yellow-800',[WeekStatus.EnProgreso]: 'bg-blue-200 text-blue-800',[WeekStatus.Finalizado]: 'bg-green-200 text-green-800' };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
};

export const AdminWeekDetailView: React.FC<{ week: WeekData; onBack: () => void; }> = ({ week, onBack }) => {
    const { masterStock } = useAppContext();
    const [filters, setFilters] = useState({ id: '', desc: '', loc: '', type: '', stock: '', counted: '', obs: '', admin: '' });

    const filteredItems = week.items.filter(item => {
        const realId = getRealId(item.id);
        const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
        return (
            item.id.toLowerCase().includes(filters.id.toLowerCase()) &&
            item.description.toLowerCase().includes(filters.desc.toLowerCase()) &&
            item.location.toLowerCase().includes(filters.loc.toLowerCase()) &&
            tipo.toLowerCase().includes(filters.type.toLowerCase()) &&
            String(item.systemStock).toLowerCase().includes(filters.stock.toLowerCase()) &&
            String(item.quantity ?? '').toLowerCase().includes(filters.counted.toLowerCase()) &&
            (item.operatorObservation || '').toLowerCase().includes(filters.obs.toLowerCase()) &&
            (item.adminComment || '').toLowerCase().includes(filters.admin.toLowerCase())
        );
    });

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button onClick={onBack} variant="secondary" className="mb-4">&larr; Volver</Button>
            <Card>
                <CardHeader>
                    <CardTitle>Detalle del Conteo - {week.name}</CardTitle>
                    <CardDescription>Utilice los cuadros de texto en las cabeceras para filtrar la información. Mostrando {filteredItems.length} ítems.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[60vh] overflow-y-auto relative border rounded-md">
                        <Table className="relative w-full">
                           <TableHeader className="sticky top-0 bg-slate-100 z-20 shadow-sm outline outline-1 outline-slate-200">
                                <TableRow>
                                    <TableHead className="hidden sm:table-cell align-top p-2">
                                        <div className="mb-1 text-xs">ID Material</div>
                                        <Input className="h-6 text-[10px] px-1 w-full" placeholder="Filtrar..." value={filters.id} onChange={e => setFilters({...filters, id: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="align-top p-2">
                                        <div className="mb-1 text-xs">Descripción</div>
                                        <Input className="h-6 text-[10px] px-1 w-full" placeholder="Filtrar..." value={filters.desc} onChange={e => setFilters({...filters, desc: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell align-top p-2">
                                        <div className="mb-1 text-xs">Ubicación</div>
                                        <Input className="h-6 text-[10px] px-1 w-full" placeholder="Filtrar..." value={filters.loc} onChange={e => setFilters({...filters, loc: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell text-center align-top p-2">
                                        <div className="mb-1 text-xs">Tipo</div>
                                        <Input className="h-6 text-[10px] px-1 text-center w-12 mx-auto" placeholder="Tipo" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell text-center align-top p-2">
                                        <div className="mb-1 text-xs">Stock</div>
                                        <Input className="h-6 text-[10px] px-1 text-center w-16 mx-auto" placeholder="Stock" value={filters.stock} onChange={e => setFilters({...filters, stock: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="text-center align-top p-2">
                                        <div className="mb-1 text-xs">Contado</div>
                                        <Input className="h-6 text-[10px] px-1 text-center w-16 mx-auto" placeholder="Cont." value={filters.counted} onChange={e => setFilters({...filters, counted: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="align-top p-2">
                                        <div className="mb-1 text-xs">Obs. Operario</div>
                                        <Input className="h-6 text-[10px] px-1 w-full" placeholder="Filtrar..." value={filters.obs} onChange={e => setFilters({...filters, obs: e.target.value})} />
                                    </TableHead>
                                    <TableHead className="align-top p-2">
                                        <div className="mb-1 text-xs">Comentario Admin</div>
                                        <Input className="h-6 text-[10px] px-1 w-full" placeholder="Filtrar..." value={filters.admin} onChange={e => setFilters({...filters, admin: e.target.value})} />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => {
                                    const realId = getRealId(item.id);
                                    const tipo = masterStock[realId]?.type?.toUpperCase() || 'S/T';
                                    return (
                                        <TableRow key={item.id} className={item.quantity !== null && item.systemStock !== item.quantity ? 'bg-red-50' : ''}>
                                            <TableCell className="font-mono sm:table-cell hidden">{item.id}</TableCell>
                                            <TableCell className="font-medium">
                                                <div className="sm:hidden"><span className="font-bold">{item.id}</span> - {item.location} - Tipo: {tipo}</div>
                                                {item.description}
                                            </TableCell>
                                            <TableCell className="font-mono sm:table-cell hidden">{item.location}</TableCell>
                                            <TableCell className="text-center font-bold text-slate-500 sm:table-cell hidden">{tipo}</TableCell>
                                            <TableCell className="text-center font-semibold text-slate-600 sm:table-cell hidden">{item.systemStock}</TableCell>
                                            <TableCell className={`text-center font-bold ${item.quantity !== null && item.systemStock !== item.quantity ? 'text-red-600' : 'text-green-700'}`}>
                                                <span className="sm:hidden font-normal text-slate-500">Contado: </span>{item.quantity ?? 'No contado'}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{item.operatorObservation || '-'}</TableCell>
                                            <TableCell className="text-sm font-semibold text-amber-700">{item.adminComment || '-'}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const DashboardView: React.FC<{
    // ... todo igual a tu archivo actual ...
    onShowCreate: () => void;
    onSelectWeek: (week: WeekData) => void;
    onPrintWeek: (week: WeekData) => void;
    onShowHistory: () => void;
    onShowUsers: () => void;
    onFinalizeWeek: (week: WeekData) => void;
    onDeleteCount: () => void;
    user: User | null;
    onShowSettings: () => void;
    onShowReset: () => void;
    onShowMasterStock: () => void;
}> = ({ onShowCreate, onSelectWeek, onPrintWeek, onShowHistory, onShowUsers, onFinalizeWeek, onDeleteCount, user, onShowSettings, onShowReset, onShowMasterStock }) => {
    const { weeksData, refreshData, users, updateWeekComment, masterStock } = useAppContext();
    const finalizedWeeks = weeksData.filter(w => w.status === WeekStatus.Finalizado).length;
    const totalWeeks = weeksData.length;
    const progressPercentage = totalWeeks > 0 ? Math.round((finalizedWeeks / totalWeeks) * 100) : 0;
    
    const today = new Date().toISOString().split('T')[0];
    const itemsCountedToday = weeksData
      .flatMap(w => w.items)
      .filter(item => item.countedDate && item.countedDate.startsWith(today) && item.quantity !== null && item.quantity > 0).length;

    const handleExportExcel = (week: WeekData) => {
      const data = week.items.map(item => {
          const realId = getRealId(item.id);
          return {
              'ID Material': item.id,
              'Descripción': item.description,
              'Ubicación': item.location,
              'Stock Sistema': item.systemStock,
              'Cantidad Contada': item.quantity ?? 'No contado',
              'Diferencia': item.quantity !== null ? item.quantity - item.systemStock : '',
              'Tipo de Artículo': masterStock[realId]?.type || 'S/T',
              'Observación Operario': item.operatorObservation || '',
              'Comentario Admin': item.adminComment || '',
              'Fecha Conteo': item.countedDate ? new Date(item.countedDate).toLocaleDateString('es-AR') : '',
              'Contado Por': item.countedBy || ''
          };
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Conteo');
      XLSX.writeFile(wb, `Conteo_${week.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-3xl font-bold text-slate-800">Dashboard de Administrador</h2>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {user?.role === 'admin' && (
                  <Button onClick={onShowMasterStock} variant="outline" className="border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold">Cargar Stock Maestro</Button>
                )}
                
                <Button onClick={onShowHistory} variant="secondary">Ver Historial de Conteos</Button>
                
                {user?.role === 'admin' && (
                  <>
                    <Button onClick={onShowUsers} variant="secondary">Gestionar Usuarios</Button>
                    <Button onClick={onShowSettings} variant="outline">Configuración</Button>
                    <Button onClick={onShowCreate} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">Crear Nuevo Conteo</Button>
                  </>
                )}
                
                {user?.username === 'admin' && (
                  <Button onClick={onShowReset} variant="destructive">Reiniciar Datos</Button>
                )}
                {user?.username === 'admin' && weeksData.length > 0 && (
                  <Button onClick={onDeleteCount} variant="destructive">Eliminar Conteo</Button>
                )}
                <Button onClick={refreshData} variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {weeksData.length === 0 ? (
              <Card className="text-center py-12">
                <CardHeader>
              <CardTitle>No hay un conteo activo</CardTitle>
              <CardDescription>
                {user?.role === 'admin' ? 'Cree un nuevo ciclo de conteo para comenzar a trabajar.' : 'Actualmente no hay ningún conteo activo.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.role === 'admin' && (
                <Button onClick={onShowCreate} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">Crear Nuevo Conteo</Button>
              )}
            </CardContent>
            </Card>
            ) : (
              <div className="mb-8">
                <DashboardIndicators weeksData={weeksData} />
              </div>
            )}
            
            {weeksData.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Progreso General (Semanas)</CardTitle>
                      <PieChart className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{progressPercentage}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Ítems Contados Hoy</CardTitle>
                      <Activity className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{itemsCountedToday}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-8">
                  <OperatorChart weeksData={weeksData} users={users} />
                </div>
          
                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Semanas (Conteo Actual)</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Semana</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="min-w-[390px]">INDICADORES SEMANALES</TableHead>
                          <TableHead className="text-center">Descargas</TableHead>
                          <TableHead>Comentario de Admin</TableHead>
                          <TableHead className="text-right">Finalizar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weeksData.map((week) => {
                          const weekTotal = week.items.length;
                          const weekCountedItems = week.items.filter(i => i.quantity !== null);
                          const weekCounted = weekCountedItems.length;
                          const weekDeviations = weekCountedItems.filter(i => i.quantity !== i.systemStock);
                          const weekDevCount = weekDeviations.length;
                          const weekCompPct = weekTotal > 0 ? ((weekCounted / weekTotal) * 100).toFixed(2) : '0.00';
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
                            <TableRow key={week.id}>
                              <TableCell className="font-medium cursor-pointer hover:underline text-corporate-blue" onClick={() => week.status !== WeekStatus.Bloqueado && onSelectWeek(week)}>{week.name}</TableCell>
                              <TableCell>{getStatusBadge(week.status)}</TableCell>
                              
                              <TableCell className="p-2">
                                <div className="flex flex-col gap-2 w-full">
                                  <div className="flex gap-2 justify-start w-full">
                                    <div className="bg-white border border-slate-200 rounded p-2 shadow-sm min-w-[130px] flex flex-col justify-center">
                                      <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-wider">CUMPLIMIENTO</p>
                                      <div className="text-xl font-bold text-corporate-blue leading-none">{weekCompPct}%</div>
                                      <p className="text-[10px] text-slate-400 mt-1">{weekCounted} de {weekTotal} ítems.</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded p-2 shadow-sm flex justify-between min-w-[240px]">
                                      <div className="flex flex-col justify-center">
                                        <p className="text-[10px] text-slate-500 font-bold mb-1 tracking-wider">DESVÍOS</p>
                                        <div className="text-xl font-bold text-red-600 leading-none">{weekDevPct}%</div>
                                        <p className="text-[10px] text-slate-400 mt-1">{weekDevCount} con dif.</p>
                                      </div>
                                      <div className="flex flex-col justify-center ml-3 pl-3 border-l border-slate-200 gap-1.5">
                                         {breakdown.length === 0 ? <span className="text-xs text-slate-400">-</span> : breakdown.map(b => (
                                            <div key={b.tipo} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] min-w-[24px] text-center">{b.tipo}</span>
                                                <span>{b.pct}%</span>
                                            </div>
                                         ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* AQUÍ INYECTAMOS LOS RANKINGS */}
                                  <WeekRankings items={week.items} />
                                </div>
                              </TableCell>

                              <TableCell className="text-center">
                                  <div className="flex justify-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => onPrintWeek(week)} title="Imprimir PDF"><Printer className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="sm" onClick={() => handleExportExcel(week)} className="text-green-700 border-green-200 hover:bg-green-50" title="Descargar Excel">Excel</Button>
                                  </div>
                              </TableCell>
                              
                              <TableCell>
                                 <Input 
                                    defaultValue={week.adminComment || ''}
                                    placeholder={user?.role === 'admin' ? "Escriba una nota y presione Enter o haga clic fuera..." : "Sin comentarios"}
                                    onBlur={(e) => updateWeekComment(week.id, e.target.value)}
                                    className="min-w-[220px] bg-slate-50 text-sm"
                                    disabled={user?.role !== 'admin'}
                                 />
                              </TableCell>

                              <TableCell className="text-right">
                                  {user?.role === 'admin' && (week.status === WeekStatus.EnProgreso || week.status === WeekStatus.Pendiente) && (
                                      <Button size="sm" onClick={() => onFinalizeWeek(week)} className="bg-corporate-blue text-white hover:bg-corporate-blue/90">Finalizar Semana</Button>
                                  )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
        </div>
    );
};

const DashboardAdmin: React.FC = () => {
    const { finalizeWeek, deleteCurrentCount, user, weeksData, resetApplicationData } = useAppContext();
    const[isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const[showResetDataModal, setShowResetDataModal] = useState(false);
    const[deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const[weekToFinalize, setWeekToFinalize] = useState<WeekData | null>(null);
    const [observation, setObservation] = useState('');
    const [view, setView] = useState<'dashboard' | 'create' | 'detail' | 'print' | 'history' | 'users' | 'settings' | 'masterStock'>('dashboard');
    const[selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);

    const handleSelectWeek = (week: WeekData) => { setSelectedWeek(week); setView('detail'); };
    const handlePrintWeek = (week: WeekData) => { setSelectedWeek(week); setView('print'); };
    const handleBackToDashboard = () => { setSelectedWeek(null); setView('dashboard'); };
    const openFinalizeModal = (week: WeekData) => { setWeekToFinalize(week); setIsModalOpen(true); };
    const handleDeleteCount = () => { deleteCurrentCount(); setIsDeleteModalOpen(false); setDeleteConfirmationText(''); };

    const confirmFinalizeWeek = () => {
        if (weekToFinalize) {
            const today = new Date().toISOString().split('T')[0];
            if (weekToFinalize.endDate && today > weekToFinalize.endDate && !observation.trim()) {
                alert('Debe ingresar una observación por el cierre fuera de término.');
                return;
            }
            finalizeWeek(weekToFinalize.id, observation);
            setIsModalOpen(false);
            setWeekToFinalize(null);
            setObservation('');
        }
    };

    switch (view) {
        case 'create': return <CrearConteo onBack={handleBackToDashboard} />;
        case 'detail': return selectedWeek ? <AdminWeekDetailView week={selectedWeek} onBack={handleBackToDashboard} /> : null;
        case 'print': return selectedWeek ? <PrintView week={selectedWeek} onBack={handleBackToDashboard} /> : null;
        case 'history': return <HistoryDashboard onBack={handleBackToDashboard} />;
        case 'users': return <UserManagement onBack={handleBackToDashboard} />;
        case 'settings': return <Settings onBack={handleBackToDashboard} />;
        case 'masterStock': return <MasterStockManager onBack={handleBackToDashboard} />;
        case 'dashboard':
        default:
            return (
                <>
                    <DashboardView 
                        onShowCreate={() => setView('create')} 
                        onSelectWeek={handleSelectWeek} 
                        onPrintWeek={handlePrintWeek} 
                        onShowHistory={() => setView('history')}
                        onShowUsers={() => setView('users')}
                        onShowSettings={() => setView('settings')}
                        onShowMasterStock={() => setView('masterStock')}
                        onFinalizeWeek={openFinalizeModal}
                        onDeleteCount={() => setIsDeleteModalOpen(true)}
                        user={user}
                        onShowReset={() => setShowResetDataModal(true)}
                    />
                    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={confirmFinalizeWeek} title={`Finalizar ${weekToFinalize?.name}`}>
                        <p>¿Está seguro de que desea finalizar esta semana?</p>
                        {weekToFinalize?.endDate && new Date().toISOString().split('T')[0] > weekToFinalize.endDate && (
                            <div className="mt-4"><label className="block text-sm font-medium text-slate-700">Observación por Cierre Atrasado</label><textarea value={observation} onChange={(e) => setObservation(e.target.value)} className="w-full p-2 border rounded-md mt-1" placeholder="Ingrese el motivo del cierre fuera de término..." /></div>
                        )}
                    </Modal>
                    {showResetDataModal && <AlertDialog isOpen={true} onClose={() => setShowResetDataModal(false)} onConfirm={() => { resetApplicationData(); setShowResetDataModal(false); }} title="¿Reiniciar Todos los Datos?" description="Esta acción borrará todos los conteos, usuarios y configuraciones." confirmText="Sí, Reiniciar Todo" />}
                    <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteCount} title="Eliminar Conteo Actual" confirmDisabled={deleteConfirmationText !== `eliminar ${weeksData.length > 0 ? weeksData[0].name.split(' ')[0] : ''}`}>
                        <p className="font-semibold text-red-600">¡Atención! Esta acción es irreversible.</p>
                        <p className="mt-2">Escriba exactamente <span className="font-bold">eliminar {weeksData.length > 0 ? weeksData[0].name.split(' ')[0] : ''}</span> abajo.</p>
                        <Input type="text" value={deleteConfirmationText} onChange={(e) => setDeleteConfirmationText(e.target.value)} className="mt-4 w-full" />
                    </Modal>
                </>
            );
    }
};

export default DashboardAdmin;